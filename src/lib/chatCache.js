// The chat cache: query keys, fetchers, and the one place socket events are
// written into it.
//
// Hooks (useConversations / useConversation / useMessages) only read and
// patch this cache, so every screen showing a chat draws from the same copy,
// and a chat that isn't on screen still stays current. That is what keeps
// navigation instant: there is never a "fresh, empty" component state to
// load into.

import { listConversations, getConversation } from "../services/conversations";
import { listMessages } from "../services/messages";
import {
  applyPresence,
  previewText,
  timeLabel,
  toConversationView,
  toMessageView,
} from "./adapters";
import { onReconnect, onSocket } from "./socket";

// Every key carries the user id, so two accounts in one browser never share
// a cache entry.
export const chatKeys = {
  list: (meId) => ["conversations", meId],
  detailRoot: (meId) => ["conversation", meId],
  detail: (meId, id) => ["conversation", meId, id],
  messagesRoot: (meId) => ["messages", meId],
  messages: (meId, convId) => ["messages", meId, convId],
};

// ── Fetchers ──────────────────────────────────────────────────────────────

export const fetchConversations = async (meId) => {
  const rows = await listConversations();
  return (rows || []).map((r) => toConversationView(r, meId)).filter(Boolean);
};

/**
 * GET /conversations/:id returns the conversation itself, while the list
 * endpoint returns membership rows wrapping it. Reshape the former into the
 * latter so one adapter serves both.
 */
export const fetchConversation = async (meId, id) => {
  const data = await getConversation(id);
  if (!data) {
    const err = new Error("Conversation not found.");
    err.status = 404;
    throw err;
  }

  // My own membership row carries the per-user flags.
  const mine = (data.members || []).find((m) => m.profile?.id === meId);

  return toConversationView(
    {
      id: mine?.id ?? null,
      role: mine?.role ?? null,
      last_read_at: mine?.last_read_at ?? null,
      is_archived: mine?.is_archived ?? false,
      is_pinned: mine?.is_pinned ?? false,
      muted_until: mine?.muted_until ?? null,
      unread_count: 0,
      // This endpoint omits left_at/removed_at, so every row is active.
      conversation: {
        ...data,
        members: (data.members || []).map((m) => ({
          user_id: m.profile?.id,
          left_at: null,
          removed_at: null,
          profile: m.profile,
        })),
      },
    },
    meId,
  );
};

// ── A thread in the cache ───────────────────────────────────────────────────
//
// { messages: View[] (oldest first), receipts: { [userId]: { delivered_at,
//   read_at } } for every member but me, cursor, hasMore }

const time = (iso) => (iso ? new Date(iso).getTime() : NaN);
const later = (a, b) => (!a ? b : !b ? a : time(a) >= time(b) ? a : b);

/** Optimistic bubbles that only exist on this device until the POST lands. */
const isLocal = (m) =>
  String(m.id).startsWith("pending-") || m.status === "sending" || m.status === "failed";

export const emptyThread = () => ({ messages: [], receipts: {}, cursor: null, hasMore: false });

const toReceipts = (rows) =>
  Object.fromEntries(
    (rows ?? []).map((r) => [r.user_id, { delivered_at: r.delivered_at, read_at: r.read_at }]),
  );

/**
 * Fold a fresh newest page into what the cache already holds. Older pages we
 * loaded are kept as long as they meet the new page (no gap), and so are
 * bubbles still sending. Anything inside the page's window that the server no
 * longer returns (deleted for everyone) drops out.
 */
export const mergeLatest = (prev, next) => {
  if (!prev?.messages?.length) return next;

  const local = prev.messages.filter(isLocal);
  const server = prev.messages.filter((m) => !isLocal(m));
  const prevById = new Map(server.map((m) => [m.id, m]));
  const freshIds = new Set(next.messages.map((m) => m.id));
  const pending = local.filter((m) => !freshIds.has(m.id));

  // Fields the API doesn't send back but this device knew (a voice note's
  // measured length, a star set from this screen).
  const fresh = next.messages.map((m) => {
    const before = prevById.get(m.id);
    if (!before) return m;
    return {
      ...m,
      duration: m.duration ?? before.duration,
      starred: m.starred || before.starred,
    };
  });

  if (!fresh.length) return { ...next, messages: pending };

  const oldestFresh = time(fresh[0].created_at);
  const newestHeld = time(server[server.length - 1]?.created_at);
  const older =
    newestHeld >= oldestFresh ? server.filter((m) => time(m.created_at) < oldestFresh) : [];

  return {
    messages: [...older, ...fresh, ...pending],
    receipts: next.receipts,
    cursor: older.length ? prev.cursor : next.cursor,
    hasMore: older.length ? prev.hasMore : next.hasMore,
  };
};

/**
 * Newest page of a chat, merged into the cached copy. The first page also
 * brings each member's delivered/read marks, so ticks are fresh every time a
 * chat opens even though the messages painted from cache.
 */
export const fetchLatestMessages = async (qc, meId, convId) => {
  const page = await listMessages(convId);
  const next = {
    messages: (page?.messages ?? [])
      .map((m) => toMessageView(m, meId))
      .filter(Boolean)
      .reverse(),
    receipts: toReceipts(page?.receipts),
    cursor: page?.next_cursor ?? null,
    hasMore: Boolean(page?.next_cursor),
  };
  // Read after the await, so bubbles added while this was in flight survive.
  return mergeLatest(qc.getQueryData(chatKeys.messages(meId, convId)), next);
};

/** An older page (cursor paging) -> prepended. */
export const prependOlder = (data, page, meId) => {
  const held = new Set(data.messages.map((m) => m.id));
  const older = (page?.messages ?? [])
    .map((m) => toMessageView(m, meId))
    .filter((m) => m && !held.has(m.id))
    .reverse();
  return {
    ...data,
    messages: [...older, ...data.messages],
    cursor: page?.next_cursor ?? null,
    hasMore: Boolean(page?.next_cursor),
  };
};

export const appendMessage = (data, view) => {
  const base = data ?? emptyThread();
  if (!view || base.messages.some((m) => m.id === view.id)) return base;
  return { ...base, messages: [...base.messages, view] };
};

export const patchMessage = (data, id, changes) => {
  if (!data) return data;
  const next = data.messages.map((m) => (m.id === id ? { ...m, ...changes } : m));
  if (changes.id && changes.id !== id) {
    // Swapping a pending id for the real one: the socket echo of our own
    // send may already be in the list, so keep only the first copy.
    const first = next.findIndex((m) => m.id === changes.id);
    return { ...data, messages: next.filter((m, i) => m.id !== changes.id || i === first) };
  }
  return { ...data, messages: next };
};

export const dropMessage = (data, id) =>
  data ? { ...data, messages: data.messages.filter((m) => m.id !== id) } : data;

/** Push one member's delivered/read mark forward (never back). */
const advanceReceipt = (data, field, userId, at) => {
  if (!data) return data;
  const current = data.receipts?.[userId] ?? { delivered_at: null, read_at: null };
  const next = later(current[field], at);
  if (next === current[field]) return data;
  return { ...data, receipts: { ...data.receipts, [userId]: { ...current, [field]: next } } };
};

// ── Prefetch ──────────────────────────────────────────────────────────────

/** Warm a chat before it's opened (hover, or the top of the list at idle). */
export const prefetchMessages = (qc, meId, convId) =>
  qc.prefetchQuery({
    queryKey: chatKeys.messages(meId, convId),
    queryFn: () => fetchLatestMessages(qc, meId, convId),
    // A chat fetched in the last half minute is warm enough to open.
    staleTime: 30 * 1000,
  });

// ── Realtime ──────────────────────────────────────────────────────────────

/** A new message moves its chat to the top with a fresh preview. */
const bumpConversation = (list, msg, meId) => {
  const idx = list.findIndex((c) => c.id === msg.conversation_id);
  if (idx === -1) return null;
  const target = list[idx];
  // Already counted (a repeated socket event): don't bump unread twice.
  if (target.last_message?.id === msg.id) return list;
  const mine = msg.sender_id === meId;
  const updated = {
    ...target,
    last_message: {
      id: msg.id,
      text: previewText(msg),
      sender_id: msg.sender_id,
      type: msg.message_type,
      time: timeLabel(msg.created_at),
    },
    last_message_at: msg.created_at,
    unread_count: mine ? target.unread_count : target.unread_count + 1,
  };
  return [updated, ...list.filter((_, i) => i !== idx)];
};

/**
 * Write every chat socket event into the cache. Call once per signed-in user
 * (components/chat/RealtimeSync.jsx); returns the unsubscribe.
 */
export const startChatSync = (qc, meId) => {
  const listKey = chatKeys.list(meId);

  const onNew = (msg) => {
    const list = qc.getQueryData(listKey);
    if (list) {
      const bumped = bumpConversation(list, msg, meId);
      // First message of a chat we don't have yet: fetch the list again.
      if (bumped) qc.setQueryData(listKey, bumped);
      else qc.invalidateQueries({ queryKey: listKey });
    }
    // Only chats already in the cache; others load when opened.
    qc.setQueryData(chatKeys.messages(meId, msg.conversation_id), (data) =>
      data ? appendMessage(data, toMessageView(msg, meId)) : data,
    );
  };

  // My own read (here or in another tab) clears the badge; anyone else's
  // moves the ticks on my messages.
  const onRead = (e) => {
    if (e.user_id === meId) {
      qc.setQueryData(listKey, (list) =>
        list?.map((c) =>
          c.id === e.conversation_id && c.unread_count ? { ...c, unread_count: 0 } : c,
        ),
      );
      return;
    }
    qc.setQueryData(chatKeys.messages(meId, e.conversation_id), (data) =>
      advanceReceipt(data, "read_at", e.user_id, e.at),
    );
  };

  const onDelivered = (e) => {
    if (e.user_id === meId) return;
    qc.setQueryData(chatKeys.messages(meId, e.conversation_id), (data) =>
      advanceReceipt(data, "delivered_at", e.user_id, e.at),
    );
  };

  const onPresence = (e) => {
    qc.setQueryData(listKey, (list) => list?.map((c) => applyPresence(c, e)));
    qc.setQueriesData({ queryKey: chatKeys.detailRoot(meId) }, (c) =>
      c ? applyPresence(c, e) : c,
    );
  };

  // Events sent while the socket was down are gone: refetch what's on screen
  // now and mark the rest stale.
  const onBack = () => {
    qc.invalidateQueries({ queryKey: listKey });
    qc.invalidateQueries({ queryKey: chatKeys.detailRoot(meId) });
    qc.invalidateQueries({ queryKey: chatKeys.messagesRoot(meId) });
  };

  const offs = [
    onSocket("message:new", onNew),
    onSocket("receipt:read", onRead),
    onSocket("receipt:delivered", onDelivered),
    onSocket("presence:update", onPresence),
    onReconnect(onBack),
  ];
  return () => offs.forEach((off) => off());
};

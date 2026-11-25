// One cache for the whole app, saved to IndexedDB.
//
// This is how WhatsApp Web feels instant: chats and messages live on the
// device, every screen draws from that local copy immediately, and the
// network only brings it up to date in the background (plus socket pushes
// in between, see lib/chatCache.js). Moving between pages never blanks the
// list, and a reload paints from disk before the first request returns.

import { QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { createStore, del, get, set } from "idb-keyval";

const DAY = 24 * 60 * 60 * 1000;

/** How long a saved cache stays usable without the app being opened. */
export const CACHE_MAX_AGE = 7 * DAY;

/**
 * Bump when the shape of cached view models changes (lib/adapters.js), so old
 * saves are thrown away instead of being fed to new components.
 */
export const CACHE_BUSTER = "nextalk-cache-v1";

/** Only the newest messages of each chat are written to disk. */
const PERSISTED_MESSAGES_PER_CHAT = 50;

/** Query families that are worth keeping across reloads. */
const PERSISTED_KEYS = new Set(["conversations", "conversation", "messages"]);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Socket pushes keep the cache current, so a remount shows what's there
      // and only revalidates when it's older than this.
      staleTime: 60 * 1000,
      // Must be at least the persist maxAge, or restored chats get collected.
      gcTime: CACHE_MAX_AGE,
      refetchOnWindowFocus: true,
      // A 4xx (not a member, not found) won't fix itself on a retry.
      retry: (count, err) => count < 1 && !(err?.status >= 400 && err?.status < 500),
    },
  },
});

// ── Disk ──────────────────────────────────────────────────────────────────

const idb = typeof indexedDB !== "undefined" ? createStore("nextalk", "query-cache") : null;

const storage = idb
  ? {
      getItem: (key) => get(key, idb),
      setItem: (key, value) => set(key, value, idb),
      removeItem: (key) => del(key, idb),
    }
  : null;

/** Optimistic bubbles: they point at blob: URLs that die with the tab. */
const isLocalOnly = (m) =>
  String(m.id).startsWith("pending-") ||
  m.status === "sending" ||
  m.status === "failed" ||
  (typeof m.file_url === "string" && m.file_url.startsWith("blob:"));

/** Keep each chat's save small: the newest messages, nothing unsent. */
const trimThread = (data) => {
  if (!data?.messages) return data;
  const sent = data.messages.filter((m) => !isLocalOnly(m));
  const kept = sent.slice(-PERSISTED_MESSAGES_PER_CHAT);
  if (kept.length === sent.length) return { ...data, messages: kept };
  // Older history was cut, so paging must resume from the oldest kept row.
  return { ...data, messages: kept, cursor: kept[0]?.created_at ?? data.cursor, hasMore: true };
};

const toDisk = (client) =>
  JSON.stringify({
    ...client,
    clientState: {
      ...client.clientState,
      queries: client.clientState.queries.map((q) =>
        q.queryKey[0] === "messages"
          ? { ...q, state: { ...q.state, data: trimThread(q.state.data) } }
          : q,
      ),
    },
  });

export const persister = createAsyncStoragePersister({
  storage,
  key: "chat-cache",
  throttleTime: 1500,
  serialize: toDisk,
});

export const persistOptions = {
  persister,
  maxAge: CACHE_MAX_AGE,
  buster: CACHE_BUSTER,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) =>
      query.state.status === "success" && PERSISTED_KEYS.has(query.queryKey[0]),
  },
};

/** Forget everything, in memory and on disk (sign-out, account switch). */
export const clearChatCache = async () => {
  queryClient.clear();
  try {
    await persister.removeClient();
  } catch {
    // Nothing saved, or storage unavailable: either way nothing to clear.
  }
};

import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "../context/UserContext";
import { listMessages } from "../services/messages";
import {
  appendMessage,
  chatKeys,
  dropMessage,
  fetchLatestMessages,
  patchMessage,
  prependOlder,
} from "../lib/chatCache";

const EMPTY = [];

const time = (iso) => (iso ? new Date(iso).getTime() : NaN);
const reached = (mark, createdAt) => Boolean(mark) && time(mark) >= time(createdAt);

/**
 * Ticks for one of your own messages, from how far every other member has
 * received / read the chat:
 *   sent       ✓      saved on the server
 *   delivered  ✓✓     reached every other member's device
 *   read       ✓✓ 🟠  read by every other member
 */
const withTicks = (msg, receipts) => {
  if (!msg.is_mine || msg.status === "sending" || msg.status === "failed") return msg;
  if (String(msg.id).startsWith("pending-")) return msg;

  const others = Object.values(receipts);
  if (!others.length) return msg;

  const c = msg.created_at;
  const status =
    msg.status === "read" || others.every((r) => reached(r.read_at, c))
      ? "read"
      : others.every((r) => reached(r.delivered_at, c) || reached(r.read_at, c))
        ? "delivered"
        : msg.status;

  return status === msg.status ? msg : { ...msg, status };
};

/**
 * Messages for one conversation, oldest-first (the order the thread renders),
 * from the shared chat cache.
 *
 * A chat you've opened before paints instantly from cache (memory, or
 * IndexedDB after a reload), then the newest page is refetched in the
 * background every time it opens, so ticks and edits are never stale.
 * New messages and receipts arrive through startChatSync even while the chat
 * isn't on screen.
 */
export const useMessages = (convId) => {
  const { user } = useUser();
  const meId = user?.id;
  const qc = useQueryClient();
  const enabled = Boolean(convId && meId);
  const [loadingMore, setLoadingMore] = useState(false);

  const query = useQuery({
    queryKey: chatKeys.messages(meId, convId),
    queryFn: () => fetchLatestMessages(qc, meId, convId),
    enabled,
    // Always revalidate on open; the cached copy only covers the wait.
    staleTime: 0,
  });

  const data = query.data;

  const loadOlder = useCallback(async () => {
    const key = chatKeys.messages(meId, convId);
    const cursor = qc.getQueryData(key)?.cursor;
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await listMessages(convId, { cursor });
      qc.setQueryData(key, (prev) => (prev ? prependOlder(prev, page, meId) : prev));
    } catch {
      // Keep what we already have; the banner stays so the user can retry.
    } finally {
      setLoadingMore(false);
    }
  }, [qc, meId, convId, loadingMore]);

  // These bind to the chat they were created for, so an upload that finishes
  // after you switched chats still lands in the right one.
  /** Insert a message locally (optimistic send, or after a successful POST). */
  const append = useCallback(
    (view) => qc.setQueryData(chatKeys.messages(meId, convId), (prev) => appendMessage(prev, view)),
    [qc, meId, convId],
  );

  const patch = useCallback(
    (id, changes) =>
      qc.setQueryData(chatKeys.messages(meId, convId), (prev) => patchMessage(prev, id, changes)),
    [qc, meId, convId],
  );

  const drop = useCallback(
    (id) => qc.setQueryData(chatKeys.messages(meId, convId), (prev) => dropMessage(prev, id)),
    [qc, meId, convId],
  );

  const messages = useMemo(
    () => (data?.messages ?? EMPTY).map((m) => withTicks(m, data?.receipts ?? {})),
    [data],
  );

  return {
    messages,
    loading: enabled && query.isPending,
    error: data ? null : (query.error?.message ?? null),
    hasMore: Boolean(data?.hasMore),
    loadingMore,
    loadOlder,
    reload: query.refetch,
    append,
    patch,
    drop,
  };
};

export default useMessages;

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "../context/UserContext";
import { chatKeys, fetchConversations } from "../lib/chatCache";

const EMPTY = [];

/**
 * The chat list, as view models, from the shared chat cache.
 *
 * Opening the chats page again (or any other screen that lists chats) shows
 * the cached list at once and revalidates in the background; socket pushes
 * keep it current in between (lib/chatCache.js -> startChatSync).
 *
 * Returns { conversations, loading, error, reload, patch, remove }.
 * `loading` is only true when there is nothing cached to show yet.
 * `patch` applies a local change immediately so the UI stays responsive while
 * the API call is in flight.
 */
export const useConversations = () => {
  const { user } = useUser();
  const meId = user?.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: chatKeys.list(meId),
    queryFn: () => fetchConversations(meId),
    enabled: Boolean(meId),
  });

  const patch = useCallback(
    (id, changes) =>
      qc.setQueryData(chatKeys.list(meId), (prev) =>
        prev?.map((c) => (c.id === id ? { ...c, ...changes } : c)),
      ),
    [qc, meId],
  );

  const remove = useCallback(
    (id) => qc.setQueryData(chatKeys.list(meId), (prev) => prev?.filter((c) => c.id !== id)),
    [qc, meId],
  );

  return {
    conversations: query.data ?? EMPTY,
    loading: Boolean(meId) && query.isPending,
    // A failed background refresh keeps showing the cached list.
    error: query.data ? null : (query.error?.message ?? null),
    reload: query.refetch,
    patch,
    remove,
  };
};

export default useConversations;

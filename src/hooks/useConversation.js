import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "../context/UserContext";
import { chatKeys, fetchConversation } from "../lib/chatCache";

/**
 * One conversation, as a view model, from the shared chat cache.
 *
 * Opening a chat from the list paints its header straight from the list's
 * copy, then confirms it against GET /conversations/:id in the background.
 * Live presence is written into the cache by startChatSync.
 */
export const useConversation = (id) => {
  const { user } = useUser();
  const meId = user?.id;
  const qc = useQueryClient();
  const enabled = Boolean(id && meId);

  const query = useQuery({
    queryKey: chatKeys.detail(meId, id),
    queryFn: () => fetchConversation(meId, id),
    enabled,
    // Always confirm on open: mute / archive / membership may have changed.
    staleTime: 0,
    placeholderData: () => qc.getQueryData(chatKeys.list(meId))?.find((c) => c.id === id),
  });

  return {
    conversation: query.data ?? null,
    loading: enabled && query.isPending,
    error: query.data ? null : (query.error?.message ?? null),
    reload: query.refetch,
  };
};

export default useConversation;

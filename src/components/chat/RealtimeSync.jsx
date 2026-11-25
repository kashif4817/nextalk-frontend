import { useEffect } from "react";
import { useIsRestoring, useQueryClient } from "@tanstack/react-query";
import { useUser } from "../../context/UserContext";
import { startChatSync } from "../../lib/chatCache";
import { clearChatCache } from "../../lib/queryClient";

// Query families keyed [family, userId, ...] (see chatKeys).
const CHAT_FAMILIES = new Set(["conversations", "conversation", "messages"]);

/**
 * Mounted once for the whole app (App.jsx). Keeps the chat cache in step with
 * the socket even while no chat screen is open, and keeps one account's
 * cached chats from ever reaching another.
 */
const RealtimeSync = () => {
  const qc = useQueryClient();
  const { user, loading } = useUser();
  const meId = user?.id ?? null;
  // Wait until the saved cache has been read back from disk; clearing before
  // that would race the restore.
  const restoring = useIsRestoring();

  useEffect(() => {
    if (!meId) return;
    return startChatSync(qc, meId);
  }, [qc, meId]);

  useEffect(() => {
    if (restoring || loading) return;
    if (!meId) {
      // Signed out (or the session expired): nothing private stays on disk.
      clearChatCache();
      return;
    }
    // Signed in: drop anything cached for a different account on this browser.
    qc.removeQueries({
      predicate: (q) => CHAT_FAMILIES.has(q.queryKey[0]) && q.queryKey[1] !== meId,
    });
  }, [qc, meId, loading, restoring]);

  return null;
};

export default RealtimeSync;

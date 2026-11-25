import { useCallback, useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { listStarred } from "../services/messages";
import { previewText, timeLabel, toUserView } from "../lib/adapters";

/** Starred messages across all conversations, newest first. */
export const useStarred = () => {
  const { user } = useUser();
  const meId = user?.id;

  const [starred, setStarred] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!meId) return;
    try {
      setError(null);
      const rows = await listStarred();
      setStarred(
        (rows || [])
          .filter((row) => row.message)
          .map((row) => {
            const m = row.message;
            const sender = toUserView(m.sender);
            return {
              id: row.id,
              message_id: m.id,
              conv_id: m.conversation_id,
              sender: m.sender_id === meId ? "You" : sender?.display_name ?? "Unknown",
              text: previewText(m),
              time: timeLabel(m.created_at),
              date: new Date(m.created_at).toLocaleDateString([], {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
            };
          }),
      );
    } catch (e) {
      setError(e.message || "Could not load starred messages.");
    } finally {
      setLoading(false);
    }
  }, [meId]);

  useEffect(() => {
    if (!meId) {
      setStarred([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    load();
  }, [meId, load]);

  const remove = useCallback((rowId) => {
    setStarred((prev) => prev.filter((s) => s.id !== rowId));
  }, []);

  return { starred, loading, error, reload: load, remove };
};

export default useStarred;

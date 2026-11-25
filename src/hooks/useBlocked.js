import { useCallback, useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { listBlocked } from "../services/blocks";
import { toUserView } from "../lib/adapters";

/** Users you have blocked. `block_row_id` is what DELETE /blocks/:id wants. */
export const useBlocked = () => {
  const { user } = useUser();
  const meId = user?.id;

  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!meId) return;
    try {
      setError(null);
      const rows = await listBlocked();
      setBlocked(
        (rows || [])
          .map((row) => {
            const view = toUserView(row.blocked);
            return view ? { ...view, block_row_id: row.id, is_blocked: true } : null;
          })
          .filter(Boolean),
      );
    } catch (e) {
      setError(e.message || "Could not load blocked users.");
    } finally {
      setLoading(false);
    }
  }, [meId]);

  useEffect(() => {
    if (!meId) {
      setBlocked([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    load();
  }, [meId, load]);

  const remove = useCallback((rowId) => {
    setBlocked((prev) => prev.filter((b) => b.block_row_id !== rowId));
  }, []);

  return { blocked, loading, error, reload: load, remove };
};

export default useBlocked;

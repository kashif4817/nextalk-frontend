import { useCallback, useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { listContacts } from "../services/contacts";
import { toUserView } from "../lib/adapters";

/** Saved contacts, flattened to user views with the nickname carried over. */
export const useContacts = () => {
  const { user } = useUser();
  const meId = user?.id;

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!meId) return;
    try {
      setError(null);
      const rows = await listContacts();
      setContacts(
        (rows || [])
          .map((row) => {
            const view = toUserView(row.contact);
            if (!view) return null;
            return {
              ...view,
              contact_row_id: row.id,
              nickname: row.nickname ?? null,
              // Nickname wins in lists, falling back to the real name.
              display_name: row.nickname || view.display_name,
              is_contact: true,
            };
          })
          .filter(Boolean),
      );
    } catch (e) {
      setError(e.message || "Could not load contacts.");
    } finally {
      setLoading(false);
    }
  }, [meId]);

  useEffect(() => {
    if (!meId) {
      setContacts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    load();
  }, [meId, load]);

  const remove = useCallback((userId) => {
    setContacts((prev) => prev.filter((c) => c.id !== userId));
  }, []);

  return { contacts, loading, error, reload: load, remove };
};

export default useContacts;

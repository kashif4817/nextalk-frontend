import { useCallback, useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { getAllUsers, searchUsers } from "../services/users";
import { toUserView } from "../lib/adapters";

/**
 * Discoverable people. With a search term it queries the server; without one
 * it lists everyone. The API already excludes you and anyone involved in a
 * block in either direction.
 */
export const usePeople = (search = "") => {
  const { user } = useUser();
  const meId = user?.id;

  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!meId) return;
    try {
      setError(null);
      const term = search.trim();
      const rows = term ? await searchUsers(term) : await getAllUsers();
      setPeople((rows || []).map(toUserView).filter(Boolean));
    } catch (e) {
      setError(e.message || "Could not load people.");
    } finally {
      setLoading(false);
    }
  }, [meId, search]);

  useEffect(() => {
    if (!meId) {
      setPeople([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    // Debounce typing so each keystroke does not fire a request.
    const timer = setTimeout(load, search.trim() ? 300 : 0);
    return () => clearTimeout(timer);
  }, [meId, search, load]);

  return { people, loading, error, reload: load };
};

export default usePeople;

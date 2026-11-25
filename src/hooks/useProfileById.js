import { useCallback, useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { getUser } from "../services/users";
import { toUserView } from "../lib/adapters";

/** One user's public profile. */
export const useProfileById = (id) => {
  const { user } = useUser();
  const meId = user?.id;

  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!id || !meId) return;
    try {
      setError(null);
      const row = await getUser(id);
      setPerson(toUserView(row));
      if (!row) setError("User not found.");
    } catch (e) {
      setError(e.message || "Could not load this profile.");
      setPerson(null);
    } finally {
      setLoading(false);
    }
  }, [id, meId]);

  useEffect(() => {
    if (!id || !meId) {
      setPerson(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    load();
  }, [id, meId, load]);

  return { person, loading, error, reload: load, isMe: id === meId };
};

export default useProfileById;

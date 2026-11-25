import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import supabase from "../utils/supabaseClient";
import { connectSocket, disconnectSocket } from "../lib/socket";

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);   // resolving the session
  const [nonce, setNonce] = useState(0);          // bump to refetch the profile
  // Tagged with the user it belongs to, so a stale fetch can never be shown
  // against a different account.
  const [profileRecord, setProfileRecord] = useState(null);

  const user = session?.user ?? null;
  const userId = user?.id ?? null;

  // ── Session ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;

    // getSession() waits for supabase-js to finish any OAuth code exchange
    // sitting in the URL, so this is safe to call even on /auth/callback.
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      // Stays synchronous on purpose: calling back into supabase from inside
      // this callback can deadlock on the auth lock. The profile is fetched by
      // the effect below, keyed on the user id.
      setSession(next ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // ── Profile, keyed off the signed-in user ────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    let active = true;

    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (!active) return;

      if (error) {
        // Most likely a missing RLS select policy. Don't wedge the app over it
        // — treat it as "no profile yet" but make the cause visible.
        console.error("[UserContext] profile fetch failed:", error.message);
        setProfileRecord({ userId, data: null });
      } else {
        setProfileRecord({ userId, data: data ?? null });
      }
    })();

    return () => {
      active = false;
    };
  }, [userId, nonce]);

  // Derived rather than stored, so signing out clears the profile with no
  // extra setState and no cascading render.
  const profile = profileRecord?.userId === userId ? profileRecord.data : null;
  const profileLoading = Boolean(userId) && profileRecord?.userId !== userId;

  // ── Realtime socket, tied to the session ────────────────────────────────
  useEffect(() => {
    if (!userId) {
      disconnectSocket();
      return;
    }

    let cancelled = false;
    connectSocket(userId).then((s) => {
      // Session ended while the handshake was in flight.
      if (cancelled && s) disconnectSocket();
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Tear the socket down for good when the provider unmounts.
  useEffect(() => () => disconnectSocket(), []);

  const refreshProfile = useCallback(() => setNonce((n) => n + 1), []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // onAuthStateChange clears session + profile.
  }, []);

  return (
    <UserContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        profileLoading,
        isAuthenticated: Boolean(session),
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside UserProvider");
  return ctx;
};

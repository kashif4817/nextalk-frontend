import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const TEMP_MAX_CHARS = 2000;
/** Matches RECONNECT_GRACE_MS on the server: how long a dropped person has to return. */
export const RECONNECT_GRACE_SECONDS = 20;

// Ticks only ever move forward: sending → sent (✓) → delivered (✓✓) → seen (amber ✓✓).
const RANK = { failed: -1, sending: 0, sent: 1, delivered: 2, seen: 3 };

const newId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

// ── Tabs of the same browser ────────────────────────────────────────────────
// A person is in a temp chat from one tab at a time. Opening the link in
// another tab of the same browser moves the chat there (like WhatsApp Web's
// "Use here") instead of joining as a second person. Tabs coordinate over a
// BroadcastChannel, in memory only; nothing is stored.
//
//   new tab                         tab holding the seat
//   "seat?"            ──────────▶
//                      ◀──────────  "seat-held"
//   "handoff-request"  ──────────▶  stops listening, sends the session
//                      ◀──────────  "handoff" { token, messages, … }
//   rejoins with the token
//   "handoff-done"     ──────────▶  disconnects quietly → "moved"
//   (or "handoff-failed": it reconnects and carries on)

const TAB_CHANNEL = "nextalk-temp-chat";
const openChannel = () =>
  typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(TAB_CHANNEL);

/**
 * Ask whichever tab of this browser holds our seat in `roomId` to hand it
 * over. Resolves { session, finish(ok) }, or null when no tab does.
 * `signal` stops it before anything is requested (effect cleanup).
 */
const requestHandoff = (roomId, signal) =>
  new Promise((resolve) => {
    const channel = openChannel();
    if (!channel) return resolve(null);

    const nonce = newId();
    let timer = null;
    let settled = false;
    const giveUp = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      channel.close();
      resolve(null);
    };

    channel.onmessage = (e) => {
      const m = e.data;
      if (settled || !m || m.nonce !== nonce) return;
      if (m.type === "seat-held") {
        if (signal?.aborted) return giveUp();
        clearTimeout(timer);
        timer = setTimeout(giveUp, 3000);
        channel.postMessage({ type: "handoff-request", roomId, nonce });
      } else if (m.type === "handoff") {
        settled = true;
        clearTimeout(timer);
        resolve({
          session: m.session,
          finish: (ok) => {
            channel.postMessage({ type: ok ? "handoff-done" : "handoff-failed", nonce });
            channel.close();
          },
        });
      }
    };

    // Generous: the tab holding the seat is usually in the background, where
    // Chrome can be slow to respond. A real guest only waits this long once.
    timer = setTimeout(giveUp, 1000);
    channel.postMessage({ type: "seat?", roomId, nonce });
  });

/**
 * One anonymous temp chat over the `/temp` socket namespace.
 *
 * Messages exist only in this hook's state: nothing is written to
 * localStorage, IndexedDB or the shared chat cache, and the server keeps no
 * copy. Ending the chat — either side leaving, closing the tab, going back —
 * wipes them.
 *
 * status:  idle → connecting → waiting → active ⇄ away → ended   (creator)
 *          joining → active ⇄ away → ended                       (guest)
 *          moved      this tab handed the chat to another tab of the browser
 * endReason: you_left | cancelled | left | expired | not_found | full | rate_limited | connection
 */
export const useTempChat = ({ mode, roomId: joinRoomId }) => {
  const socketRef = useRef(null);
  const sessionRef = useRef({ roomId: null, token: null });

  const [status, setStatus] = useState(mode === "join" ? "joining" : "idle");
  const [endReason, setEndReason] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [peerTyping, setPeerTyping] = useState(false);
  const [connected, setConnected] = useState(true);
  // When the other person dropped (status "away"), for the reconnect countdown.
  const [awaySince, setAwaySince] = useState(null);
  // Whether they have the chat in front of them (tab visible and focused).
  const [peerFocused, setPeerFocused] = useState(true);
  // Their messages we've received but not yet reported as seen.
  const unseenRef = useRef(new Set());

  // Latest values for the tab-handoff handler, which outlives renders.
  const messagesRef = useRef(messages);
  const peerFocusedRef = useRef(peerFocused);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    peerFocusedRef.current = peerFocused;
  }, [peerFocused]);

  const peerAway = useCallback(() => {
    setStatus("away");
    setPeerTyping(false);
    setAwaySince(Date.now());
  }, []);

  const peerHere = useCallback(() => {
    setStatus("active");
    setAwaySince(null);
    // They re-announce their focus as soon as they're in.
    setPeerFocused(true);
  }, []);

  /** Status after (re)taking a seat, from the server's answer. */
  const applySeat = useCallback(
    (res) => {
      if (res.peers < 2) setStatus("waiting");
      else if (res.peerOnline) peerHere();
      else peerAway();
    },
    [peerAway, peerHere],
  );

  const upgrade = useCallback((ids, status) => {
    const wanted = new Set(ids);
    setMessages((prev) =>
      prev.map((m) =>
        wanted.has(m.id) && (RANK[m.status] ?? 0) < RANK[status] ? { ...m, status } : m,
      ),
    );
  }, []);

  /** Close the socket; `notify` tells the server to end the room for both. */
  const teardown = useCallback((notify) => {
    const socket = socketRef.current;
    socketRef.current = null;
    if (socket) {
      if (notify && sessionRef.current.token) socket.emit("room:leave");
      socket.removeAllListeners();
      socket.io.removeAllListeners();
      socket.disconnect();
    }
    sessionRef.current = { roomId: null, token: null };
  }, []);

  const end = useCallback(
    (reason, notify = false) => {
      teardown(notify);
      setMessages([]); // the chat disappears with the room
      unseenRef.current.clear();
      setPeerTyping(false);
      setEndReason(reason);
      setStatus("ended");
    },
    [teardown],
  );

  /** Open the socket, wire every event, then hand it to `onReady` once. */
  const connect = useCallback(
    (onReady) => {
      teardown(false);
      const socket = io(`${BASE}/temp`, {
        transports: ["websocket"],
        // Its own connection, separate from the signed-in app socket.
        forceNew: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      socketRef.current = socket;
      let ready = false;

      socket.on("connect", () => {
        setConnected(true);
        if (!ready) {
          ready = true;
          onReady(socket);
          return;
        }
        // Back after a network drop: reclaim our seat within the grace period.
        const { roomId, token } = sessionRef.current;
        if (!token) return;
        socket.emit("room:rejoin", { roomId, token }, (res) => {
          if (!res?.ok) end("left");
          else applySeat(res);
        });
      });

      socket.on("disconnect", () => setConnected(false));
      socket.io.on("reconnect_failed", () => end("connection"));

      socket.on("peer:joined", peerHere);
      socket.on("peer:away", peerAway);
      socket.on("peer:back", peerHere);
      socket.on("room:ended", ({ reason } = {}) =>
        end(reason === "expired" ? "expired" : "left"),
      );

      socket.on("msg", (m) => {
        if (!m?.id || typeof m.text !== "string") return;
        setPeerTyping(false);
        setMessages((prev) =>
          prev.some((x) => x.id === m.id)
            ? prev
            : [...prev, { id: m.id, text: m.text, at: m.at, mine: false }],
        );
        // Reached this browser: grey ✓✓ for them. "Seen" waits until it's on screen.
        unseenRef.current.add(m.id);
        socket.emit("msg:received", { id: m.id });
      });

      socket.on("msg:received", ({ id } = {}) => id && upgrade([id], "delivered"));
      socket.on("msg:seen", ({ ids } = {}) => Array.isArray(ids) && upgrade(ids, "seen"));

      socket.on("typing", ({ on } = {}) => setPeerTyping(Boolean(on)));
      socket.on("peer:focus", ({ on } = {}) => setPeerFocused(Boolean(on)));
    },
    [teardown, end, applySeat, peerAway, peerHere, upgrade],
  );

  /** Take a seat we already own (after a failed handoff) on a fresh socket. */
  const rejoin = useCallback(
    (id, token) => {
      connect((socket) => {
        socket.emit("room:rejoin", { roomId: id, token }, (res) => {
          if (!res?.ok) return end("left");
          sessionRef.current = { roomId: id, token };
          applySeat(res);
        });
      });
    },
    [connect, end, applySeat],
  );

  /** Creator: open a new room and get a link to share. */
  const start = useCallback(() => {
    setEndReason(null);
    setMessages([]);
    setStatus("connecting");
    connect((socket) => {
      socket.emit("room:create", null, (res) => {
        if (!res?.ok) return end(res?.reason || "connection");
        sessionRef.current = { roomId: res.roomId, token: res.token };
        setRoomId(res.roomId);
        setStatus("waiting");
      });
    });
  }, [connect, end]);

  /** Guest: take the second seat in the room from the link. */
  const join = useCallback(() => {
    if (!joinRoomId) return;
    setStatus("joining");
    connect((socket) => {
      socket.emit("room:join", { roomId: joinRoomId }, (res) => {
        if (!res?.ok) return end(res?.reason || "connection");
        sessionRef.current = { roomId: joinRoomId, token: res.token };
        setRoomId(joinRoomId);
        if (res.peerOnline === false) peerAway();
        else peerHere();
      });
    });
  }, [joinRoomId, connect, end, peerAway, peerHere]);

  /** Continue, in this tab, the chat another tab just handed over. */
  const adoptHandoff = useCallback(
    ({ session, finish }) => {
      setRoomId(session.roomId);
      setMessages(session.messages || []);
      unseenRef.current = new Set(session.unseen || []);
      setPeerFocused(session.peerFocused ?? true);

      connect((socket) => {
        socket.emit("room:rejoin", { roomId: session.roomId, token: session.token }, (res) => {
          if (!res?.ok) {
            finish(false);
            return end("not_found");
          }
          sessionRef.current = { roomId: session.roomId, token: session.token };
          finish(true);
          applySeat(res);
        });
      });
    },
    [connect, end, applySeat],
  );

  // Guest link: if this browser is already in the chat (another tab), move
  // it here; otherwise join as the second person.
  useEffect(() => {
    if (mode !== "join" || !joinRoomId) return;
    const controller = new AbortController();
    requestHandoff(joinRoomId, controller.signal).then((handoff) => {
      if (controller.signal.aborted) return handoff?.finish(false);
      if (handoff) adoptHandoff(handoff);
      else join();
    });
    return () => controller.abort();
  }, [mode, joinRoomId, adoptHandoff, join]);

  /** This tab was left behind by a handoff: pull the chat back ("Use here"). */
  const moveHere = useCallback(() => {
    const id = roomId;
    if (!id) return;
    setStatus("joining");
    requestHandoff(id).then((handoff) => {
      if (handoff) adoptHandoff(handoff);
      else end("not_found");
    });
  }, [roomId, adoptHandoff, end]);

  // While this tab holds a seat, answer other tabs asking for it.
  const holding = status === "waiting" || status === "active" || status === "away";
  useEffect(() => {
    if (!holding) return;
    const channel = openChannel();
    if (!channel) return;
    let handoff = null; // { nonce, timer } while handing over

    const abort = () => {
      if (!handoff) return;
      clearTimeout(handoff.timer);
      handoff = null;
      const { roomId: id, token } = sessionRef.current;
      if (token) rejoin(id, token); // listeners were dropped; wire up again
    };

    channel.onmessage = (e) => {
      const m = e.data || {};
      const session = sessionRef.current;

      if (handoff) {
        if (m.nonce !== handoff.nonce) return;
        if (m.type === "handoff-failed") abort();
        if (m.type === "handoff-done") {
          clearTimeout(handoff.timer);
          handoff = null;
          // The other tab has our seat now: leave quietly, without ending the room.
          const socket = socketRef.current;
          socketRef.current = null;
          sessionRef.current = { roomId: session.roomId, token: null };
          socket?.disconnect();
          setMessages([]);
          unseenRef.current.clear();
          setPeerTyping(false);
          setStatus("moved");
        }
        return;
      }

      if (!session.token || m.roomId !== session.roomId) return;

      if (m.type === "seat?") {
        channel.postMessage({ type: "seat-held", nonce: m.nonce });
      } else if (m.type === "handoff-request") {
        // Stop reacting here; the new tab takes over the conversation.
        const socket = socketRef.current;
        socket?.removeAllListeners();
        socket?.io.removeAllListeners();
        handoff = { nonce: m.nonce, timer: setTimeout(abort, 5000) };
        channel.postMessage({
          type: "handoff",
          nonce: m.nonce,
          session: {
            roomId: session.roomId,
            token: session.token,
            // An unanswered send has almost certainly reached the server.
            messages: messagesRef.current.map((msg) =>
              msg.status === "sending" ? { ...msg, status: "sent" } : msg,
            ),
            unseen: [...unseenRef.current],
            peerFocused: peerFocusedRef.current,
          },
        });
      }
    };

    return () => {
      if (handoff) clearTimeout(handoff.timer);
      channel.close();
    };
  }, [holding, rejoin]);

  // Leaving the page in any way — back, close, refresh, navigating — ends it.
  useEffect(() => {
    const onPageHide = () => teardown(true);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      teardown(true);
    };
  }, [teardown]);

  const send = useCallback((text) => {
    const socket = socketRef.current;
    const body = text.trim().slice(0, TEMP_MAX_CHARS);
    if (!socket || !body) return false;

    const id = newId();
    setMessages((prev) => [
      ...prev,
      { id, text: body, at: new Date().toISOString(), mine: true, status: "sending" },
    ]);
    socket.timeout(8000).emit("msg", { id, text: body }, (err, res) => {
      setMessages((prev) =>
        prev.map((m) =>
          // The "received" echo can beat the ack; never downgrade it.
          m.id === id && m.status === "sending"
            ? { ...m, status: !err && res?.ok ? "sent" : "failed" }
            : m,
        ),
      );
    });
    return true;
  }, []);

  const setTyping = useCallback((on) => {
    socketRef.current?.emit("typing", { on });
  }, []);

  /** Tell them whether the chat is in front of us ("online" vs "away" for them). */
  const setFocus = useCallback((on) => {
    socketRef.current?.emit("focus", { on });
  }, []);

  /** Call while the chat is actually on screen: their messages turn amber ✓✓. */
  const markSeen = useCallback(() => {
    const socket = socketRef.current;
    const ids = [...unseenRef.current];
    if (!socket?.connected || !ids.length) return;
    unseenRef.current.clear();
    socket.emit("msg:seen", { ids });
  }, []);

  /** End it for both sides. `reason` picks the closing message ("cancelled" while waiting). */
  const leave = useCallback(
    (reason) => end(typeof reason === "string" ? reason : "you_left", true),
    [end],
  );

  return {
    status,
    endReason,
    roomId,
    messages,
    peerTyping,
    peerFocused,
    connected,
    awaySince,
    start,
    moveHere,
    send,
    setTyping,
    setFocus,
    markSeen,
    leave,
  };
};

export default useTempChat;

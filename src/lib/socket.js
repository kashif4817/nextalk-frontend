import { io } from "socket.io-client";
import supabase from "../utils/supabaseClient";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

let socket = null;
let socketUserId = null;

// Listeners live here rather than on a socket, so a hook can subscribe before
// the socket exists (it connects asynchronously after sign-in) and keeps its
// subscription when the socket is rebuilt.
const listeners = new Map(); // event -> Set<handler>
const reconnectHandlers = new Set();

const attachAll = (s) => {
  for (const [event, handlers] of listeners) {
    for (const handler of handlers) s.on(event, handler);
  }
};

/**
 * Connect (once per user). The token is fetched on every (re)connect, so a
 * reconnect after the access token has been refreshed still authenticates.
 *
 * Returns null when nobody is signed in.
 */
export const connectSocket = async (userId) => {
  if (socket && socketUserId === userId) return socket;

  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) return null;

  // A socket built for a different user must not be reused.
  if (socket) disconnectSocket();

  let connectedBefore = false;

  socket = io(BASE, {
    auth: (cb) => {
      supabase.auth
        .getSession()
        .then(({ data: d }) => cb({ token: d.session?.access_token }));
    },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    autoConnect: true,
  });
  socketUserId = userId;

  attachAll(socket);

  // Events sent while we were disconnected are gone; let views refetch.
  socket.on("connect", () => {
    if (connectedBefore) reconnectHandlers.forEach((h) => h());
    connectedBefore = true;
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
  socketUserId = null;
};

/**
 * Subscribe while a component is mounted. Works before the socket exists.
 * Returns an unsubscribe function, so it drops straight into a useEffect
 * cleanup.
 */
export const onSocket = (event, handler) => {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(handler);
  socket?.on(event, handler);

  return () => {
    listeners.get(event)?.delete(handler);
    socket?.off(event, handler);
  };
};

/** Called after the socket comes back from a dropped connection. */
export const onReconnect = (handler) => {
  reconnectHandlers.add(handler);
  return () => reconnectHandlers.delete(handler);
};

/** Fire-and-forget; silently skipped while offline. */
export const emitSocket = (event, payload) => {
  if (socket?.connected) socket.emit(event, payload);
};

export default {
  connectSocket,
  getSocket,
  disconnectSocket,
  onSocket,
  onReconnect,
  emitSocket,
};

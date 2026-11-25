import axios from "axios";
import supabase from "./supabaseClient";

// The backend mounts every router under /api (see nextalk-backend/index.js).
const ROOT = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(
  /\/+$/,
  ""
);

const api = axios.create({
  baseURL: `${ROOT}/api`,
  withCredentials: true,
  timeout: 30000,
});

// ── Request: attach the current Supabase access token ──────────────────────
// authMiddleware reads `Authorization: Bearer <token>` and rejects anything
// else, so this runs per-request rather than once at module load — the token
// rotates and a cached one would start 401ing mid-session.
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Let the browser set multipart boundaries itself.
  if (config.data instanceof FormData) delete config.headers["Content-Type"];

  return config;
});

// ── Response: collapse axios errors into a readable Error ──────────────────
// Callers do `catch (e) { toast.error(e.message) }`, so the backend's own
// `message` field has to survive the trip.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const payload = error.response?.data;

    let message =
      payload?.message ||
      payload?.error ||
      error.message ||
      "Something went wrong.";

    if (error.code === "ECONNABORTED") message = "The request timed out.";
    else if (!error.response)
      message = "Can't reach the server. Is the backend running?";
    else if (status === 401) message = payload?.message || "Your session expired. Sign in again.";
    else if (status === 413) message = "That file is too large.";

    const normalized = new Error(message);
    normalized.status = status;
    normalized.payload = payload;
    normalized.original = error;
    return Promise.reject(normalized);
  }
);

/**
 * Every controller answers with `{ success, message, data }` (see
 * utils/sendResponse.js), so services only ever want the `data` half.
 */
export const unwrap = (promise) => promise.then((res) => res.data?.data);

export default api;

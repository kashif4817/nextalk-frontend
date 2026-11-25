import supabase from "../utils/supabaseClient";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Stream a reply from Gemini via the backend.
 *
 * The endpoint is Server-Sent Events over POST, so EventSource is unusable
 * (it only does GET and cannot send headers) — this reads the body stream by
 * hand instead.
 *
 * @param message       prompt text
 * @param onChunk       called with each text fragment as it arrives
 * @param signal        optional AbortSignal to cancel mid-stream
 * @returns the full concatenated reply
 */
export const streamAIChat = async (message, onChunk, signal) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("You must be signed in to use AI chat.");

  const res = await fetch(`${BASE}/api/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
    signal,
  });

  if (!res.ok) {
    // Errors arrive as ordinary JSON, before the stream starts.
    let msg = `AI request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) msg = body.message;
    } catch {
      // non-JSON body; keep the status message
    }
    throw new Error(msg);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("Streaming is not supported in this browser.");

  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE frames are separated by a blank line.
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      let event = "message";
      let payload = "";

      for (const line of frame.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) payload += line.slice(5).trim();
      }
      if (!payload) continue;

      let parsed;
      try {
        parsed = JSON.parse(payload);
      } catch {
        continue;
      }

      if (event === "chunk" && parsed.text) {
        full += parsed.text;
        onChunk?.(parsed.text, full);
      } else if (event === "error") {
        throw new Error(parsed.message || "AI request failed");
      } else if (event === "done") {
        return full;
      }
    }
  }

  return full;
};

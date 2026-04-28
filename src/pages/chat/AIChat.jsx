import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Sparkles, Trash2, Loader2, Info } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";
import supabase from "../../utils/supabaseClient";
import { showError } from "../../utils/toast";

const AI_STREAM_URL = `${import.meta.env.VITE_API_URL}/api/ai/chat`;

// Pulls one event off an SSE buffer and returns { event, data, rest }.
// Returns null if no complete event is available yet.
const parseSSE = (buffer) => {
  const split = buffer.indexOf("\n\n");
  if (split === -1) return null;
  const raw = buffer.slice(0, split);
  const rest = buffer.slice(split + 2);
  let event = "message";
  let data = "";
  for (const line of raw.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) data = line.slice(5).trim();
  }
  return { event, data, rest };
};

const storageKey = (userId) => `nextalk_ai_chat_${userId || "anon"}`;

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const SUGGESTED_PROMPTS = [
  "Explain how JWT authentication works",
  "Write a haiku about coding late at night",
  "What's the difference between let and const?",
  "Give me 3 ideas for a side project",
];

const AIChat = () => {
  const { t } = useTheme();
  const { user } = useUser();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingId, setStreamingId] = useState(null);

  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(storageKey(user.id));
      if (raw) setMessages(JSON.parse(raw));
    } catch {
      // corrupted localStorage entry — ignore and start fresh
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(storageKey(user.id), JSON.stringify(messages));
  }, [messages, user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
      created_at: new Date().toISOString(),
    };
    const aiMsgId = `a-${Date.now()}`;
    const aiMsg = {
      id: aiMsgId,
      role: "ai",
      text: "",
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setDraft("");
    setSending(true);
    setStreamingId(aiMsgId);
    inputRef.current?.focus();

    let accumulated = "";
    let errored = false;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const response = await fetch(AI_STREAM_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok || !response.body) throw new Error("Stream failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let parsed;
        while ((parsed = parseSSE(buffer))) {
          buffer = parsed.rest;
          if (!parsed.data) continue;
          let payload;
          try {
            payload = JSON.parse(parsed.data);
          } catch {
            continue;
          }

          if (parsed.event === "chunk" && payload.text) {
            accumulated += payload.text;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId ? { ...m, text: accumulated } : m
              )
            );
          } else if (parsed.event === "error") {
            errored = true;
          }
        }
      }

      if (errored && !accumulated) throw new Error("AI errored mid-stream");
    } catch {
      showError("AI failed to respond. Try again.");
      setMessages((prev) =>
        prev.filter((m) => m.id !== userMsg.id && m.id !== aiMsgId)
      );
      setDraft(text);
    } finally {
      setSending(false);
      setStreamingId(null);
    }
  };

  const clearChat = () => {
    setMessages([]);
    if (user) localStorage.removeItem(storageKey(user.id));
  };

  return (
    <div
      className={`h-full flex flex-col relative ${t(
        "bg-stone-950 text-stone-100",
        "bg-white text-stone-900"
      )}`}
    >
      <header
        className={`shrink-0 backdrop-blur-xl ${t(
          "bg-stone-950/80 border-b border-white/5",
          "bg-white/95 border-b border-stone-100"
        )}`}
      >
        <div className="flex items-center gap-2 px-3 h-14">
          <button
            onClick={() => navigate(-1)}
            className={`md:hidden p-2 rounded-lg cursor-pointer ${t(
              "text-stone-300 hover:bg-white/5",
              "text-stone-700 hover:bg-stone-100"
            )}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-md shadow-amber-500/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 ${t("border-stone-950", "border-white")}`} />
            </div>
            <div className="text-left min-w-0">
              <p
                className={`text-sm font-semibold truncate ${t(
                  "text-stone-100",
                  "text-stone-900"
                )}`}
              >
                NexTalk AI
              </p>
              <p
                className={`text-[11px] truncate ${t(
                  "text-stone-400",
                  "text-stone-500"
                )}`}
              >
                {sending ? "typing..." : "online · Powered by Kashif"}
              </p>
            </div>
          </div>

          {messages.length > 0 && (
            <button
              onClick={clearChat}
              title="Clear chat"
              className={`p-2 rounded-lg cursor-pointer ${t(
                "text-stone-400 hover:bg-white/5 hover:text-red-400",
                "text-stone-500 hover:bg-red-50 hover:text-red-500"
              )}`}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <div
        className={`flex-1 overflow-y-auto scrollbar-hide px-4 sm:px-6 py-4 space-y-3 ${t(
          "bg-gradient-to-b from-stone-950 via-stone-950 to-stone-900",
          "bg-gradient-to-b from-amber-50/40 via-white to-orange-50/30"
        )}`}
      >
        {/* Disclaimer banner — matches the e2e notice pattern from ChatThread */}
        <div className="flex justify-center pt-1 pb-2">
          <div
            className={`max-w-md inline-flex items-start gap-2 px-3.5 py-2 rounded-xl text-[11px] leading-snug text-center ${t(
              "bg-amber-500/10 text-amber-200/90 border border-amber-500/15",
              "bg-amber-50 text-amber-800 border border-amber-200/70"
            )}`}
          >
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
            <span>
              NexTalk AI can make mistakes. Verify important info.
            </span>
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 py-8">
            <div className="relative mb-5">
              <div className={`absolute inset-0 rounded-full blur-2xl ${t("bg-amber-500/30", "bg-amber-400/40")}`} />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-xl shadow-amber-500/40">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
            </div>
            <h2
              className={`text-xl font-bold mb-2 ${t(
                "text-stone-100",
                "text-stone-900"
              )}`}
            >
              Ask NexTalk AI anything
            </h2>
            <p
              className={`text-sm max-w-sm mb-6 ${t(
                "text-stone-400",
                "text-stone-500"
              )}`}
            >
              Each message is independent — the AI does not remember earlier
              messages in this chat.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setDraft(prompt)}
                  className={`text-left text-xs px-3 py-2.5 rounded-xl border transition-colors cursor-pointer ${t(
                    "border-white/10 bg-white/5 text-stone-300 hover:bg-white/10 hover:border-amber-500/30",
                    "border-stone-200 bg-white text-stone-700 hover:border-amber-300 hover:bg-amber-50/50"
                  )}`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.role === "user";
            const isStreaming = m.id === streamingId;
            // Skip the empty AI bubble while waiting for first chunk — pill below shows the status instead
            if (isStreaming && !m.text) return null;
            return (
              <div
                key={m.id}
                className={`flex gap-2 ${
                  mine ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex flex-col max-w-[78%] sm:max-w-md ${
                    mine ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm break-words ${
                      mine
                        ? "bg-gradient-to-br from-amber-400 to-orange-400 text-white rounded-br-md"
                        : t(
                            "bg-stone-800 text-stone-100 rounded-bl-md",
                            "bg-white text-stone-900 rounded-bl-md border border-stone-200"
                          )
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">
                      {m.text}
                      {isStreaming && (
                        <span className="inline-block w-1.5 h-3.5 align-text-bottom ml-0.5 bg-amber-500 animate-pulse" />
                      )}
                    </p>
                  </div>
                  {!isStreaming && (
                    <div
                      className={`mt-0.5 px-1 text-[10px] ${t(
                        "text-stone-500",
                        "text-stone-400"
                      )}`}
                    >
                      {formatTime(m.created_at)}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* "NexTalk AI is typing..." pill — shown while waiting for first chunk */}
        {streamingId && !messages.find((m) => m.id === streamingId)?.text && (
          <div className="flex justify-start">
            <div
              className={`px-3.5 py-2 rounded-2xl rounded-bl-md flex items-center gap-2 ${t(
                "bg-stone-800 text-stone-300 border border-white/5",
                "bg-white text-stone-600 border border-stone-200"
              )}`}
            >
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "120ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "240ms" }} />
              </span>
              <span className="text-xs font-medium">NexTalk AI is typing...</span>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      <footer
        className={`shrink-0 px-3 py-3 ${t(
          "bg-stone-950 border-t border-white/5",
          "bg-white border-t border-stone-100"
        )}`}
      >
        <div
          className={`flex items-center gap-2 px-2 py-1.5 rounded-2xl border transition-colors ${t(
            "bg-stone-900 border-white/10 focus-within:border-amber-500/40",
            "bg-stone-50 border-stone-200 focus-within:border-amber-400 focus-within:bg-white"
          )}`}
        >
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())
            }
            placeholder="Ask NexTalk AI..."
            disabled={sending}
            className={`flex-1 bg-transparent outline-none text-sm px-2 disabled:opacity-60 ${t(
              "text-stone-100 placeholder-stone-500",
              "text-stone-900 placeholder-stone-400"
            )}`}
          />
          <button
            onClick={send}
            disabled={!draft.trim() || sending}
            className="p-2 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-transform hover:scale-105 active:scale-95 disabled:hover:scale-100 shrink-0"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default AIChat;

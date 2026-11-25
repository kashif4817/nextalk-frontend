import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, CheckCheck, Clock, Ghost, Send, ShieldOff, Smile, Timer, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { usePreferences } from "../../context/PreferencesContext";
import { RECONNECT_GRACE_SECONDS, TEMP_MAX_CHARS, useTempChat } from "../../hooks/useTempChat";
import ConfirmModal from "../../components/chat/ConfirmModal";
import { EmojiGridSkeleton } from "../../components/chat/Skeleton";
import { isTouchFirst } from "../../lib/attachments";

// Same picker as the main chat, loaded only when first opened.
const EmojiPanel = lazy(() => import("../../components/chat/EmojiPanel"));
const EMOJI_PANEL_HEIGHT =
  typeof window === "undefined" ? 420 : Math.min(420, Math.round(window.innerHeight * 0.5));
import {
  PeerSeats,
  TempEnded,
  TempJoining,
  TempLanding,
  TempMoved,
  TempShell,
  WaitingPanel,
} from "./TempScreens";

const timeOf = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

/**
 * Hide the conversation whenever it might be captured: tab hidden, window
 * not focused (the Windows snipping overlay takes focus), Print Screen, or
 * printing. Browsers can't block screenshots outright; this only makes them
 * harder.
 */
const usePrivacyShield = () => {
  const [hidden, setHidden] = useState(
    () => document.visibilityState !== "visible" || !document.hasFocus(),
  );

  useEffect(() => {
    let flash = null;
    const sync = () =>
      setHidden(document.visibilityState !== "visible" || !document.hasFocus());

    const onKey = (e) => {
      if (e.key !== "PrintScreen") return;
      setHidden(true);
      // Overwrite whatever the key just copied, where the browser allows it.
      navigator.clipboard?.writeText("").catch(() => {});
      clearTimeout(flash);
      flash = setTimeout(sync, 1500);
    };

    window.addEventListener("blur", sync);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("keyup", onKey);
    return () => {
      clearTimeout(flash);
      window.removeEventListener("blur", sync);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("keyup", onKey);
    };
  }, []);

  return hidden;
};

const blockCopy = (e) => e.preventDefault();

/** Whole seconds left of a `seconds`-long window that started at `since` (ms). */
const useSecondsLeft = (since, seconds) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!since) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [since]);
  if (!since) return null;
  return Math.min(seconds, Math.max(0, Math.ceil((since + seconds * 1000 - now) / 1000)));
};

const TempChat = ({ mode }) => {
  const { t } = useTheme();
  const { prefs } = usePreferences();
  const navigate = useNavigate();
  const { roomId: linkRoomId } = useParams();

  const chat = useTempChat({ mode, roomId: linkRoomId });
  const hidden = usePrivacyShield();
  const secondsLeft = useSecondsLeft(chat.awaySince, RECONNECT_GRACE_SECONDS);

  // "online" for them only while this chat is in front of us, and their
  // messages only turn amber ✓✓ (seen) once they've actually been on screen.
  const { setFocus, markSeen } = chat;
  const isActive = chat.status === "active";
  useEffect(() => {
    if (isActive) setFocus(!hidden);
  }, [isActive, hidden, setFocus]);
  useEffect(() => {
    if (isActive && !hidden) markSeen();
  }, [isActive, hidden, chat.messages.length, markSeen]);

  const [draft, setDraft] = useState("");
  const [confirmEnd, setConfirmEnd] = useState(false);
  // Emoji card. The caret is remembered so emoji land where you were typing
  // even after focus moved into the card's search box.
  const [emojiOpen, setEmojiOpen] = useState(false);
  const caretRef = useRef(null);
  // The composer bar; the card floats inside it, so a press anywhere else closes it.
  const footerRef = useRef(null);

  useEffect(() => {
    if (!emojiOpen) return;
    const onKey = (e) => e.key === "Escape" && setEmojiOpen(false);
    const onPress = (e) => {
      if (!footerRef.current?.contains(e.target)) setEmojiOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPress);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPress);
    };
  }, [emojiOpen]);
  const inputRef = useRef(null);
  const endRef = useRef(null);
  const typingRef = useRef({ on: false, timer: null });

  const shareUrl = chat.roomId ? `${window.location.origin}/t/${chat.roomId}` : "";
  const waiting = chat.status === "waiting";
  // Nothing to hide while you're alone and waiting; the shield is for the conversation.
  const shielded = hidden && !waiting;

  // Once the chat exists, this page *is* the chat: the address bar shows its
  // link. (No router navigation, which would remount and end the chat.)
  useEffect(() => {
    if (mode !== "create" || !chat.roomId) return;
    const path = `/t/${chat.roomId}`;
    if (window.location.pathname !== path) {
      window.history.replaceState(window.history.state, "", path);
    }
  }, [mode, chat.roomId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [chat.messages, chat.peerTyping]);

  // Message box grows with its text, up to about six lines.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 136)}px`;
  }, [draft]);

  const stopTyping = () => {
    const state = typingRef.current;
    clearTimeout(state.timer);
    if (state.on) {
      state.on = false;
      chat.setTyping(false);
    }
  };

  const onDraftChange = (value) => {
    setDraft(value.slice(0, TEMP_MAX_CHARS));
    if (!value.trim()) return stopTyping();
    const state = typingRef.current;
    if (!state.on) {
      state.on = true;
      chat.setTyping(true);
    }
    clearTimeout(state.timer);
    state.timer = setTimeout(stopTyping, 2500);
  };

  const send = () => {
    if (chat.status !== "active" || !chat.connected) return;
    if (chat.send(draft)) {
      setDraft("");
      stopTyping();
      inputRef.current?.focus();
    }
  };

  const onKeyDown = (e) => {
    if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
    const sends = prefs.enterToSend ? !e.shiftKey : e.ctrlKey || e.metaKey;
    if (!sends) return;
    e.preventDefault();
    send();
  };

  const endChat = () => {
    setConfirmEnd(false);
    chat.leave(waiting ? "cancelled" : "you_left");
  };

  // ── Emoji ───────────────────────────────────────────────────────────────
  const rememberCaret = (e) => {
    caretRef.current = { start: e.target.selectionStart, end: e.target.selectionEnd };
  };

  const toggleEmoji = () => {
    // On a phone the card takes the keyboard's place.
    if (!emojiOpen && isTouchFirst()) inputRef.current?.blur();
    setEmojiOpen((v) => !v);
  };

  /** Put the emoji where the caret was, replacing any selection. */
  const insertEmoji = (emoji) => {
    const el = inputRef.current;
    const caret = caretRef.current ?? {
      start: el?.selectionStart ?? draft.length,
      end: el?.selectionEnd ?? draft.length,
    };
    const start = Math.min(caret.start ?? draft.length, draft.length);
    const end = Math.min(Math.max(caret.end ?? start, start), draft.length);
    if (draft.length - (end - start) + emoji.length > TEMP_MAX_CHARS) return;

    const next = draft.slice(0, start) + emoji + draft.slice(end);
    const pos = start + emoji.length;
    caretRef.current = { start: pos, end: pos };
    // Through onDraftChange so they see "typing…".
    onDraftChange(next);

    if (el && !isTouchFirst()) {
      requestAnimationFrame(() => {
        el.focus({ preventScroll: true });
        el.setSelectionRange(pos, pos);
      });
    }
  };

  // ── Screens around the conversation ─────────────────────────────────────
  const page = `min-h-dvh flex flex-col ${t("bg-stone-950 text-stone-100", "bg-stone-50 text-stone-900")}`;
  const muted = t("text-stone-400", "text-stone-500");

  if (chat.status === "ended") {
    return (
      <TempShell>
        <TempEnded
          reason={chat.endReason}
          // Already on /temp: start the next one right here. From a guest
          // link, go to the start page.
          onNew={() => (mode === "create" ? chat.start() : navigate("/temp", { replace: true }))}
        />
      </TempShell>
    );
  }

  if (mode === "create" && (chat.status === "idle" || chat.status === "connecting")) {
    return (
      <TempShell>
        <TempLanding onStart={chat.start} starting={chat.status === "connecting"} />
      </TempShell>
    );
  }

  if (chat.status === "moved") {
    return (
      <TempShell>
        <TempMoved onUseHere={chat.moveHere} />
      </TempShell>
    );
  }

  if (chat.status === "joining") {
    return (
      <TempShell>
        <TempJoining />
      </TempShell>
    );
  }

  // ── The chat (also while waiting for the other person) ──────────────────
  const subtitle = !chat.connected
    ? "Reconnecting…"
    : waiting
      ? "waiting for someone to join…"
      : chat.status === "away"
      ? "Connection lost, waiting for them…"
      : chat.peerTyping
        ? "typing…"
        : chat.peerFocused
          ? "online"
          : "away, not looking at the chat";

  return (
    <div className={`${page} h-dvh`} data-no-print>
      {/* Header */}
      <header
        className={`shrink-0 flex items-center gap-3 px-3 sm:px-4 py-2.5 border-b ${t(
          "bg-stone-900/80 border-white/5",
          "bg-white border-stone-200"
        )}`}
      >
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-stone-500 to-stone-700 text-white">
          <Ghost className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">Anonymous</p>
          <p
            className={`text-[11px] truncate ${
              chat.peerTyping && chat.connected ? "text-amber-500" : muted
            }`}
          >
            {subtitle}
          </p>
        </div>
        <button
          onClick={() => setConfirmEnd(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" /> {waiting ? "Cancel chat" : "End chat"}
        </button>
      </header>

      {/* Notice */}
      <div
        className={`shrink-0 flex items-center justify-center gap-1.5 px-4 py-1.5 text-[11px] ${t(
          "bg-amber-500/10 text-amber-300",
          "bg-amber-50 text-amber-800"
        )}`}
      >
        <Timer className="w-3.5 h-3.5" />
        Temporary chat. Nothing is saved, and it disappears when either of you leaves.
      </div>

      {/* Messages (hidden whenever the page isn't in front of the user) */}
      <div className="relative flex-1 min-h-0">
        {/* Alone in the chat so far: the link to share (copyable, unshielded). */}
        {waiting && (
          <div className="absolute inset-0 overflow-y-auto flex items-center justify-center px-4 py-8">
            <WaitingPanel shareUrl={shareUrl} />
          </div>
        )}

        <div
          onCopy={blockCopy}
          onCut={blockCopy}
          onContextMenu={blockCopy}
          onDragStart={blockCopy}
          className={`h-full overflow-y-auto px-3 sm:px-6 py-4 space-y-1.5 select-none transition-[filter] duration-150 ${
            shielded ? "blur-xl" : ""
          } ${waiting ? "hidden" : ""}`}
        >
          {chat.messages.length === 0 && chat.status === "active" && (
            <div className="h-full flex flex-col items-center justify-center text-center pb-10">
              <PeerSeats state="connected" />
              <p className="mt-6 text-xl font-semibold">You're both here</p>
              <p className={`mt-1.5 text-sm ${muted}`}>
                Say hi! Messages vanish the moment the chat ends.
              </p>
            </div>
          )}

          {chat.messages.map((m) => (
            <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] sm:max-w-md flex flex-col ${m.mine ? "items-end" : "items-start"}`}>
                <p
                  className={`chat-text px-3 py-2 rounded-2xl whitespace-pre-wrap break-words ${
                    m.mine
                      ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-br-md"
                      : t(
                          "bg-stone-800 text-stone-100 rounded-bl-md",
                          "bg-white text-stone-900 rounded-bl-md border border-stone-200"
                        )
                  } ${m.status === "failed" ? "opacity-60" : ""}`}
                >
                  {m.text}
                </p>
                <span className={`flex items-center gap-1 mt-0.5 px-1 text-[10px] ${muted}`}>
                  {timeOf(m.at)}
                  {m.mine &&
                    (m.status === "failed" ? (
                      <span className="text-red-500">Not sent</span>
                    ) : m.status === "seen" ? (
                      <CheckCheck className="w-3 h-3 text-amber-500" aria-label="Seen" />
                    ) : m.status === "delivered" ? (
                      <CheckCheck className="w-3 h-3" aria-label="Delivered" />
                    ) : m.status === "sent" ? (
                      <Check className="w-3 h-3" aria-label="Sent" />
                    ) : (
                      <Clock className="w-3 h-3" aria-label="Sending" />
                    ))}
                </span>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {shielded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
            <ShieldOff className="w-6 h-6 text-amber-500" />
            <p className={`text-xs font-medium ${t("text-stone-300", "text-stone-600")}`}>
              Hidden while NexTalk isn't in focus
            </p>
          </div>
        )}

        {/* The other person isn't here (dropped connection): same waiting
            visual as before they joined, with the time they have left. */}
        {chat.status === "away" && !shielded && (
          <div
            className={`absolute inset-0 flex items-center justify-center px-6 backdrop-blur-sm ${t(
              "bg-stone-950/75",
              "bg-stone-50/80"
            )}`}
          >
            <div className="flex flex-col items-center text-center" role="status">
              <PeerSeats state="away" />
              <p className="mt-6 text-xl font-semibold">Waiting for them to come back</p>
              <p className={`mt-1.5 max-w-sm text-sm leading-relaxed ${muted}`}>
                Their connection dropped. If they're not back in{" "}
                <span className="font-semibold text-amber-500 tabular-nums">
                  {secondsLeft ?? RECONNECT_GRACE_SECONDS}s
                </span>
                , the chat ends and everything is deleted.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div
        ref={footerRef}
        className={`relative shrink-0 flex items-end gap-2 px-3 sm:px-4 py-3 border-t ${t(
          "bg-stone-900/80 border-white/5",
          "bg-white border-stone-200"
        )}`}
      >
        <button
          type="button"
          onClick={toggleEmoji}
          disabled={chat.status !== "active"}
          aria-label="Emoji"
          aria-haspopup="dialog"
          aria-expanded={emojiOpen}
          className={`p-2 rounded-lg cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            emojiOpen
              ? t("text-amber-500 bg-white/5", "text-amber-500 bg-stone-100")
              : t("text-stone-400 hover:bg-white/5", "text-stone-500 hover:bg-stone-100")
          }`}
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Same floating emoji card as the main chat; leaves no "recent" trace. */}
        {emojiOpen && (
          <div
            role="dialog"
            aria-label="Emoji"
            className={`absolute bottom-full left-2 mb-2 z-50 w-[min(560px,calc(100%-1rem))] rounded-2xl border shadow-2xl overflow-hidden origin-bottom-left animate-modal-pop ${t(
              "bg-stone-900 border-white/10",
              "bg-white border-stone-200"
            )}`}
          >
            <Suspense fallback={<EmojiGridSkeleton height={EMOJI_PANEL_HEIGHT} />}>
              <EmojiPanel onPick={insertEmoji} height={EMOJI_PANEL_HEIGHT} ephemeral />
            </Suspense>
          </div>
        )}

        <div className={`flex-1 px-3 py-2 rounded-2xl ${t("bg-stone-800", "bg-stone-100")}`}>
          <textarea
            ref={inputRef}
            rows={1}
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onSelect={rememberCaret}
            onKeyUp={rememberCaret}
            onClick={rememberCaret}
            // On a phone, tapping the box brings the keyboard back instead of the card.
            onFocus={() => isTouchFirst() && setEmojiOpen(false)}
            onKeyDown={onKeyDown}
            disabled={chat.status !== "active"}
            maxLength={TEMP_MAX_CHARS}
            placeholder={
              chat.status === "active"
                ? "Type a message"
                : waiting
                  ? "You can type once someone joins"
                  : "Waiting for them to reconnect…"
            }
            aria-label="Message"
            className={`block w-full bg-transparent outline-none text-sm leading-5 resize-none overflow-y-auto disabled:opacity-60 ${t(
              "text-stone-100 placeholder-stone-500",
              "text-stone-900 placeholder-stone-400"
            )}`}
          />
        </div>
        <button
          onClick={send}
          disabled={!draft.trim() || chat.status !== "active" || !chat.connected}
          aria-label="Send"
          className="p-2.5 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4.5 h-4.5" />
        </button>
      </div>

      <ConfirmModal
        open={confirmEnd}
        onClose={() => setConfirmEnd(false)}
        onConfirm={endChat}
        variant="danger"
        title={waiting ? "Cancel this chat?" : "End this chat?"}
        message={
          waiting
            ? "The link will stop working, and anyone who opens it later will see that the chat has ended."
            : "All messages will be deleted for both of you, and the link will stop working."
        }
        confirmLabel={waiting ? "Cancel chat" : "End chat"}
        cancelLabel={waiting ? "Keep waiting" : "Keep chatting"}
      />

    </div>
  );
};

export default TempChat;

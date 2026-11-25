import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  Image as ImageIcon,
  Check,
  CheckCheck,
  Reply,
  Forward,
  Copy,
  Star,
  Pin,
  Trash2,
  Edit2,
  Search,
  VolumeX,
  Volume2,
  Eraser,
  ShieldOff,
  Info,
  Mic,
  X,
  Lock,
  Headphones,
} from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";
import { useConversation } from "../../hooks/useConversation";
import { useMessages } from "../../hooks/useMessages";
import * as msgApi from "../../services/messages";
import * as convApi from "../../services/conversations";
import { uploadAudio, uploadFile, uploadImage } from "../../services/uploads";
import { previewText, toMessageView } from "../../lib/adapters";
import {
  LIMITS,
  compressImage,
  describeFile,
  encodeFileType,
  isTouchFirst,
  prepareAttachments,
} from "../../lib/attachments";
import AttachMenu from "../../components/chat/AttachMenu";
import AttachmentComposer from "../../components/chat/AttachmentComposer";
import MessageAttachment from "../../components/chat/MessageAttachment";
import MediaViewer from "../../components/chat/MediaViewer";
import CameraCapture from "../../components/chat/CameraCapture";
import { emitSocket, onSocket } from "../../lib/socket";
import Avatar from "../../components/chat/Avatar";
import { ThreadSkeleton, MessagesSkeleton, EmojiGridSkeleton } from "../../components/chat/Skeleton";
import VoiceMessage from "../../components/chat/VoiceMessage";
import useVoiceRecorder, {
  MAX_SECONDS,
  isRecordingSupported,
} from "../../hooks/useVoiceRecorder";
import BottomSheet, { SheetItem } from "../../components/chat/BottomSheet";
import DropdownMenu, { MenuItem } from "../../components/chat/DropdownMenu";
import { useLongPress } from "../../components/chat/useLongPress";
import { comingSoon } from "../../utils/toast";
import { useWallpaper } from "../../context/WallpaperContext";
import { usePreferences } from "../../context/PreferencesContext";
import { loadEmojiPanel, useEmojiPanel } from "../../lib/emojiPanelLoader";


const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const hasFiles = (e) => Array.from(e.dataTransfer?.types || []).includes("Files");

// Height of the floating emoji card: WhatsApp Web's size on a desktop,
// shorter on small screens so the conversation stays in view behind it.
const EMOJI_PANEL_HEIGHT =
  typeof window === "undefined" ? 420 : Math.min(420, Math.round(window.innerHeight * 0.5));

const formatDuration = (totalSeconds) => {
  const safe = Math.max(0, Math.floor(totalSeconds || 0));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
};

// Per-bar multipliers so the live meter reads as a waveform rather than a row
// of identical bars all tracking one number.
const LEVEL_BARS = [0.45, 0.7, 1, 0.8, 1.15, 0.6, 0.95, 1.2, 0.75, 1, 0.55, 0.85];

const MessageBubble = ({ msg, mine, onLongPress, onOpenMedia, showName, conv }) => {
  const { t } = useTheme();
  // Adapters attach the author profile; own messages never show an avatar.
  const sender = msg.sender;
  const lp = useLongPress(() => onLongPress(msg));
  const kind = msg.attachment?.type;
  // Photos and videos sit in a thin frame (WhatsApp-style); captions get
  // their own padding underneath.
  const isMedia = kind === "image" || kind === "video";
  const pad = isMedia ? "p-1" : msg.attachment ? "p-1.5" : "px-3 py-2";

  return (
    <div className={`flex gap-2 ${mine ? "justify-end" : "justify-start"}`}>
      {!mine && conv.is_group && (
        <Avatar initials={sender?.initials} color={sender?.color} size="xs" />
      )}
      <div className={`flex flex-col max-w-[78%] sm:max-w-md ${mine ? "items-end" : "items-start"}`}>
        {!mine && conv.is_group && showName && (
          <span className="text-[11px] font-semibold text-amber-500 mb-0.5 px-1">
            {sender?.display_name}
          </span>
        )}
        <div
          {...lp}
          className={`relative ${pad} rounded-2xl text-sm break-words cursor-pointer select-none ${
            mine
              ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-br-md"
              : t(
                  "bg-stone-800 text-stone-100 rounded-bl-md",
                  "bg-white text-stone-900 rounded-bl-md border border-stone-200"
                )
          }`}
        >
          {msg.audio_name && (
            <p
              className={`flex items-center gap-1.5 mb-1 text-xs font-medium truncate ${
                mine ? "text-white/90" : t("text-stone-300", "text-stone-600")
              }`}
            >
              <Headphones className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{msg.audio_name}</span>
            </p>
          )}
          {msg.message_type === "audio" && msg.file_url && (
            <VoiceMessage
              src={msg.file_url}
              mine={mine}
              seed={msg.id}
              durationHint={msg.duration ?? null}
            />
          )}
          {msg.attachment && (
            <MessageAttachment
              msg={msg}
              mine={mine}
              // A long press also ends in a click; don't open the viewer over the menu.
              onOpenMedia={(m) => !lp.didTriggerLongPress() && onOpenMedia(m)}
            />
          )}
          {msg.text && (
            <p
              className={`chat-text leading-relaxed whitespace-pre-wrap ${
                msg.attachment ? "px-1.5 pt-1.5 pb-0.5" : ""
              }`}
            >
              {msg.text}
            </p>
          )}
          {msg.starred && (
            <Star className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          )}
        </div>

        {/* Reactions */}
        {msg.reactions?.length > 0 && (
          <div className="flex gap-1 mt-1 px-1">
            {msg.reactions.map((r, i) => (
              <span
                key={i}
                className={`text-xs px-1.5 py-0.5 rounded-full border ${t(
                  "bg-stone-800 border-white/10",
                  "bg-white border-stone-200"
                )}`}
              >
                {r.emoji} {r.count}
              </span>
            ))}
          </div>
        )}

        <div className={`flex items-center gap-1 mt-0.5 px-1 text-[10px] ${t("text-stone-500", "text-stone-400")}`}>
          <span>{msg.time}</span>
          {mine && (msg.status === "read" ? (
            <CheckCheck className="w-3 h-3 text-amber-500" aria-label="Read" />
          ) : msg.status === "delivered" ? (
            <CheckCheck className="w-3 h-3" aria-label="Delivered" />
          ) : (
            <Check className="w-3 h-3" aria-label="Sent" />
          ))}
        </div>
      </div>
    </div>
  );
};

const ChatThread = () => {
  const { t, dark } = useTheme();
  const { wallpaper } = useWallpaper();
  const { id } = useParams();
  const navigate = useNavigate();

  const { user } = useUser();
  const { prefs } = usePreferences();
  const { conversation: conv, loading: convLoading, error: convError } = useConversation(id);
  const other = conv && !conv.is_group ? conv.other : null;

  const {
    messages,
    loading: msgLoading,
    error: msgError,
    hasMore,
    loadingMore,
    loadOlder,
    append,
    patch: patchMsg,
    drop: dropMsg,
    reload: reloadMessages,
  } = useMessages(id);

  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);
  const [reactingTo, setReactingTo] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  // Emoji panel. The caret is remembered so emoji land where you were typing
  // even after focus moved into the panel's search box.
  const [emojiOpen, setEmojiOpen] = useState(false);
  // The card's code, preloaded at idle so the first tap opens it instantly.
  const EmojiPanel = useEmojiPanel(emojiOpen);
  const caretRef = useRef(null);
  // The composer bar; the emoji card floats inside it, so a press anywhere
  // else (messages, header, chat list) closes the card.
  const footerRef = useRef(null);

  // Attachments: the paperclip menu, the review screen, the webcam, the viewer.
  const [attachOpen, setAttachOpen] = useState(false);
  const [composer, setComposer] = useState(null); // { items, accept, asDocument }
  const [cameraOpen, setCameraOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(null);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);
  const mediaInputRef = useRef(null);
  const docInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Sent photos and videos, in chat order, for the viewer's prev / next.
  const mediaItems = useMemo(
    () =>
      messages.filter(
        (m) =>
          (m.attachment?.type === "image" || m.attachment?.type === "video") &&
          m.attachment.url &&
          m.status !== "sending" &&
          m.status !== "failed",
      ),
    [messages],
  );

  // Switching chats closes everything that belonged to the last one.
  useEffect(() => {
    setEmojiOpen(false);
    setAttachOpen(false);
    setComposer(null);
    setCameraOpen(false);
    setViewerIndex(null);
    caretRef.current = null;
  }, [id]);

  // The emoji card closes on Escape or a press outside the composer, like
  // WhatsApp's; typing in the message box keeps it open.
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

  // Voice messages
  const [voiceBusy, setVoiceBusy] = useState(false);
  const canRecord = isRecordingSupported();
  // Declared before the recorder so it can serve as the auto-stop handler.
  const sendTakeRef = useRef(null);
  const recorder = useVoiceRecorder({
    onAutoStop: (take) => sendTakeRef.current?.(take),
  });

  // Opening a chat lands on its newest message at once, like WhatsApp; only
  // messages arriving after that glide in. (Cached chats paint immediately,
  // so a smooth scroll here would animate through the whole history.)
  const scrolledChatRef = useRef(null);
  useEffect(() => {
    const end = endRef.current;
    if (!end || !messages.length) return;
    const firstForChat = scrolledChatRef.current !== id;
    scrolledChatRef.current = id;
    end.scrollIntoView({ behavior: firstForChat ? "auto" : "smooth", block: "end" });
  }, [messages, id]);

  // Opening a thread marks it read — clearing the badge and turning the
  // sender's ticks amber. So does a new message arriving while it's open and
  // on screen, or coming back to the tab after one arrived.
  const convReady = Boolean(conv);
  const lastIncomingId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (!messages[i].is_mine) return messages[i].id;
    }
    return null;
  }, [messages]);
  const markedRef = useRef(null);

  useEffect(() => {
    if (!id || !convReady || msgLoading) return;
    const key = `${id}:${lastIncomingId}`;

    const markRead = () => {
      if (document.visibilityState !== "visible" || markedRef.current === key) return;
      markedRef.current = key;
      convApi.markRead(id).catch(() => {
        // Non-critical: the badge just stays until the next load.
        markedRef.current = null;
      });
    };

    markRead();
    document.addEventListener("visibilitychange", markRead);
    return () => document.removeEventListener("visibilitychange", markRead);
  }, [id, convReady, msgLoading, lastIncomingId]);

  // ── Typing indicator: who else is typing in this chat ─────────────────────
  const [typingIds, setTypingIds] = useState([]);
  const meId = user?.id;

  useEffect(() => {
    if (!id) return;
    const timers = new Map();

    const clear = (userId) => {
      clearTimeout(timers.get(userId));
      timers.delete(userId);
      setTypingIds((prev) => (prev.includes(userId) ? prev.filter((u) => u !== userId) : prev));
    };

    const onStart = (e) => {
      if (e.conversation_id !== id || e.userId === meId) return;
      setTypingIds((prev) => (prev.includes(e.userId) ? prev : [...prev, e.userId]));
      clearTimeout(timers.get(e.userId));
      // A lost "stop" (closed tab, dropped connection) must not stick.
      timers.set(e.userId, setTimeout(() => clear(e.userId), 6000));
    };
    const onStop = (e) => {
      if (e.conversation_id === id) clear(e.userId);
    };
    // Their message landing means they've stopped typing.
    const onNew = (m) => {
      if (m.conversation_id === id) clear(m.sender_id);
    };

    const offs = [
      onSocket("typing:start", onStart),
      onSocket("typing:stop", onStop),
      onSocket("message:new", onNew),
    ];
    return () => {
      offs.forEach((off) => off());
      timers.forEach(clearTimeout);
      setTypingIds([]);
    };
  }, [id, meId]);

  // ── Typing indicator: telling others that I'm typing ──────────────────────
  const typingRef = useRef({ active: false, lastEmit: 0, timer: null });

  const stopTyping = () => {
    const state = typingRef.current;
    clearTimeout(state.timer);
    if (!state.active) return;
    state.active = false;
    emitSocket("typing:stop", { conversation_id: id });
  };

  const handleDraftChange = (value) => {
    setDraft(value);
    if (!value.trim()) {
      stopTyping();
      return;
    }
    const state = typingRef.current;
    // Re-announce every few seconds so the other side's safety timeout
    // doesn't hide the indicator during a long message.
    if (!state.active || Date.now() - state.lastEmit > 2500) {
      state.active = true;
      state.lastEmit = Date.now();
      emitSocket("typing:start", { conversation_id: id });
    }
    clearTimeout(state.timer);
    state.timer = setTimeout(stopTyping, 3000);
  };

  // Leaving the chat (or switching to another) ends "typing…" for the others.
  useEffect(() => {
    const state = typingRef.current;
    return () => {
      clearTimeout(state.timer);
      if (state.active) {
        state.active = false;
        emitSocket("typing:stop", { conversation_id: id });
      }
    };
  }, [id]);

  // The message box grows with its text, up to about six lines, then scrolls.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 136)}px`;
  }, [draft]);

  if (convLoading) {
    return <ThreadSkeleton />;
  }

  if (!conv) {
    return (
      <div className={`h-full flex flex-col items-center justify-center ${t("bg-stone-950 text-stone-300", "bg-stone-50 text-stone-700")}`}>
        <p className="mb-4">{convError || "Conversation not found."}</p>
        <button onClick={() => navigate("/chat")} className="text-amber-500 underline">
          Back to chats
        </button>
      </div>
    );
  }

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;

    // Show the bubble straight away under a temporary id, then swap in the
    // saved row so it carries the real id for reactions, stars and replies.
    const tempId = `pending-${Date.now()}`;
    const pending = {
      id: tempId,
      sender_id: "me",
      author_id: user?.id,
      is_mine: true,
      sender: null,
      text,
      message_type: "text",
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      created_at: new Date().toISOString(),
      reactions: [],
      starred: false,
      pinned: false,
      status: "sending",
      reply_to: replyTo
        ? {
            id: replyTo.id,
            text: replyTo.text,
            sender_id: replyTo.author_id,
            sender: replyTo.is_mine ? "You" : replyTo.sender?.display_name ?? "Unknown",
          }
        : null,
    };

    const currentReply = replyTo;
    append(pending);
    setDraft("");
    stopTyping();
    setReplyTo(null);
    setSending(true);
    inputRef.current?.focus();

    try {
      const saved = await msgApi.sendMessage({
        conversation_id: id,
        content: text,
        message_type: "text",
        reply_to_id: currentReply?.id ?? null,
      });
      const view = toMessageView(saved, user?.id);
      if (view) patchMsg(tempId, { ...view, status: "sent" });
    } catch (e) {
      toast.error(e.message || "Message failed to send");
      patchMsg(tempId, { status: "failed" });
    } finally {
      setSending(false);
    }
  };

  // ── Voice messages ────────────────────────────────────────────────────────
  const startRecording = async () => {
    if (voiceBusy || sending) return;
    setEmojiOpen(false);
    const ok = await recorder.start();
    if (!ok && recorder.error) toast.error(recorder.error);
  };

  const cancelRecording = () => {
    recorder.cancel();
  };

  /** Upload to Cloudinary, then post the message row pointing at it. */
  const sendTake = async (take) => {
    if (!take) return;

    if (take.seconds < 1) {
      toast.error("That was too short — hold the mic a moment longer.");
      return;
    }

    // A local URL means the bubble is playable while the upload is still
    // running, instead of showing a dead player.
    const localUrl = URL.createObjectURL(take.file);
    const tempId = `pending-${Date.now()}`;
    const currentReply = replyTo;

    append({
      id: tempId,
      sender_id: "me",
      author_id: user?.id,
      is_mine: true,
      sender: null,
      text: "",
      message_type: "audio",
      file_url: localUrl,
      file_type: take.mimeType,
      duration: take.seconds,
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      created_at: new Date().toISOString(),
      reactions: [],
      starred: false,
      pinned: false,
      status: "sending",
      reply_to: currentReply
        ? {
            id: currentReply.id,
            text: currentReply.text,
            sender_id: currentReply.author_id,
            sender: currentReply.is_mine
              ? "You"
              : currentReply.sender?.display_name ?? "Unknown",
          }
        : null,
    });

    setReplyTo(null);
    setVoiceBusy(true);

    try {
      const uploaded = await uploadAudio(take.file);
      if (!uploaded?.url) throw new Error("Upload did not return a file URL.");

      const saved = await msgApi.sendMessage({
        conversation_id: id,
        message_type: "audio",
        file_url: uploaded.url,
        file_type: uploaded.file_type || take.mimeType,
        reply_to_id: currentReply?.id ?? null,
      });

      const view = toMessageView(saved, user?.id);
      if (view) patchMsg(tempId, { ...view, duration: take.seconds, status: "sent" });
    } catch (e) {
      toast.error(e.message || "Voice message failed to send");
      patchMsg(tempId, { status: "failed" });
    } finally {
      setVoiceBusy(false);
      // Revoked late so the bubble never points at a freed URL mid-swap.
      setTimeout(() => URL.revokeObjectURL(localUrl), 60000);
    }
  };

  // Kept current so the recorder's auto-stop always calls this render's copy.
  sendTakeRef.current = sendTake;

  const stopAndSendRecording = async () => {
    const take = await recorder.stop();
    if (take) sendTake(take);
  };

  // ── Attachments ───────────────────────────────────────────────────────────
  /** Validate picked files and open the review screen with the ones that pass. */
  const openComposer = (files, { accept, asDocument = false } = {}) => {
    if (!files?.length) return;
    const items = prepareAttachments(files, undefined, { asDocument });
    if (!items.length) return;
    setEmojiOpen(false);
    setComposer({ items, accept, asDocument });
  };

  const onFilesPicked = (options) => (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = ""; // so picking the same file again still fires
    openComposer(files, options);
  };

  const pickAttachment = (key) => {
    if (key === "document") docInputRef.current?.click();
    else if (key === "media") mediaInputRef.current?.click();
    else if (key === "audio") audioInputRef.current?.click();
    else if (key === "camera") {
      // Phones open their own camera app; desktops get the webcam modal.
      if (isTouchFirst() || !navigator.mediaDevices?.getUserMedia) cameraInputRef.current?.click();
      else setCameraOpen(true);
    }
  };

  /** Upload one file, shrinking photos first. Resolves to { url, file }. */
  const uploadOne = async (entry, onProgress) => {
    if (entry.kind === "image") {
      const file = await compressImage(entry.file);
      if (file.size > LIMITS.image) {
        throw new Error(`"${entry.file.name}" is too large. Photos can be up to 5 MB.`);
      }
      const up = await uploadImage(file, onProgress);
      return { url: up?.url, file };
    }
    const up = await uploadFile(entry.file, onProgress);
    return { url: up?.url, file: entry.file };
  };

  /**
   * Send what the review screen hands back: [{ file, kind, caption, meta }].
   * Every bubble appears at once; uploads run side by side, and the messages
   * are posted one after another so they land in the order they were picked.
   */
  const sendAttachments = async (list) => {
    setComposer(null);
    if (!list?.length) return;

    const currentReply = replyTo;
    setReplyTo(null);
    stopTyping();

    const stamp = Date.now();
    const clock = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const nowIso = new Date().toISOString();

    const jobs = list.map((entry, i) => {
      const tempId = `pending-${stamp}-${i}`;
      const localUrl = URL.createObjectURL(entry.file);
      const fileType = encodeFileType(entry.file.type, {
        name: entry.file.name,
        size: entry.file.size,
        ...entry.meta,
      });

      append({
        id: tempId,
        sender_id: "me",
        author_id: user?.id,
        is_mine: true,
        sender: null,
        text: entry.caption,
        message_type: entry.kind,
        file_url: localUrl,
        file_type: fileType,
        duration: entry.meta.duration ?? null,
        attachment:
          entry.kind === "audio"
            ? null
            : {
                ...describeFile(localUrl, fileType),
                type: entry.kind,
                // Documents have nothing to show until they're uploaded.
                url: entry.kind === "document" ? null : localUrl,
              },
        audio_name: entry.kind === "audio" ? entry.file.name : null,
        time: clock,
        created_at: nowIso,
        reactions: [],
        starred: false,
        pinned: false,
        status: "sending",
        reply_to:
          i === 0 && currentReply
            ? {
                id: currentReply.id,
                text: currentReply.text,
                sender_id: currentReply.author_id,
                sender: currentReply.is_mine
                  ? "You"
                  : currentReply.sender?.display_name ?? "Unknown",
              }
            : null,
      });

      return { entry, tempId, localUrl };
    });

    const uploads = jobs.map(({ entry, tempId }) => {
      let shown = -1;
      // Re-render in 5% steps rather than on every progress event.
      const onProgress = (pct) => {
        if (pct === 100 || pct - shown >= 5) {
          shown = pct;
          patchMsg(tempId, { progress: pct });
        }
      };
      return uploadOne(entry, onProgress).catch((error) => ({ error }));
    });

    for (let i = 0; i < jobs.length; i++) {
      const { entry, tempId, localUrl } = jobs[i];
      try {
        const result = await uploads[i];
        if (result.error) throw result.error;
        if (!result.url) throw new Error("Upload did not return a file URL.");

        const saved = await msgApi.sendMessage({
          conversation_id: id,
          content: entry.caption || null,
          message_type: entry.kind,
          file_url: result.url,
          file_type: encodeFileType(result.file.type || entry.file.type, {
            name: result.file.name,
            size: result.file.size,
            ...entry.meta,
          }),
          reply_to_id: i === 0 ? currentReply?.id ?? null : null,
        });

        const view = toMessageView(saved, user?.id);
        if (view) {
          patchMsg(tempId, {
            ...view,
            duration: entry.meta.duration ?? view.duration,
            status: "sent",
            progress: undefined,
          });
        }
        // Late, so the bubble never points at a freed URL mid-swap.
        setTimeout(() => URL.revokeObjectURL(localUrl), 60000);
      } catch (e) {
        // The failed bubble keeps its local preview, so the URL stays alive.
        toast.error(e.message || `Couldn't send ${entry.file.name}`);
        patchMsg(tempId, { status: "failed", progress: undefined });
      }
    }
  };

  const openMedia = (msg) => {
    const index = mediaItems.findIndex((m) => m.id === msg.id);
    if (index !== -1) setViewerIndex(index);
  };

  // Pasting a screenshot or copied file opens the review screen, as on WhatsApp Web.
  const handlePaste = (e) => {
    const files = [...(e.clipboardData?.files || [])];
    if (!files.length) return;
    e.preventDefault();
    openComposer(files);
  };

  // Drag files anywhere over the thread to send them.
  const dragHandlers = {
    onDragEnter: (e) => {
      if (!hasFiles(e) || composer) return;
      e.preventDefault();
      dragDepth.current += 1;
      setDragging(true);
    },
    onDragOver: (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = composer ? "none" : "copy";
    },
    onDragLeave: (e) => {
      if (!hasFiles(e) || composer) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setDragging(false);
    },
    onDrop: (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      if (!composer) openComposer([...e.dataTransfer.files]);
    },
  };

  // ── Emoji ─────────────────────────────────────────────────────────────────
  const rememberCaret = (e) => {
    caretRef.current = { start: e.target.selectionStart, end: e.target.selectionEnd };
  };

  const toggleEmoji = () => {
    // On a phone the panel takes the keyboard's place.
    if (!emojiOpen && isTouchFirst()) inputRef.current?.blur();
    setAttachOpen(false);
    setEmojiOpen((v) => !v);
  };

  /** Put the emoji where the caret was, replacing any selection. */
  const insertEmoji = (emoji) => {
    const el = inputRef.current;
    const value = draft;
    const caret = caretRef.current ?? {
      start: el?.selectionStart ?? value.length,
      end: el?.selectionEnd ?? value.length,
    };
    const start = Math.min(caret.start ?? value.length, value.length);
    const end = Math.min(Math.max(caret.end ?? start, start), value.length);

    const next = value.slice(0, start) + emoji + value.slice(end);
    const pos = start + emoji.length;
    caretRef.current = { start: pos, end: pos };
    // Through handleDraftChange so the other side sees "typing…".
    handleDraftChange(next);

    if (el && !isTouchFirst()) {
      requestAnimationFrame(() => {
        el.focus({ preventScroll: true });
        el.setSelectionRange(pos, pos);
      });
    }
  };

  // Settings → Chats → "Enter to send".
  //   on:  Enter sends, Shift+Enter is a new line
  //   off: Enter is a new line, Ctrl/⌘+Enter sends
  const handleComposerKeyDown = (e) => {
    // Enter that confirms an IME composition (e.g. Japanese input) isn't a send.
    if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
    const sends = prefs.enterToSend ? !e.shiftKey : e.ctrlKey || e.metaKey;
    if (!sends) return;
    e.preventDefault();
    send();
  };

  const handleAction = async (action) => {
    if (!actionMsg) return;
    const msg = actionMsg;

    if (action === "react") {
      setReactingTo(msg);
      setActionMsg(null);
      return;
    }

    setActionMsg(null);

    if (action === "reply") {
      setReplyTo(msg);
      return;
    }

    if (action === "copy") {
      navigator.clipboard?.writeText(msg.text);
      return;
    }

    // Anything below hits the API, which needs a persisted id.
    if (String(msg.id).startsWith("pending-")) {
      toast.error("Still sending — try again in a moment.");
      return;
    }

    if (action === "star") {
      const next = !msg.starred;
      patchMsg(msg.id, { starred: next });
      try {
        await (next ? msgApi.starMessage(msg.id) : msgApi.unstarMessage(msg.id));
      } catch (e) {
        patchMsg(msg.id, { starred: !next });
        toast.error(e.message || "Could not update star");
      }
      return;
    }

    if (action === "delete-me" || action === "delete-all") {
      const mode = action === "delete-all" ? "for_everyone" : "for_me";
      dropMsg(msg.id);
      try {
        await msgApi.deleteMessage(msg.id, mode);
      } catch (e) {
        toast.error(e.message || "Could not delete message");
        append(msg); // put it back
      }
    }
  };

  const clearConversation = async () => {
    try {
      await convApi.clearChat(id);
      reloadMessages();
    } catch (e) {
      toast.error(e.message || "Could not clear chat");
    }
  };

  const addReaction = async (emoji) => {
    if (!reactingTo) return;
    const msg = reactingTo;
    setReactingTo(null);

    if (String(msg.id).startsWith("pending-")) {
      toast.error("Still sending — try again in a moment.");
      return;
    }

    const existing = msg.reactions?.find((r) => r.emoji === emoji);
    const mineAlready = Boolean(existing?.by_me);
    const before = msg.reactions || [];

    // Toggle my own reaction, keeping other people's counts intact.
    const after = mineAlready
      ? before
          .map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1, by_me: false } : r))
          .filter((r) => r.count > 0)
      : existing
        ? before.map((r) =>
            r.emoji === emoji ? { ...r, count: r.count + 1, by_me: true } : r,
          )
        : [...before, { emoji, count: 1, by_me: true }];

    patchMsg(msg.id, { reactions: after });

    try {
      await (mineAlready
        ? msgApi.removeReaction(msg.id, emoji)
        : msgApi.reactToMessage(msg.id, emoji));
    } catch (e) {
      patchMsg(msg.id, { reactions: before });
      toast.error(e.message || "Could not react");
    }
  };

  const lastSeenLabel = other?.last_seen
    ? new Date(other.last_seen).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "a while ago";

  const typingName = conv.is_group
    ? conv.members.find((m) => m.id === typingIds[0])?.display_name ?? "Someone"
    : null;

  const headerSubtitle = typingIds.length
    ? conv.is_group
      ? `${typingName} is typing…`
      : "typing…"
    : conv.is_group
    ? `${conv.members_count} members`
    : other?.status === "online"
    ? "online"
    : `last seen ${lastSeenLabel}`;

  return (
    <div
      {...dragHandlers}
      className={`relative h-full flex flex-col ${t("bg-stone-950 text-stone-100", "bg-stone-100 text-stone-900")}`}
    >
      {/* ── Header (the only top bar in chat thread — no global app bar) ── */}
      <header
        className={`shrink-0 border-b backdrop-blur-xl ${t(
          "bg-stone-950/80 border-white/5",
          "bg-white/85 border-stone-200"
        )}`}
      >
        <div className="flex items-center gap-2 px-2 h-14">
          <button
            onClick={() => navigate(-1)}
            className={`md:hidden p-2 rounded-lg cursor-pointer ${t("text-stone-300 hover:bg-white/5", "text-stone-700 hover:bg-stone-100")}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              if (conv.is_group) navigate(`/chat/${conv.id}/info`);
              else navigate(`/chat/profile/${conv.other_user_id}`);
            }}
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
          >
            <Avatar
              initials={conv.initials}
              color={conv.color}
              size="sm"
              status={!conv.is_group ? other?.status : null}
            />
            <div className="text-left min-w-0">
              <p className={`text-sm font-semibold truncate ${t("text-stone-100", "text-stone-900")}`}>
                {conv.title}
              </p>
              <p
                className={`text-[11px] truncate ${
                  typingIds.length ? "text-amber-500" : t("text-stone-400", "text-stone-500")
                }`}
              >
                {headerSubtitle}
              </p>
            </div>
          </button>
          <button
            onClick={() => comingSoon("Video calls")}
            className={`p-2 rounded-lg cursor-pointer ${t("text-stone-400 hover:bg-white/5", "text-stone-500 hover:bg-stone-100")}`}
          >
            <Video className="w-5 h-5" />
          </button>
          <button
            onClick={() => comingSoon("Voice calls")}
            className={`p-2 rounded-lg cursor-pointer ${t("text-stone-400 hover:bg-white/5", "text-stone-500 hover:bg-stone-100")}`}
          >
            <Phone className="w-5 h-5" />
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className={`p-2 rounded-lg cursor-pointer ${t("text-stone-400 hover:bg-white/5", "text-stone-500 hover:bg-stone-100")}`}
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            <DropdownMenu open={menuOpen} onClose={() => setMenuOpen(false)}>
              <MenuItem icon={Info} label={conv.is_group ? "Group info" : "View profile"} onClick={() => {
                setMenuOpen(false);
                if (conv.is_group) navigate(`/chat/${conv.id}/info`);
                else navigate(`/chat/profile/${conv.other_user_id}`);
              }} />
              <MenuItem icon={Search} label="Search messages" onClick={() => { setMenuOpen(false); comingSoon("In-chat search"); }} />
              <MenuItem icon={Pin} label="Pinned messages" onClick={() => setMenuOpen(false)} />
              <MenuItem icon={Star} label="Starred messages" onClick={() => { setMenuOpen(false); navigate("/chat/starred"); }} />
              {conv.is_muted ? (
                <MenuItem icon={Volume2} label="Unmute notifications" onClick={() => setMenuOpen(false)} />
              ) : (
                <MenuItem icon={VolumeX} label="Mute notifications" onClick={() => setMenuOpen(false)} />
              )}
              <MenuItem icon={Eraser} label="Clear chat" onClick={() => { setMenuOpen(false); clearConversation(); }} />
              {!conv.is_group && (
                <MenuItem icon={ShieldOff} label="Block user" danger onClick={() => setMenuOpen(false)} />
              )}
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* ── Messages ── */}
      <div
        style={wallpaper.style(dark)}
        className="flex-1 overflow-y-auto scrollbar-hide px-3 sm:px-6 py-3 space-y-2"
      >
        {/* End-to-end encryption notice */}
        <div className="flex justify-center pt-1 pb-3">
          <div
            className={`max-w-md inline-flex items-start gap-2 px-3.5 py-2 rounded-xl text-[11px] leading-snug text-center ${t(
              "bg-amber-500/10 text-amber-200/90 border border-amber-500/15",
              "bg-amber-50 text-amber-800 border border-amber-200/70"
            )}`}
          >
            <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
            <span>
              Messages are end-to-end encrypted. No one outside of this chat, not even NexTalk, can read or listen to them.{" "}
              <button
                onClick={() => navigate("/privacy")}
                className="font-semibold text-amber-600 hover:text-amber-500 underline underline-offset-2 cursor-pointer"
              >
                Learn more
              </button>
            </span>
          </div>
        </div>

        {msgLoading ? (
          <MessagesSkeleton />
        ) : msgError ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className={`text-sm ${t("text-stone-400", "text-stone-500")}`}>{msgError}</p>
              <button
                onClick={reloadMessages}
                className="mt-3 text-sm font-medium text-amber-500 hover:text-amber-600 cursor-pointer"
              >
                Try again
              </button>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className={`text-center text-sm ${t("text-stone-500", "text-stone-400")}`}>
              <p>No messages yet. Say hi 👋</p>
            </div>
          </div>
        ) : (
          <>
          {hasMore && (
            <div className="flex justify-center pb-2">
              <button
                onClick={loadOlder}
                disabled={loadingMore}
                className={`text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer disabled:opacity-60 ${t(
                  "bg-white/5 text-stone-300 hover:bg-white/10",
                  "bg-stone-100 text-stone-600 hover:bg-stone-200",
                )}`}
              >
                {loadingMore ? "Loading..." : "Load earlier messages"}
              </button>
            </div>
          )}
          {messages.map((m, i) => {
            const prev = messages[i - 1];
            const showName = !prev || prev.sender_id !== m.sender_id;
            return (
              <MessageBubble
                key={m.id}
                msg={m}
                mine={m.sender_id === "me"}
                onLongPress={setActionMsg}
                onOpenMedia={openMedia}
                showName={showName}
                conv={conv}
              />
            );
          })}
          </>
        )}
        <div ref={endRef} />
      </div>

      {/* ── Reply preview ── */}
      {replyTo && (
        <div
          className={`px-4 py-2 flex items-center gap-3 border-t ${t(
            "bg-stone-900 border-white/5",
            "bg-stone-50 border-stone-200"
          )}`}
        >
          <div className="w-1 h-10 rounded-full bg-amber-500" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-500">
              Replying to {replyTo.is_mine ? "yourself" : replyTo.sender?.display_name ?? "Unknown"}
            </p>
            <p className={`text-xs truncate ${t("text-stone-400", "text-stone-500")}`}>
              {/* A photo or voice note has no text of its own: say what it is. */}
              {replyTo.text || previewText({ message_type: replyTo.message_type, file_type: replyTo.file_type })}
            </p>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className={`p-1 rounded ${t("text-stone-400", "text-stone-500")}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Input ── */}
      <footer
        ref={footerRef}
        className={`relative shrink-0 border-t px-2 py-2 flex items-end gap-1 ${t(
          "bg-stone-950 border-white/5",
          "bg-white border-stone-200"
        )}`}
      >
        {recorder.recording ? (
          <>
            {/* Discard the take */}
            <button
              onClick={cancelRecording}
              aria-label="Cancel recording"
              className="p-2 rounded-lg cursor-pointer text-red-500 hover:bg-red-500/10"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            <div
              className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-2xl ${t(
                "bg-stone-900",
                "bg-stone-100"
              )}`}
            >
              <span className="relative flex w-2.5 h-2.5 shrink-0">
                <span className="absolute inset-0 rounded-full bg-red-500/60 animate-ping" />
                <span className="relative w-2.5 h-2.5 rounded-full bg-red-500" />
              </span>

              <span
                className={`text-sm font-medium tabular-nums shrink-0 ${t(
                  "text-stone-200",
                  "text-stone-700"
                )}`}
              >
                {formatDuration(recorder.seconds)}
              </span>

              {/* Live input level */}
              <div className="flex-1 flex items-center justify-center gap-[3px] h-6 overflow-hidden">
                {LEVEL_BARS.map((weight, i) => (
                  <span
                    key={i}
                    style={{
                      height: `${Math.max(
                        12,
                        Math.min(100, recorder.level * 100 * weight)
                      )}%`,
                    }}
                    className="w-[3px] rounded-full bg-amber-500 transition-[height] duration-75"
                  />
                ))}
              </div>

              <span
                className={`text-[10px] shrink-0 ${t("text-stone-500", "text-stone-400")}`}
              >
                {formatDuration(MAX_SECONDS - recorder.seconds)} left
              </span>
            </div>

            <button
              onClick={stopAndSendRecording}
              aria-label="Send voice message"
              className="p-2.5 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white cursor-pointer"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={toggleEmoji}
              // Hovering is a strong hint you're about to open it.
              onPointerEnter={() => loadEmojiPanel().catch(() => {})}
              aria-label="Emoji"
              aria-haspopup="dialog"
              aria-expanded={emojiOpen}
              className={`p-2 rounded-lg cursor-pointer transition-colors ${
                emojiOpen
                  ? t("text-amber-500 bg-white/5", "text-amber-500 bg-stone-100")
                  : t("text-stone-400 hover:bg-white/5", "text-stone-500 hover:bg-stone-100")
              }`}
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Emoji card: floats above the composer like WhatsApp Web's,
                sized to the chat pane so it never spills off a narrow one. */}
            {emojiOpen && (
              <div
                role="dialog"
                aria-label="Emoji"
                className={`absolute bottom-full left-2 mb-2 z-50 w-[min(560px,calc(100%-1rem))] rounded-2xl border shadow-2xl overflow-hidden origin-bottom-left animate-modal-pop ${t(
                  "bg-stone-900 border-white/10",
                  "bg-white border-stone-200",
                )}`}
              >
                {EmojiPanel ? (
                  <EmojiPanel onPick={insertEmoji} height={EMOJI_PANEL_HEIGHT} />
                ) : (
                  <EmojiGridSkeleton height={EMOJI_PANEL_HEIGHT} />
                )}
              </div>
            )}
            <div className="relative">
              <button
                onClick={() => {
                  setEmojiOpen(false);
                  setAttachOpen((v) => !v);
                }}
                aria-label="Attach"
                aria-haspopup="menu"
                aria-expanded={attachOpen}
                className={`p-2 rounded-lg cursor-pointer transition-colors ${
                  attachOpen
                    ? t("text-amber-500 bg-white/5", "text-amber-500 bg-stone-100")
                    : t("text-stone-400 hover:bg-white/5", "text-stone-500 hover:bg-stone-100")
                }`}
              >
                <Paperclip className={`w-5 h-5 transition-transform ${attachOpen ? "-rotate-45" : ""}`} />
              </button>
              <AttachMenu
                open={attachOpen}
                onClose={() => setAttachOpen(false)}
                onPick={pickAttachment}
              />
            </div>
            <div
              className={`flex-1 flex items-center px-3 py-2 rounded-2xl ${t(
                "bg-stone-900",
                "bg-stone-100"
              )}`}
            >
              <textarea
                ref={inputRef}
                rows={1}
                value={draft}
                onChange={(e) => handleDraftChange(e.target.value)}
                onSelect={rememberCaret}
                onKeyUp={rememberCaret}
                onClick={rememberCaret}
                onPaste={handlePaste}
                // Tapping the box brings the keyboard back in place of the tray.
                onFocus={() => isTouchFirst() && setEmojiOpen(false)}
                onKeyDown={handleComposerKeyDown}
                placeholder={voiceBusy ? "Sending voice message…" : "Type a message"}
                aria-label="Message"
                className={`flex-1 block bg-transparent outline-none text-sm leading-5 resize-none overflow-y-auto ${t(
                  "text-stone-100 placeholder-stone-500",
                  "text-stone-900 placeholder-stone-400"
                )}`}
              />
            </div>
            {draft.trim() ? (
              <button
                onClick={send}
                className="p-2.5 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white cursor-pointer"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            ) : (
              <button
                onClick={
                  canRecord
                    ? startRecording
                    : () => toast.error("Your browser can't record audio.")
                }
                disabled={voiceBusy}
                aria-label="Record voice message"
                title={canRecord ? "Record a voice message" : "Recording not supported"}
                className="p-2.5 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {voiceBusy ? (
                  <span className="block w-4.5 h-4.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <Mic className="w-4.5 h-4.5" />
                )}
              </button>
            )}
          </>
        )}
      </footer>

      {/* ── Long-press message menu ── */}
      <BottomSheet open={!!actionMsg} onClose={() => setActionMsg(null)}>
        <div className="px-4 py-2 flex justify-around mb-1">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                setReactingTo(actionMsg);
                setActionMsg(null);
                setTimeout(() => addReaction(emoji), 0);
              }}
              className={`text-xl p-2 rounded-full transition-transform hover:scale-125 cursor-pointer`}
            >
              {emoji}
            </button>
          ))}
        </div>
        <div className={`border-t ${t("border-white/10", "border-stone-200")}`} />
        <SheetItem icon={Reply} label="Reply" onClick={() => handleAction("reply")} />
        <SheetItem icon={Copy} label="Copy" onClick={() => handleAction("copy")} />
        <SheetItem icon={Forward} label="Forward" onClick={() => setActionMsg(null)} />
        <SheetItem
          icon={Star}
          label={actionMsg?.starred ? "Unstar" : "Star"}
          onClick={() => handleAction("star")}
        />
        <SheetItem icon={Pin} label="Pin" onClick={() => setActionMsg(null)} />
        {actionMsg?.sender_id === "me" && (
          <SheetItem icon={Edit2} label="Edit" onClick={() => setActionMsg(null)} hint="15 min" />
        )}
        <SheetItem
          icon={Trash2}
          label={actionMsg?.sender_id === "me" ? "Delete for everyone" : "Delete for me"}
          danger
          onClick={() => handleAction("delete-me")}
        />
      </BottomSheet>

      {/* ── Attachment pickers (opened from the paperclip menu) ── */}
      <input
        ref={mediaInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={onFilesPicked({ accept: "image/*,video/*" })}
      />
      <input
        ref={docInputRef}
        type="file"
        multiple
        hidden
        onChange={onFilesPicked({ asDocument: true })}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        multiple
        hidden
        onChange={onFilesPicked({ accept: "audio/*" })}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={onFilesPicked({ accept: "image/*" })}
      />

      {/* ── Review screen for picked / pasted / dropped files ── */}
      {composer && (
        <AttachmentComposer
          initialItems={composer.items}
          accept={composer.accept}
          asDocument={composer.asDocument}
          onSend={sendAttachments}
          onClose={() => setComposer(null)}
        />
      )}

      {cameraOpen && (
        <CameraCapture
          onCapture={(file) => {
            setCameraOpen(false);
            openComposer([file], { accept: "image/*" });
          }}
          onClose={() => setCameraOpen(false)}
          onError={(message) => {
            setCameraOpen(false);
            toast.error(message);
          }}
        />
      )}

      {viewerIndex !== null && mediaItems[viewerIndex] && (
        <MediaViewer
          items={mediaItems}
          index={viewerIndex}
          onIndex={setViewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}

      {/* ── Drop zone ── */}
      {dragging && !composer && (
        <div className="absolute inset-0 z-40 p-3 pointer-events-none animate-backdrop-fade">
          <div
            className={`w-full h-full rounded-2xl border-2 border-dashed border-amber-500 flex flex-col items-center justify-center gap-3 backdrop-blur-sm ${t(
              "bg-stone-950/80",
              "bg-white/80",
            )}`}
          >
            <span className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg">
              <Paperclip className="w-6 h-6" />
            </span>
            <p className="text-sm font-semibold">Drop files to send them</p>
            <p className={`text-xs ${t("text-stone-400", "text-stone-500")}`}>
              Photos, videos, audio and documents
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatThread;

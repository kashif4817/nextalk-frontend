import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import data from "@emoji-mart/data";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Phone, Video, MoreVertical, Send, Paperclip, Smile,
  Check, CheckCheck, Reply, Forward, Copy, Star, Pin, Trash2,
  Edit2, Search, VolumeX, Volume2, Eraser, ShieldOff, Info, Mic, X, Lock,
  FileText, StopCircle, Loader2, Play, Pause,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";
import { getConversation, markRead } from "../../api/conversations/conversation";
import { getMessages, sendMessage, deleteMessage } from "../../api/messages/message";
import { getContacts } from "../../api/contacts/contact";
import {
  uploadImage as uploadImageApi,
  uploadFile as uploadFileApi,
  uploadAudio as uploadAudioApi,
} from "../../api/upload/upload";
import { normalizeConversationDetail, normalizeMessage, normalizeContact, formatTime } from "../../utils/formatters";
import Avatar from "../../components/chat/Avatar";
import BottomSheet, { SheetItem } from "../../components/chat/BottomSheet";
import DropdownMenu, { MenuItem } from "../../components/chat/DropdownMenu";
import { useLongPress } from "../../components/chat/useLongPress";
import { comingSoon, showError } from "../../utils/toast";
import { useWallpaper } from "../../context/WallpaperContext";

// Direct emoji-mart wrapper — bypasses @emoji-mart/react which doesn't support React 19
const EmojiPicker = ({ onEmojiSelect, theme }) => {
  const ref = useRef(null);

  useEffect(() => {
    let destroyed = false;
    import("emoji-mart").then(({ Picker }) => {
      if (destroyed || !ref.current) return;
      ref.current.innerHTML = "";
      new Picker({
        ref, data, theme, onEmojiSelect,
        set: "native",
        previewPosition: "none",
        skinTonePosition: "search",
        maxFrequentRows: 1,
        perLine: 8,
      });
    });
    return () => {
      destroyed = true;
      if (ref.current) ref.current.innerHTML = "";
    };
  }, [theme]);

  const isDark = theme === "dark";
  return (
    <div
      ref={ref}
      style={{
        "--em-rgb-accent": "0, 168, 132",
        "--em-rgb-background": isDark ? "17, 27, 33" : "255, 255, 255",
        "--em-rgb-color": isDark ? "233, 237, 239" : "17, 27, 33",
        "--em-rgb-input": isDark ? "32, 44, 51" : "240, 242, 245",
        "--em-color-border": isDark ? "rgba(134,150,160,0.15)" : "rgba(0,0,0,0.08)",
        "--em-color-border-over": isDark ? "rgba(134,150,160,0.3)" : "rgba(0,0,0,0.15)",
      }}
    />
  );
};

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const getMessageType = (mimeType) => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "document";
};

const formatRecordingTime = (secs) => {
  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return `${m}:${s}`;
};

// ── Custom compact audio player ───────────────────────────────────────────
const AudioPlayer = ({ src, mine, t }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrent(a.currentTime || 0);
    const onMeta = () => setDuration(isFinite(a.duration) ? a.duration : 0);
    const onEnd = () => { setPlaying(false); setCurrent(0); };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("durationchange", onMeta);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("durationchange", onMeta);
      a.removeEventListener("ended", onEnd);
    };
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play(); setPlaying(true); }
  };

  const fmt = (s) => {
    const m = Math.floor((s || 0) / 60);
    const sec = Math.floor((s || 0) % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const seek = (e) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    a.currentTime = Math.max(0, Math.min(1, pct)) * duration;
  };

  const pct = duration ? (current / duration) * 100 : 0;

  const btnClass = mine
    ? t("bg-amber-500/30 text-amber-100 hover:bg-amber-500/40", "bg-amber-500 text-white hover:bg-amber-600")
    : t("bg-stone-700 text-stone-100 hover:bg-stone-600", "bg-stone-200 text-stone-700 hover:bg-stone-300");

  const trackBg = mine
    ? t("bg-amber-100/20", "bg-amber-200")
    : t("bg-stone-700", "bg-stone-200");

  const fillBg = mine ? t("bg-amber-300", "bg-amber-500") : t("bg-amber-400", "bg-amber-500");

  const timeColor = mine ? t("text-amber-100/70", "text-stone-600") : t("text-stone-400", "text-stone-500");

  return (
    <div className="flex items-center gap-2 py-0.5 min-w-[200px]">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        onClick={toggle}
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${btnClass}`}
      >
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div
          onClick={seek}
          className={`h-1 rounded-full cursor-pointer ${trackBg}`}
        >
          <div
            className={`h-full rounded-full transition-[width] ${fillBg}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={`text-[10px] tabular-nums ${timeColor}`}>
          {fmt(current)} / {fmt(duration)}
        </span>
      </div>
    </div>
  );
};

// ── Media renderer inside a message bubble ────────────────────────────────
const FileContent = ({ msg, mine, t, mediaOnly }) => {
  const type = msg.message_type;
  if (!msg.file_url || type === "text") return null;

  const gap = mediaOnly ? "" : "mb-1";

  if (type === "image") {
    return (
      <a href={msg.file_url} target="_blank" rel="noreferrer" className={`block ${gap}`}>
        <img
          src={msg.file_url}
          alt="image"
          className="rounded-lg max-w-[220px] w-full object-cover cursor-zoom-in"
        />
      </a>
    );
  }

  if (type === "video") {
    return (
      <video
        src={msg.file_url}
        controls
        className={`rounded-lg max-w-[240px] w-full ${gap}`}
      />
    );
  }

  if (type === "audio") {
    return (
      <div className={gap}>
        <AudioPlayer src={msg.file_url} mine={mine} t={t} />
      </div>
    );
  }

  // document
  return (
    <a
      href={msg.file_url}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center gap-2 mb-1 px-2 py-1.5 rounded-lg ${
        mine
          ? t("bg-amber-500/20 text-stone-100", "bg-amber-200/60 text-stone-800")
          : t("bg-white/5 text-stone-100", "bg-stone-100 text-stone-700")
      }`}
    >
      <FileText className={`w-4 h-4 shrink-0 ${mine ? t("text-amber-300", "text-amber-600") : "text-amber-500"}`} />
      <p className="text-xs font-medium truncate">
        {msg.original_name || msg.file_type || "Document"}
      </p>
    </a>
  );
};

// ── Message bubble ────────────────────────────────────────────────────────
const MessageBubble = ({ msg, mine, onLongPress, showName, conv, currentUser }) => {
  const { t } = useTheme();
  const sender = mine ? currentUser : msg.sender;
  const lp = useLongPress(() => onLongPress(msg));

  const isMedia = msg.file_url && msg.message_type !== "text";
  const mediaOnly = isMedia && !msg.text && !msg.reply_to;
  const isEmojiOnly = !isMedia && !msg.reply_to && !!msg.text &&
    !/\w/.test(msg.text) && /\p{Extended_Pictographic}/u.test(msg.text);

  const bubbleClass = isEmojiOnly
    ? "relative cursor-pointer select-none"
    : mediaOnly
    ? "relative break-words cursor-pointer select-none"
    : `relative px-2.5 py-1.5 rounded-xl text-sm break-words cursor-pointer select-none ${
        mine
          ? t(
              "bg-amber-500/20 text-stone-100 rounded-br-sm",
              "bg-amber-100 text-stone-900 rounded-br-sm"
            )
          : t(
              "bg-stone-800/90 text-stone-100 rounded-bl-sm",
              "bg-white text-stone-900 rounded-bl-sm border border-stone-200"
            )
      }`;

  const metaInsideMedia = mediaOnly;
  const metaColor = mine
    ? t("text-amber-100/70", "text-amber-700/70")
    : t("text-stone-400", "text-stone-500");

  return (
    <div className={`flex gap-2 ${mine ? "justify-end" : "justify-start"}`}>
      {!mine && conv.is_group && (
        <Avatar
          src={sender?.avatar_url}
          initials={sender?.initials}
          color={sender?.color}
          size="xs"
        />
      )}
      <div className={`flex flex-col max-w-[78%] sm:max-w-md ${mine ? "items-end" : "items-start"}`}>
        {!mine && conv.is_group && showName && (
          <span className="text-[11px] font-semibold text-amber-500 mb-0.5 px-1">
            {sender?.display_name}
          </span>
        )}
        <div {...lp} className={bubbleClass}>
          {msg.reply_to && (() => {
            const senderName = msg.reply_to.sender_name ||
              conv.members?.find(m => m.id === msg.reply_to.sender_id)?.display_name ||
              "Unknown";
            const isMedia = msg.reply_to.message_type !== "text";
            const mediaLabel = { image: "📷 Photo", video: "🎥 Video", audio: "🎵 Voice message", document: "📄 Document" }[msg.reply_to.message_type] || "📎 Media";
            const replyBg = mine
              ? t("bg-amber-500/15", "bg-amber-200/60")
              : t("bg-black/20", "bg-stone-100");
            return (
              <div className={`mb-1.5 rounded-md border-l-2 border-amber-500 overflow-hidden flex ${replyBg}`}>
                {isMedia && msg.reply_to.file_url && msg.reply_to.message_type === "image" && (
                  <img src={msg.reply_to.file_url} alt="" className="w-9 h-9 object-cover shrink-0" />
                )}
                <div className="px-2 py-1 min-w-0">
                  <p className="text-[11px] font-semibold text-amber-500 truncate leading-tight">{senderName}</p>
                  {isMedia ? (
                    <p className={`text-[11px] italic leading-tight ${mine ? t("text-amber-100/70", "text-stone-600") : t("text-stone-400", "text-stone-500")}`}>{mediaLabel}</p>
                  ) : (
                    <p className={`text-[11px] truncate leading-tight ${mine ? t("text-amber-100/80", "text-stone-700") : t("text-stone-300", "text-stone-600")}`}>{msg.reply_to.text || "Message"}</p>
                  )}
                </div>
              </div>
            );
          })()}

          <FileContent msg={msg} mine={mine} t={t} mediaOnly={mediaOnly} />

          {msg.text && (
            <p className={isEmojiOnly ? "text-4xl leading-none" : "leading-snug whitespace-pre-wrap"}>
              {msg.text}
              {!isEmojiOnly && !metaInsideMedia && (
                <span className="inline-flex items-center gap-0.5 align-baseline ml-2 select-none">
                  <span className={`text-[10px] tabular-nums ${metaColor}`}>{msg.time}</span>
                  {mine && (msg.status === "read"
                    ? <CheckCheck className={`w-3 h-3 ${t("text-amber-300", "text-amber-600")}`} />
                    : <Check className={`w-3 h-3 ${metaColor}`} />
                  )}
                </span>
              )}
            </p>
          )}
          {isEmojiOnly && (
            <div className={`flex items-center gap-1 mt-0.5 text-[10px] ${metaColor} ${mine ? "justify-end" : "justify-start"}`}>
              <span>{msg.time}</span>
              {mine && (msg.status === "read"
                ? <CheckCheck className={`w-3 h-3 ${t("text-amber-300", "text-amber-600")}`} />
                : <Check className="w-3 h-3" />
              )}
            </div>
          )}
        </div>

        {msg.reactions?.length > 0 && (
          <div className="flex gap-1 mt-0.5 px-1">
            {msg.reactions.map((r, i) => (
              <span key={i} className={`text-xs px-1.5 py-0.5 rounded-full border ${t("bg-stone-800 border-white/10", "bg-white border-stone-200")}`}>
                {r.emoji} {r.count}
              </span>
            ))}
          </div>
        )}

        {metaInsideMedia && (
          <div className={`flex items-center gap-1 mt-0.5 px-1 text-[10px] ${metaColor}`}>
            <span>{msg.time}</span>
            {mine && (msg.status === "read"
              ? <CheckCheck className={`w-3 h-3 ${t("text-amber-300", "text-amber-600")}`} />
              : <Check className="w-3 h-3" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────
const ChatThread = () => {
  const { t, dark } = useTheme();
  const { wallpaper } = useWallpaper();
  const { user } = useUser();
  const { id } = useParams();
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const { data, isLoading: loading } = useQuery({
    queryKey: ["thread", id],
    queryFn: async () => {
      const [convRes, msgRes] = await Promise.all([getConversation(id), getMessages(id)]);
      const conv = normalizeConversationDetail(convRes.data.data, user.id);
      const messages = (msgRes.data.data?.messages || [])
        .map(m => normalizeMessage(m, user.id))
        .reverse();
      return { conv, messages };
    },
    enabled: !!id && !!user,
  });

  // Contacts — same cache key as ChatListPane, so this is a free cache read
  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts", user?.id],
    queryFn: async () => {
      const res = await getContacts();
      return (res.data.data || []).map(normalizeContact).filter(Boolean);
    },
    enabled: !!user,
  });

  const rawConv = data?.conv ?? null;
  const messages = data?.messages ?? [];

  // Override the conversation title with the saved contact nickname if one exists
  const conv = rawConv && !rawConv.is_group
    ? (() => {
        const contactRow = contacts.find(c => c.id === rawConv.other_user_id);
        const nickname = contactRow?.nickname;
        return nickname ? { ...rawConv, title: nickname } : rawConv;
      })()
    : rawConv;

  // Helper: update the messages array inside the cached thread without a full refetch
  const updateMessages = (fn) =>
    queryClient.setQueryData(["thread", id], (old) =>
      old ? { ...old, messages: fn(old.messages) } : old
    );

  const [draft, setDraft] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);
  const [reactingTo, setReactingTo] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filePreview, setFilePreview] = useState(null);

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const emojiPickerRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const fileInputRef = useRef(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!id) return;
    markRead(id)
      .then(() => queryClient.invalidateQueries({ queryKey: ["conversations"] }))
      .catch(() => {});
  }, [id, queryClient]);

  useEffect(() => {
    if (!showEmoji) return;
    const handleClickOutside = (e) => {
      if (emojiButtonRef.current?.contains(e.target)) return;
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmoji]);

  // Clean up recording on unmount
  useEffect(() => {
    return () => {
      clearInterval(recordingTimerRef.current);
      mediaRecorderRef.current?.stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  if (loading) {
    return (
      <div className={`h-full flex items-center justify-center ${t("bg-stone-950", "bg-stone-50")}`}>
        <div className="w-8 h-8 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
      </div>
    );
  }

  if (!conv) {
    return (
      <div className={`h-full flex flex-col items-center justify-center ${t("bg-stone-950 text-stone-300", "bg-stone-50 text-stone-700")}`}>
        <p className="mb-4">Conversation not found.</p>
        <button onClick={() => navigate("/chat")} className="text-amber-500 underline">Back to chats</button>
      </div>
    );
  }

  // ── Text send ────────────────────────────────────────────────────────────
  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    const optimistic = {
      id: `opt-${Date.now()}`,
      sender_id: user.id,
      message_type: "text",
      content: text,
      text,
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      created_at: new Date().toISOString(),
      reactions: [],
      status: "sent",
      seen_by: [],
      sender: user,
      reply_to: replyTo ? {
        id: replyTo.id,
        text: replyTo.text || replyTo.content,
        message_type: replyTo.message_type || "text",
        file_url: replyTo.file_url || null,
        sender_id: replyTo.sender_id,
        sender_name: replyTo.sender_id === user.id ? "You" : (replyTo.sender_name || replyTo.sender?.display_name || null),
      } : null,
    };
    updateMessages(prev => [...prev, optimistic]);
    setDraft("");
    setReplyTo(null);
    setShowEmoji(false);
    inputRef.current?.focus();
    try {
      await sendMessage({ conversation_id: id, content: text, reply_to_id: replyTo?.id || null });
    } catch {
      updateMessages(prev => prev.filter(m => m.id !== optimistic.id));
    }
  };

  // ── File/image/video/doc upload ──────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const msgType = getMessageType(file.type);
    const previewUrl = URL.createObjectURL(file);

    setFilePreview({
      file,
      msgType,
      previewUrl,
    });
  };

  const confirmFileUpload = async () => {
    if (!filePreview) return;
    const { file, msgType } = filePreview;
    const optId = `opt-${Date.now()}`;
    setUploading(true);

    try {
      const uploadFn =
        msgType === "image" ? uploadImageApi :
        msgType === "audio" ? uploadAudioApi :
        uploadFileApi;

      const { data } = await uploadFn(file);
      const fileUrl = data.data.url;

      const optimistic = {
        id: optId,
        sender_id: user.id,
        message_type: msgType,
        content: null,
        text: null,
        file_url: fileUrl,
        file_type: file.type,
        original_name: file.name,
        time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        created_at: new Date().toISOString(),
        reactions: [],
        status: "sent",
        seen_by: [],
        sender: user,
        reply_to: replyTo ? {
          id: replyTo.id,
          text: replyTo.text || replyTo.content,
          message_type: replyTo.message_type || "text",
          file_url: replyTo.file_url || null,
          sender_id: replyTo.sender_id,
          sender_name: replyTo.sender_id === user.id ? "You" : (replyTo.sender_name || replyTo.sender?.display_name || null),
        } : null,
      };

      updateMessages(prev => [...prev, optimistic]);
      setReplyTo(null);
      setFilePreview(null);

      await sendMessage({
        conversation_id: id,
        message_type: msgType,
        file_url: fileUrl,
        file_type: file.type,
        reply_to_id: replyTo?.id || null,
      });
    } catch {
      showError("Upload failed. Please try again.");
      updateMessages(prev => prev.filter(m => m.id !== optId));
    } finally {
      setUploading(false);
    }
  };

  // ── Voice recording ──────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch {
      showError("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    recorder.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      recorder.stream.getTracks().forEach(t => t.stop());
      audioChunksRef.current = [];
      await sendVoiceMessage(blob);
    };

    recorder.stop();
    setIsRecording(false);
    clearInterval(recordingTimerRef.current);
    setRecordingTime(0);
  };

  const cancelRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    recorder.stream.getTracks().forEach(t => t.stop());
    recorder.stop();
    audioChunksRef.current = [];
    mediaRecorderRef.current = null;
    setIsRecording(false);
    clearInterval(recordingTimerRef.current);
    setRecordingTime(0);
  };

  const sendVoiceMessage = async (blob) => {
    const optId = `opt-${Date.now()}`;
    setUploading(true);
    try {
      const { data } = await uploadAudioApi(blob);
      const fileUrl = data.data.url;

      const optimistic = {
        id: optId,
        sender_id: user.id,
        message_type: "audio",
        content: null,
        text: null,
        file_url: fileUrl,
        file_type: "audio/webm",
        time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        created_at: new Date().toISOString(),
        reactions: [],
        status: "sent",
        seen_by: [],
        sender: user,
        reply_to: null,
      };

      updateMessages(prev => [...prev, optimistic]);
      await sendMessage({
        conversation_id: id,
        message_type: "audio",
        file_url: fileUrl,
        file_type: "audio/webm",
      });
    } catch {
      showError("Failed to send voice message.");
      updateMessages(prev => prev.filter(m => m.id !== optId));
    } finally {
      setUploading(false);
    }
  };

  // ── Message actions ──────────────────────────────────────────────────────
  const handleAction = (action) => {
    if (!actionMsg) return;
    if (action === "reply") setReplyTo(actionMsg);
    if (action === "copy") navigator.clipboard?.writeText(actionMsg.text);
    if (action === "delete-me") {
      deleteMessage(actionMsg.id, "for_me").catch(console.error);
      updateMessages(p => p.filter(m => m.id !== actionMsg.id));
    }
    if (action === "delete-all") {
      deleteMessage(actionMsg.id, "for_everyone").catch(console.error);
      updateMessages(p => p.filter(m => m.id !== actionMsg.id));
    }
    if (action === "react") {
      setReactingTo(actionMsg);
      setActionMsg(null);
      return;
    }
    setActionMsg(null);
  };

  const addReaction = (emoji) => {
    if (!reactingTo) return;
    updateMessages(p =>
      p.map(m => {
        if (m.id !== reactingTo.id) return m;
        const has = m.reactions?.find(r => r.emoji === emoji);
        if (has) return { ...m, reactions: m.reactions.filter(r => r.emoji !== emoji) };
        return { ...m, reactions: [...(m.reactions || []), { emoji, count: 1, by_me: true }] };
      })
    );
    setReactingTo(null);
  };

  const headerSubtitle = conv.is_group
    ? `${conv.members_count} members`
    : conv.status === "online"
    ? "online"
    : `last seen ${formatTime(conv.last_seen)}`;

  return (
    <div className={`h-full flex flex-col relative ${t("bg-stone-950 text-stone-100", "bg-stone-100 text-stone-900")}`}>

      {/* Hidden file input — accepts images, videos, docs */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.txt"
        onChange={handleFileSelect}
      />

      <header className={`shrink-0 border-b backdrop-blur-xl ${t("bg-stone-950/80 border-white/5", "bg-white/85 border-stone-200")}`}>
        <div className="flex items-center gap-2 px-2 h-14">
          <button onClick={() => navigate(-1)} className={`md:hidden p-2 rounded-lg cursor-pointer ${t("text-stone-300 hover:bg-white/5", "text-stone-700 hover:bg-stone-100")}`}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => conv.is_group ? navigate(`/chat/${conv.id}/info`) : navigate(`/chat/profile/${conv.other_user_id}`)}
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
          >
            <Avatar
              src={conv.avatar_url}
              initials={conv.initials}
              color={conv.color}
              size="sm"
              status={conv.status}
            />
            <div className="text-left min-w-0">
              <p className={`text-sm font-semibold truncate ${t("text-stone-100", "text-stone-900")}`}>{conv.title}</p>
              <p className={`text-[11px] truncate ${t("text-stone-400", "text-stone-500")}`}>{headerSubtitle}</p>
            </div>
          </button>
          <button onClick={() => comingSoon("Video calls")} className={`p-2 rounded-lg cursor-pointer ${t("text-stone-400 hover:bg-white/5", "text-stone-500 hover:bg-stone-100")}`}>
            <Video className="w-5 h-5" />
          </button>
          <button onClick={() => comingSoon("Voice calls")} className={`p-2 rounded-lg cursor-pointer ${t("text-stone-400 hover:bg-white/5", "text-stone-500 hover:bg-stone-100")}`}>
            <Phone className="w-5 h-5" />
          </button>
          <div className="relative">
            <button onClick={() => setMenuOpen(v => !v)} className={`p-2 rounded-lg cursor-pointer ${t("text-stone-400 hover:bg-white/5", "text-stone-500 hover:bg-stone-100")}`}>
              <MoreVertical className="w-5 h-5" />
            </button>
            <DropdownMenu open={menuOpen} onClose={() => setMenuOpen(false)}>
              <MenuItem icon={Info} label={conv.is_group ? "Group info" : "View profile"} onClick={() => { setMenuOpen(false); conv.is_group ? navigate(`/chat/${conv.id}/info`) : navigate(`/chat/profile/${conv.other_user_id}`); }} />
              <MenuItem icon={Search} label="Search messages" onClick={() => { setMenuOpen(false); comingSoon("In-chat search"); }} />
              <MenuItem icon={Pin} label="Pinned messages" onClick={() => setMenuOpen(false)} />
              <MenuItem icon={Star} label="Starred messages" onClick={() => { setMenuOpen(false); navigate("/chat/starred"); }} />
              {conv.is_muted
                ? <MenuItem icon={Volume2} label="Unmute notifications" onClick={() => setMenuOpen(false)} />
                : <MenuItem icon={VolumeX} label="Mute notifications" onClick={() => setMenuOpen(false)} />
              }
              <MenuItem icon={Eraser} label="Clear chat" onClick={() => { setMenuOpen(false); updateMessages(() => []); }} />
              {!conv.is_group && <MenuItem icon={ShieldOff} label="Block user" danger onClick={() => setMenuOpen(false)} />}
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div style={wallpaper.style(dark)} className="flex-1 overflow-y-auto scrollbar-hide px-3 sm:px-6 py-2 space-y-1">
        <div className="flex justify-center pt-1 pb-2">
          <div className={`max-w-md inline-flex items-start gap-1.5 px-3 py-1.5 rounded-lg text-[10.5px] leading-snug text-center ${t("bg-amber-500/10 text-amber-200/90 border border-amber-500/15", "bg-amber-50/80 text-amber-800 border border-amber-200/60")}`}>
            <Lock className="w-3 h-3 mt-0.5 shrink-0 text-amber-500" />
            <span>
              Messages are end-to-end encrypted. No one outside of this chat, not even NexTalk, can read or listen to them.{" "}
              <button onClick={() => navigate("/privacy")} className="font-semibold text-amber-600 hover:text-amber-500 underline underline-offset-2 cursor-pointer">Learn more</button>
            </span>
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className={`text-sm ${t("text-stone-500", "text-stone-400")}`}>No messages yet. Say hi 👋</p>
          </div>
        ) : (
          messages.map((m, i) => {
            const prev = messages[i - 1];
            const showName = !prev || prev.sender_id !== m.sender_id;
            return (
              <MessageBubble
                key={m.id}
                msg={m}
                mine={m.sender_id === user.id}
                onLongPress={setActionMsg}
                showName={showName}
                conv={conv}
                currentUser={user}
              />
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {replyTo && (() => {
        const replyBarName = replyTo.sender_id === user.id ? "yourself" : (replyTo.sender_name || replyTo.sender?.display_name || "Unknown");
        const replyIsMedia = replyTo.message_type && replyTo.message_type !== "text";
        const replyMediaLabel = { image: "📷 Photo", video: "🎥 Video", audio: "🎵 Voice message", document: "📄 Document" }[replyTo.message_type] || "📎 Media";
        return (
          <div className={`px-4 py-2 flex items-center gap-3 border-t ${t("bg-stone-900 border-white/5", "bg-stone-50 border-stone-200")}`}>
            <div className="w-1 self-stretch rounded-full bg-amber-500 shrink-0" />
            {replyIsMedia && replyTo.file_url && replyTo.message_type === "image" && (
              <img src={replyTo.file_url} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-500 truncate">Replying to {replyBarName}</p>
              <p className={`text-xs truncate ${t("text-stone-400", "text-stone-500")}`}>
                {replyIsMedia ? replyMediaLabel : (replyTo.text || replyTo.content || "Message")}
              </p>
            </div>
            <button onClick={() => setReplyTo(null)} className={`p-1 rounded shrink-0 ${t("text-stone-400", "text-stone-500")}`}>
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })()}

      {/* ── Footer ── */}
      <footer className={`shrink-0 border-t px-2 py-2 flex items-end gap-1 ${t("bg-stone-950 border-white/5", "bg-white border-stone-200")}`}>
        {isRecording ? (
          // Recording UI
          <div className="flex-1 flex items-center gap-2 px-2">
            <button
              onClick={cancelRecording}
              className={`p-2 rounded-lg ${t("text-stone-400 hover:bg-white/5", "text-stone-500 hover:bg-stone-100")}`}
            >
              <X className="w-5 h-5" />
            </button>
            <span className="flex items-center gap-1.5 text-sm font-medium text-red-500">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {formatRecordingTime(recordingTime)}
            </span>
            <div className="flex-1" />
            <button
              onClick={stopRecording}
              className="p-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white cursor-pointer transition-colors"
            >
              <StopCircle className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            <button
              ref={emojiButtonRef}
              onClick={() => setShowEmoji(v => !v)}
              className={`p-2 rounded-lg cursor-pointer transition-colors ${showEmoji ? t("text-amber-400 bg-amber-500/15", "text-amber-600 bg-amber-50") : t("text-stone-400 hover:bg-white/5", "text-stone-500 hover:bg-stone-100")}`}
            >
              <Smile className="w-5 h-5" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`p-2 rounded-lg cursor-pointer ${t("text-stone-400 hover:bg-white/5", "text-stone-500 hover:bg-stone-100")}`}
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <div className={`flex-1 flex items-center px-3 py-2 rounded-2xl ${t("bg-stone-900", "bg-stone-100")}`}>
              <input
                ref={inputRef}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
                placeholder="Type a message"
                className={`flex-1 bg-transparent outline-none text-sm ${t("text-stone-100 placeholder-stone-500", "text-stone-900 placeholder-stone-400")}`}
              />
            </div>
            {uploading ? (
              <div className="p-2.5 rounded-full bg-amber-500 text-white">
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              </div>
            ) : draft.trim() ? (
              <button onClick={send} className="p-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white cursor-pointer transition-colors">
                <Send className="w-4.5 h-4.5" />
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="p-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white cursor-pointer transition-colors"
              >
                <Mic className="w-4.5 h-4.5" />
              </button>
            )}
          </>
        )}
      </footer>

      {filePreview && (
        <BottomSheet open={true} onClose={() => setFilePreview(null)}>
          <div className="px-5 py-4 flex flex-col items-center gap-4">
            <p className={`text-sm font-semibold ${t("text-stone-100", "text-stone-900")}`}>
              Send {filePreview.msgType}?
            </p>

            {filePreview.msgType === "image" && (
              <img
                src={filePreview.previewUrl}
                alt="preview"
                className="rounded-lg max-w-xs max-h-72 object-cover"
              />
            )}
            {filePreview.msgType === "video" && (
              <video
                src={filePreview.previewUrl}
                controls
                className="rounded-lg max-w-xs max-h-72"
              />
            )}
            {filePreview.msgType === "audio" && (
              <audio
                src={filePreview.previewUrl}
                controls
                className="w-full max-w-xs"
              />
            )}
            {filePreview.msgType === "document" && (
              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full ${t("bg-stone-800", "bg-stone-100")}`}>
                <FileText className={`w-6 h-6 shrink-0 ${t("text-stone-400", "text-stone-500")}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{filePreview.file.name}</p>
                  <p className={`text-xs ${t("text-stone-500", "text-stone-400")}`}>
                    {(filePreview.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3 w-full">
              <button
                onClick={() => setFilePreview(null)}
                className={`flex-1 py-2.5 rounded-lg font-medium text-sm ${t("bg-stone-800 text-stone-100 hover:bg-stone-700", "bg-stone-200 text-stone-900 hover:bg-stone-300")}`}
              >
                Cancel
              </button>
              <button
                onClick={confirmFileUpload}
                disabled={uploading}
                className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? "Uploading..." : "Send"}
              </button>
            </div>
          </div>
        </BottomSheet>
      )}

      {showEmoji && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-[60px] left-2 z-[999] max-w-[calc(100%-16px)]"
        >
          <EmojiPicker
            theme={dark ? "dark" : "light"}
            onEmojiSelect={(emoji) => {
              setDraft(prev => prev + emoji.native);
              setShowEmoji(false);
              inputRef.current?.focus();
            }}
          />
        </div>
      )}

      <BottomSheet open={!!actionMsg} onClose={() => setActionMsg(null)}>
        <div className="px-4 py-2 flex justify-around mb-1">
          {QUICK_REACTIONS.map(emoji => (
            <button key={emoji} onClick={() => { setReactingTo(actionMsg); setActionMsg(null); setTimeout(() => addReaction(emoji), 0); }} className="text-xl p-2 rounded-full transition-transform hover:scale-125 cursor-pointer">
              {emoji}
            </button>
          ))}
        </div>
        <div className={`border-t ${t("border-white/10", "border-stone-200")}`} />
        <SheetItem icon={Reply} label="Reply" onClick={() => handleAction("reply")} />
        <SheetItem icon={Copy} label="Copy" onClick={() => handleAction("copy")} />
        <SheetItem icon={Forward} label="Forward" onClick={() => setActionMsg(null)} />
        <SheetItem icon={Pin} label="Pin" onClick={() => setActionMsg(null)} />
        {actionMsg?.sender_id === user?.id && (
          <SheetItem icon={Edit2} label="Edit" onClick={() => setActionMsg(null)} hint="15 min" />
        )}
        <SheetItem
          icon={Trash2}
          label={actionMsg?.sender_id === user?.id ? "Delete for everyone" : "Delete for me"}
          danger
          onClick={() => handleAction(actionMsg?.sender_id === user?.id ? "delete-all" : "delete-me")}
        />
      </BottomSheet>
    </div>
  );
};

export default ChatThread;

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
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import {
  CONVERSATIONS,
  MESSAGES,
  ME,
  getUser,
  getConversation,
} from "../../data/mockChatData";
import Avatar from "../../components/chat/Avatar";
import BottomSheet, { SheetItem } from "../../components/chat/BottomSheet";
import DropdownMenu, { MenuItem } from "../../components/chat/DropdownMenu";
import { useLongPress } from "../../components/chat/useLongPress";
import { comingSoon } from "../../utils/toast";
import { useWallpaper } from "../../context/WallpaperContext";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const MessageBubble = ({ msg, mine, onLongPress, showName, conv }) => {
  const { t } = useTheme();
  const sender = msg.sender_id === "me" ? ME : getUser(msg.sender_id);
  const lp = useLongPress(() => onLongPress(msg));

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
          className={`relative px-3 py-2 rounded-2xl text-sm break-words cursor-pointer select-none ${
            mine
              ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-br-md"
              : t(
                  "bg-stone-800 text-stone-100 rounded-bl-md",
                  "bg-white text-stone-900 rounded-bl-md border border-stone-200"
                )
          }`}
        >
          {msg.attachment && (
            <div
              className={`flex items-center gap-2 mb-2 px-2.5 py-2 rounded-lg ${
                mine ? "bg-white/15" : t("bg-white/5", "bg-stone-100")
              }`}
            >
              <div
                className={`w-9 h-9 rounded-md flex items-center justify-center ${
                  mine ? "bg-white/20" : "bg-amber-500/20"
                }`}
              >
                <Paperclip
                  className={`w-4 h-4 ${mine ? "text-white" : "text-amber-500"}`}
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{msg.attachment.name}</p>
                <p className={`text-[10px] ${mine ? "text-white/70" : t("text-stone-400", "text-stone-500")}`}>
                  {msg.attachment.size}
                </p>
              </div>
            </div>
          )}
          <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
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
            <CheckCheck className="w-3 h-3 text-amber-500" />
          ) : (
            <Check className="w-3 h-3" />
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

  const conv = getConversation(id);
  const other = conv && !conv.is_group ? getUser(conv.other_user_id) : null;

  const [messages, setMessages] = useState(MESSAGES[id] || []);
  const [draft, setDraft] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);
  const [reactingTo, setReactingTo] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!conv) {
    return (
      <div className={`h-full flex flex-col items-center justify-center ${t("bg-stone-950 text-stone-300", "bg-stone-50 text-stone-700")}`}>
        <p className="mb-4">Conversation not found.</p>
        <button onClick={() => navigate("/chat")} className="text-amber-500 underline">
          Back to chats
        </button>
      </div>
    );
  }

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender_id: "me",
        text,
        time,
        reactions: [],
        starred: false,
        status: "sent",
        reply_to: replyTo ? { id: replyTo.id, text: replyTo.text, sender: replyTo.sender_id === "me" ? "You" : getUser(replyTo.sender_id)?.display_name } : null,
      },
    ]);
    setDraft("");
    setReplyTo(null);
    inputRef.current?.focus();
  };

  const handleAction = (action) => {
    if (!actionMsg) return;
    if (action === "reply") setReplyTo(actionMsg);
    if (action === "copy") navigator.clipboard?.writeText(actionMsg.text);
    if (action === "star")
      setMessages((p) =>
        p.map((m) => (m.id === actionMsg.id ? { ...m, starred: !m.starred } : m))
      );
    if (action === "delete-me" || action === "delete-all")
      setMessages((p) => p.filter((m) => m.id !== actionMsg.id));
    if (action === "react") {
      setReactingTo(actionMsg);
      setActionMsg(null);
      return;
    }
    setActionMsg(null);
  };

  const addReaction = (emoji) => {
    if (!reactingTo) return;
    setMessages((p) =>
      p.map((m) => {
        if (m.id !== reactingTo.id) return m;
        const has = m.reactions?.find((r) => r.emoji === emoji);
        if (has) {
          return {
            ...m,
            reactions: m.reactions.filter((r) => r.emoji !== emoji),
          };
        }
        return {
          ...m,
          reactions: [...(m.reactions || []), { emoji, count: 1, by_me: true }],
        };
      })
    );
    setReactingTo(null);
  };

  const headerSubtitle = conv.is_group
    ? `${conv.members_count} members`
    : other?.status === "online"
    ? "online"
    : `last seen ${other?.last_seen}`;

  return (
    <div className={`h-full flex flex-col ${t("bg-stone-950 text-stone-100", "bg-stone-100 text-stone-900")}`}>
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
              initials={conv.is_group ? conv.initials : other?.initials}
              color={conv.is_group ? conv.color : other?.color}
              size="sm"
              status={!conv.is_group ? other?.status : null}
            />
            <div className="text-left min-w-0">
              <p className={`text-sm font-semibold truncate ${t("text-stone-100", "text-stone-900")}`}>
                {conv.title}
              </p>
              <p className={`text-[11px] truncate ${t("text-stone-400", "text-stone-500")}`}>
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
              <MenuItem icon={Eraser} label="Clear chat" onClick={() => { setMenuOpen(false); setMessages([]); }} />
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

        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className={`text-center text-sm ${t("text-stone-500", "text-stone-400")}`}>
              <p>No messages yet. Say hi 👋</p>
            </div>
          </div>
        ) : (
          messages.map((m, i) => {
            const prev = messages[i - 1];
            const showName = !prev || prev.sender_id !== m.sender_id;
            return (
              <MessageBubble
                key={m.id}
                msg={m}
                mine={m.sender_id === "me"}
                onLongPress={setActionMsg}
                showName={showName}
                conv={conv}
              />
            );
          })
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
              Replying to {replyTo.sender_id === "me" ? "yourself" : getUser(replyTo.sender_id)?.display_name}
            </p>
            <p className={`text-xs truncate ${t("text-stone-400", "text-stone-500")}`}>
              {replyTo.text}
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
        className={`shrink-0 border-t px-2 py-2 flex items-end gap-1 ${t(
          "bg-stone-950 border-white/5",
          "bg-white border-stone-200"
        )}`}
      >
        <button
          onClick={() => comingSoon("Emoji picker")}
          className={`p-2 rounded-lg cursor-pointer ${t("text-stone-400 hover:bg-white/5", "text-stone-500 hover:bg-stone-100")}`}
        >
          <Smile className="w-5 h-5" />
        </button>
        <button
          onClick={() => comingSoon("Attachments")}
          className={`p-2 rounded-lg cursor-pointer ${t("text-stone-400 hover:bg-white/5", "text-stone-500 hover:bg-stone-100")}`}
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <div
          className={`flex-1 flex items-center px-3 py-2 rounded-2xl ${t(
            "bg-stone-900",
            "bg-stone-100"
          )}`}
        >
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Type a message"
            className={`flex-1 bg-transparent outline-none text-sm ${t(
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
            onClick={() => comingSoon("Voice messages")}
            className={`p-2.5 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white cursor-pointer`}
          >
            <Mic className="w-4.5 h-4.5" />
          </button>
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
    </div>
  );
};

export default ChatThread;

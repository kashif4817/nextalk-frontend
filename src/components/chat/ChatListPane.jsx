import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Search,
  MoreVertical,
  Plus,
  Pin,
  Volume2,
  VolumeX,
  Archive,
  Trash2,
  CheckCheck,
  X,
  UsersRound,
  Star,
  Settings,
  Bell,
  MessageSquarePlus,
  ShieldOff,
  CircleUser,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { CONVERSATIONS, getUser } from "../../data/mockChatData";
import Avatar from "./Avatar";
import BottomSheet, { SheetItem } from "./BottomSheet";
import DropdownMenu, { MenuItem } from "./DropdownMenu";
import { useLongPress } from "./useLongPress";
import NexTalkLogo from "../NexTalkLogo";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "groups", label: "Groups" },
  { id: "pinned", label: "Pinned" },
];

const ChatRow = ({ conv, onLongPress, onClick, active }) => {
  const { t } = useTheme();
  const lp = useLongPress(() => onLongPress(conv));

  const other = !conv.is_group ? getUser(conv.other_user_id) : null;
  const initials = conv.is_group ? conv.initials : other?.initials;
  const color = conv.is_group ? conv.color : other?.color;
  const status = !conv.is_group ? other?.status : null;

  return (
    <button
      {...lp}
      onClick={() => {
        if (lp.didTriggerLongPress()) return;
        onClick(conv);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors text-left ${
        active
          ? t("bg-amber-500/10", "bg-amber-50")
          : t("hover:bg-white/5 active:bg-white/10", "hover:bg-stone-50 active:bg-stone-100")
      }`}
    >
      <Avatar initials={initials} color={color} size="md" status={status} />

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`text-sm font-semibold truncate ${t("text-stone-100", "text-stone-900")}`}>
            {conv.title}
          </p>
          <span
            className={`text-[11px] shrink-0 ${
              conv.unread_count > 0
                ? "text-amber-500 font-semibold"
                : t("text-stone-500", "text-stone-400")
            }`}
          >
            {conv.last_message?.time}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p
            className={`text-xs truncate ${
              conv.unread_count > 0
                ? t("text-stone-200", "text-stone-700")
                : t("text-stone-400", "text-stone-500")
            }`}
          >
            {conv.last_message?.text}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            {conv.is_muted && (
              <VolumeX className={`w-3.5 h-3.5 ${t("text-stone-500", "text-stone-400")}`} />
            )}
            {conv.is_pinned && (
              <Pin className={`w-3.5 h-3.5 ${t("text-stone-500", "text-stone-400")}`} />
            )}
            {conv.unread_count > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center">
                {conv.unread_count > 99 ? "99+" : conv.unread_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

// The actual chat list column. Used standalone on mobile, embedded inside ChatHome split view on desktop.
const ChatListPane = () => {
  const { t } = useTheme();
  const navigate = useNavigate();
  const { id: activeChatId } = useParams();

  const [conversations, setConversations] = useState(CONVERSATIONS);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionConv, setActionConv] = useState(null);

  const visible = useMemo(() => {
    let list = conversations.filter((c) => !c.is_archived);
    if (filter === "unread") list = list.filter((c) => c.unread_count > 0);
    if (filter === "groups") list = list.filter((c) => c.is_group);
    if (filter === "pinned") list = list.filter((c) => c.is_pinned);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.last_message?.text?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.last_message_at) - new Date(a.last_message_at);
    });
  }, [conversations, filter, search]);

  const archivedCount = conversations.filter((c) => c.is_archived).length;

  const updateConv = (id, patch) =>
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const handleAction = (action) => {
    if (!actionConv) return;
    const id = actionConv.id;
    if (action === "pin") updateConv(id, { is_pinned: true, pinned_at: new Date().toISOString() });
    if (action === "unpin") updateConv(id, { is_pinned: false });
    if (action === "mute") updateConv(id, { is_muted: true });
    if (action === "unmute") updateConv(id, { is_muted: false });
    if (action === "archive") updateConv(id, { is_archived: true });
    if (action === "read") updateConv(id, { unread_count: 0 });
    if (action === "delete") setConversations((p) => p.filter((c) => c.id !== id));
    setActionConv(null);
  };

  const empty = conversations.length === 0;

  return (
    <div
      className={`h-full flex flex-col ${t(
        "bg-stone-950 text-stone-100",
        "bg-stone-50 text-stone-900"
      )}`}
    >
      {/* ── Top Bar — NexTalk title + 3-dot menu ── */}
      <header
        className={`shrink-0 border-b ${t(
          "bg-stone-950/80 border-white/5",
          "bg-white border-stone-200"
        )}`}
      >
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <NexTalkLogo className="w-9 h-9" />
            <h1 className={`text-lg font-bold ${t("text-stone-100", "text-stone-900")}`}>
              Nex<span className="text-amber-500">Talk</span>
            </h1>
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className={`p-2 rounded-lg cursor-pointer ${t(
                "text-stone-400 hover:bg-white/5",
                "text-stone-500 hover:bg-stone-100"
              )}`}
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            <DropdownMenu open={menuOpen} onClose={() => setMenuOpen(false)}>
              <MenuItem icon={UsersRound} label="New group" onClick={() => { setMenuOpen(false); navigate("/chat/new-group"); }} />
              <MenuItem icon={CircleUser} label="Contacts" onClick={() => { setMenuOpen(false); navigate("/chat/contacts"); }} />
              <MenuItem icon={Star} label="Starred messages" onClick={() => { setMenuOpen(false); navigate("/chat/starred"); }} />
              <MenuItem icon={Archive} label="Archived" onClick={() => { setMenuOpen(false); navigate("/chat/archived"); }} hint={archivedCount > 0 ? String(archivedCount) : null} />
              <MenuItem icon={ShieldOff} label="Blocked users" onClick={() => { setMenuOpen(false); navigate("/chat/blocked"); }} />
              <MenuItem icon={Bell} label="Notifications" onClick={() => { setMenuOpen(false); navigate("/chat/settings"); }} />
              <MenuItem icon={Settings} label="Settings" onClick={() => { setMenuOpen(false); navigate("/chat/settings"); }} />
            </DropdownMenu>
          </div>
        </div>

        {/* Always-visible search bar */}
        <div className="px-3 pb-3">
          <div
            className={`flex items-center gap-2 px-3.5 py-2 rounded-full ${t(
              "bg-white/5",
              "bg-stone-100"
            )}`}
          >
            <Search className={`w-4 h-4 ${t("text-stone-500", "text-stone-400")}`} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats..."
              className={`flex-1 bg-transparent outline-none text-sm ${t(
                "text-stone-200 placeholder-stone-600",
                "text-stone-700 placeholder-stone-400"
              )}`}
            />
            {search && (
              <button onClick={() => setSearch("")} className={t("text-stone-500", "text-stone-400")}>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 px-4 pb-2 overflow-x-auto scrollbar-none">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap cursor-pointer transition-colors ${
                filter === f.id
                  ? "bg-amber-500 text-white"
                  : t(
                      "bg-white/5 text-stone-400 hover:bg-white/10",
                      "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    )
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Archived banner (matched padding with chat rows) ── */}
      {archivedCount > 0 && filter === "all" && !search && (
        <button
          onClick={() => navigate("/chat/archived")}
          className={`w-full flex items-center gap-3 px-4 py-3 border-b cursor-pointer ${t(
            "border-white/5 hover:bg-white/5",
            "border-stone-100 hover:bg-stone-50"
          )}`}
        >
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${t(
              "bg-stone-800",
              "bg-stone-100"
            )}`}
          >
            <Archive className={`w-5 h-5 ${t("text-stone-300", "text-stone-500")}`} />
          </div>
          <div className="flex-1 text-left">
            <p className={`text-sm font-semibold ${t("text-stone-100", "text-stone-900")}`}>
              Archived
            </p>
          </div>
          <span className="text-[11px] font-semibold text-amber-500">{archivedCount}</span>
        </button>
      )}

      {/* ── List / Empty state ── */}
      <main className="flex-1 overflow-y-auto scrollbar-hide pb-20 md:pb-0">
        {empty ? (
          <EmptyState onStart={() => navigate("/chat/explore")} />
        ) : visible.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className={`text-sm ${t("text-stone-500", "text-stone-400")}`}>
              No chats match your search.
            </p>
          </div>
        ) : (
          <div className={`divide-y ${t("divide-white/5", "divide-stone-100")}`}>
            {visible.map((conv) => (
              <ChatRow
                key={conv.id}
                conv={conv}
                active={activeChatId === conv.id}
                onClick={(c) => navigate(`/chat/${c.id}`)}
                onLongPress={(c) => setActionConv(c)}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── FAB (mobile only) ── */}
      <button
        onClick={() => navigate("/chat/explore")}
        className="fixed md:hidden bottom-20 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer z-20"
      >
        <MessageSquarePlus className="w-6 h-6" />
      </button>

      {/* ── Long-press conv menu ── */}
      <BottomSheet open={!!actionConv} onClose={() => setActionConv(null)} title={actionConv?.title}>
        {actionConv?.is_pinned ? (
          <SheetItem icon={Pin} label="Unpin chat" onClick={() => handleAction("unpin")} />
        ) : (
          <SheetItem icon={Pin} label="Pin chat" onClick={() => handleAction("pin")} />
        )}
        {actionConv?.is_muted ? (
          <SheetItem icon={Volume2} label="Unmute notifications" onClick={() => handleAction("unmute")} />
        ) : (
          <SheetItem icon={VolumeX} label="Mute notifications" onClick={() => handleAction("mute")} />
        )}
        {actionConv?.unread_count > 0 && (
          <SheetItem icon={CheckCheck} label="Mark as read" onClick={() => handleAction("read")} />
        )}
        <SheetItem icon={Archive} label="Archive chat" onClick={() => handleAction("archive")} />
        <SheetItem icon={Trash2} label="Delete chat" danger onClick={() => handleAction("delete")} />
      </BottomSheet>
    </div>
  );
};

const EmptyState = ({ onStart }) => {
  const { t } = useTheme();
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center mb-5">
        <MessageSquarePlus className="w-10 h-10 text-amber-500" />
      </div>
      <h2 className={`text-lg font-semibold ${t("text-stone-100", "text-stone-900")}`}>
        Welcome to NexTalk!
      </h2>
      <p className={`mt-1 text-sm max-w-xs ${t("text-stone-400", "text-stone-500")}`}>
        You don't have any chats yet. Tap below to find friends and start a conversation.
      </p>
      <button
        onClick={onStart}
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-amber-500/30 transition-all cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        Explore people
      </button>
    </div>
  );
};

export default ChatListPane;

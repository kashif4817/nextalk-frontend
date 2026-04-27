import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import Avatar from "../../components/chat/Avatar";
import BottomSheet, { SheetItem } from "../../components/chat/BottomSheet";
import { useLongPress } from "../../components/chat/useLongPress";
import ChatShell from "../../components/chat/ChatShell";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "groups", label: "Groups" },
  { id: "pinned", label: "Pinned" },
];

const ChatRow = ({ conv, onLongPress, onClick }) => {
  const { t } = useTheme();
  const lp = useLongPress(() => onLongPress(conv));

  // Resolve avatar from other user (DM) or group
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
      className={`w-full flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors text-left ${t(
        "hover:bg-white/5 active:bg-white/10",
        "hover:bg-stone-50 active:bg-stone-100"
      )}`}
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

const ChatList = () => {
  const { t } = useTheme();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState(CONVERSATIONS);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionConv, setActionConv] = useState(null);

  // Visible list (WhatsApp default: hide archived)
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
    // Sort: pinned first (pinned_at desc), rest by last_message_at desc
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
    <ChatShell active="chats">
    <div className={`min-h-screen ${t("bg-stone-950 text-stone-100", "bg-stone-50 text-stone-900")}`}>
      {/* ── Top Bar (chat list only) ── */}
      <header
        className={`sticky top-0 z-20 border-b backdrop-blur-xl ${t(
          "bg-stone-950/80 border-white/5",
          "bg-white/85 border-stone-200"
        )}`}
      >
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className={`text-xl font-bold ${t("text-stone-100", "text-stone-900")}`}>
            Chats
          </h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen((s) => !s)}
              className={`p-2 rounded-lg cursor-pointer ${t(
                "text-stone-400 hover:bg-white/5",
                "text-stone-500 hover:bg-stone-100"
              )}`}
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMenuOpen(true)}
              className={`p-2 rounded-lg cursor-pointer ${t(
                "text-stone-400 hover:bg-white/5",
                "text-stone-500 hover:bg-stone-100"
              )}`}
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search bar (collapsible) */}
        {searchOpen && (
          <div className="px-3 pb-3 animate-fade-in">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${t(
                "bg-white/5",
                "bg-stone-100"
              )}`}
            >
              <Search className={`w-4 h-4 ${t("text-stone-500", "text-stone-400")}`} />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chats..."
                className={`flex-1 bg-transparent outline-none text-sm ${t(
                  "text-stone-200 placeholder-stone-600",
                  "text-stone-700 placeholder-stone-400"
                )}`}
              />
              <button
                onClick={() => {
                  setSearch("");
                  setSearchOpen(false);
                }}
                className={t("text-stone-500", "text-stone-400")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

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

      {/* ── Archived banner ── */}
      {archivedCount > 0 && filter === "all" && !search && (
        <button
          onClick={() => navigate("/chat/archived")}
          className={`w-full flex items-center gap-3 px-4 py-3 border-b cursor-pointer ${t(
            "border-white/5 hover:bg-white/5",
            "border-stone-200 hover:bg-stone-50"
          )}`}
        >
          <Archive className={`w-5 h-5 ${t("text-stone-400", "text-stone-500")}`} />
          <span className="text-sm">Archived</span>
          <span className={`ml-auto text-xs ${t("text-stone-500", "text-stone-400")}`}>
            {archivedCount}
          </span>
        </button>
      )}

      {/* ── List / Empty state ── */}
      <main className="pb-24">
        {empty ? (
          <EmptyState onStart={() => navigate("/chat/new")} />
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
                onClick={(c) => navigate(`/chat/${c.id}`)}
                onLongPress={(c) => setActionConv(c)}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Floating Action Button ── */}
      <button
        onClick={() => navigate("/chat/new")}
        className="fixed bottom-20 md:bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer z-20"
      >
        <MessageSquarePlus className="w-6 h-6" />
      </button>

      {/* ── 3-dot menu ── */}
      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title="NexTalk">
        <SheetItem icon={UsersRound} label="New group" onClick={() => { setMenuOpen(false); navigate("/chat/new-group"); }} />
        <SheetItem icon={CircleUser} label="Contacts" onClick={() => { setMenuOpen(false); navigate("/chat/contacts"); }} />
        <SheetItem icon={Star} label="Starred messages" onClick={() => { setMenuOpen(false); navigate("/chat/starred"); }} />
        <SheetItem icon={Archive} label="Archived" onClick={() => { setMenuOpen(false); navigate("/chat/archived"); }} hint={archivedCount > 0 ? String(archivedCount) : null} />
        <SheetItem icon={ShieldOff} label="Blocked users" onClick={() => { setMenuOpen(false); navigate("/chat/blocked"); }} />
        <SheetItem icon={Bell} label="Notifications" onClick={() => { setMenuOpen(false); navigate("/chat/settings/notifications"); }} />
        <SheetItem icon={Settings} label="Settings" onClick={() => { setMenuOpen(false); navigate("/chat/settings"); }} />
      </BottomSheet>

      {/* ── Long-press conversation menu ── */}
      <BottomSheet
        open={!!actionConv}
        onClose={() => setActionConv(null)}
        title={actionConv?.title}
      >
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
    </ChatShell>
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
        You don't have any chats yet. Tap the button below to find friends and start a
        conversation.
      </p>
      <button
        onClick={onStart}
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-amber-500/30 transition-all cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        Start a new chat
      </button>
    </div>
  );
};

export default ChatList;

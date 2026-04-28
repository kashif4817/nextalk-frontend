import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Send,
  Search,
  Bell,
  Paperclip,
  Image as ImageIcon,
  Smile,
  Video,
  Phone,
  MoreVertical,
  Sun,
  Moon,
  Menu,
  X,
  Plus,
  Hash,
  ArrowLeft,
  Settings,
  Lock,
  Pin,
  Check,
  CheckCheck,
  MessageCircle,
  MessageSquarePlus,
  Users,
  User,
  UserPlus,
  ChevronRight,
  Bookmark,
  Shield,
  HelpCircle,
  Sparkles,
  Mail,
} from "lucide-react";
import NexTalkLogo from "../components/NexTalkLogo";

/* ─── Mock data ─── */

const channels = [
  { id: "general", name: "general", unread: 0, members: 12 },
  { id: "design-team", name: "design-team", unread: 3, members: 6 },
  { id: "engineering", name: "engineering", unread: 0, members: 18 },
  { id: "random", name: "random", unread: 7, members: 24 },
  { id: "announcements", name: "announcements", unread: 0, members: 32, locked: true },
];

const directMessages = [
  {
    id: "sarah",
    name: "Sarah Chen",
    initials: "SC",
    color: "from-emerald-400 to-teal-500",
    status: "online",
    lastMessage: "These look incredible! Love the hero section.",
    lastSeen: "10:26 AM",
    unread: 2,
  },
  {
    id: "alex",
    name: "Alex Rivera",
    initials: "AR",
    color: "from-blue-400 to-indigo-500",
    status: "online",
    lastMessage: "Hey team! The new landing page mockups are ready.",
    lastSeen: "10:24 AM",
    unread: 0,
  },
  {
    id: "priya",
    name: "Priya Sharma",
    initials: "PS",
    color: "from-purple-400 to-violet-500",
    status: "away",
    lastMessage: "Typing...",
    lastSeen: "9:48 AM",
    unread: 0,
  },
  {
    id: "marcus",
    name: "Marcus Lee",
    initials: "ML",
    color: "from-rose-400 to-pink-500",
    status: "offline",
    lastMessage: "Pushed the API fix — let me know if it works.",
    lastSeen: "Yesterday",
    unread: 0,
  },
  {
    id: "yuki",
    name: "Yuki Tanaka",
    initials: "YT",
    color: "from-amber-400 to-orange-400",
    status: "online",
    lastMessage: "Coffee break? ☕",
    lastSeen: "10:31 AM",
    unread: 1,
  },
];

const recommendedUsers = [
  {
    id: "emma",
    name: "Emma Thompson",
    username: "emmat",
    initials: "ET",
    color: "from-rose-400 to-pink-500",
    role: "Product Designer at Figma",
    mutuals: 3,
    status: "online",
  },
  {
    id: "david",
    name: "David Kim",
    username: "dkim",
    initials: "DK",
    color: "from-blue-400 to-cyan-500",
    role: "Senior Engineer at Stripe",
    mutuals: 5,
    status: "online",
  },
  {
    id: "olivia",
    name: "Olivia Park",
    username: "oliviap",
    initials: "OP",
    color: "from-emerald-400 to-green-500",
    role: "Product Manager at Linear",
    mutuals: 2,
    status: "away",
  },
  {
    id: "jamal",
    name: "Jamal Carter",
    username: "jamalc",
    initials: "JC",
    color: "from-amber-400 to-yellow-500",
    role: "Developer Advocate",
    mutuals: 1,
    status: "offline",
  },
  {
    id: "lin",
    name: "Lin Wei",
    username: "linwei",
    initials: "LW",
    color: "from-indigo-400 to-purple-500",
    role: "Researcher at Meta",
    mutuals: 4,
    status: "online",
  },
  {
    id: "sofia",
    name: "Sofia Russo",
    username: "sofiar",
    initials: "SR",
    color: "from-fuchsia-400 to-pink-500",
    role: "Writer at Vercel",
    mutuals: 2,
    status: "offline",
  },
  {
    id: "noah",
    name: "Noah Bennett",
    username: "noahb",
    initials: "NB",
    color: "from-teal-400 to-cyan-500",
    role: "Founder at Layer",
    mutuals: 1,
    status: "online",
  },
];

const initialMessagesByChat = {
  "design-team": [
    {
      id: 1,
      author: "Alex Rivera",
      initials: "AR",
      color: "from-blue-400 to-indigo-500",
      time: "10:24 AM",
      text: "Hey team! The new landing page mockups are ready for review.",
      attachment: { name: "landing-v3.fig", size: "2.4 MB" },
      reactions: [],
      mine: false,
    },
    {
      id: 2,
      author: "Sarah Chen",
      initials: "SC",
      color: "from-emerald-400 to-teal-500",
      time: "10:26 AM",
      text: "These look incredible! Love the hero section. Let's ship it 🚀",
      reactions: [{ emoji: "🔥", count: 3 }],
      mine: false,
    },
    {
      id: 3,
      author: "You",
      initials: "Y",
      color: "from-amber-400 to-orange-400",
      time: "10:28 AM",
      text: "Deploying to staging now. Should be live in 2 minutes!",
      reactions: [],
      mine: true,
      status: "read",
    },
    {
      id: 4,
      author: "Priya Sharma",
      initials: "PS",
      color: "from-purple-400 to-violet-500",
      time: "10:30 AM",
      text: "Quick note — the spacing on the CTA section needs a little more breathing room. I'll push a Figma update by EOD.",
      reactions: [{ emoji: "👍", count: 2 }],
      mine: false,
    },
  ],
  general: [
    {
      id: 1,
      author: "Yuki Tanaka",
      initials: "YT",
      color: "from-amber-400 to-orange-400",
      time: "9:02 AM",
      text: "Good morning everyone! ☀️",
      reactions: [{ emoji: "👋", count: 5 }],
      mine: false,
    },
    {
      id: 2,
      author: "You",
      initials: "Y",
      color: "from-amber-400 to-orange-400",
      time: "9:05 AM",
      text: "Morning! Standup in 25 mins.",
      reactions: [],
      mine: true,
      status: "read",
    },
  ],
  engineering: [
    {
      id: 1,
      author: "Marcus Lee",
      initials: "ML",
      color: "from-rose-400 to-pink-500",
      time: "8:45 AM",
      text: "API rate-limit fix is in main. Tag me on any regressions.",
      reactions: [{ emoji: "🎉", count: 4 }],
      mine: false,
    },
  ],
  random: [
    {
      id: 1,
      author: "Yuki Tanaka",
      initials: "YT",
      color: "from-amber-400 to-orange-400",
      time: "10:31 AM",
      text: "Anyone tried the new place on 3rd street? 🍜",
      reactions: [],
      mine: false,
    },
  ],
  announcements: [
    {
      id: 1,
      author: "Sarah Chen",
      initials: "SC",
      color: "from-emerald-400 to-teal-500",
      time: "8:00 AM",
      text: "📣 Town hall this Friday at 3pm. Calendar invites are out.",
      reactions: [{ emoji: "✅", count: 12 }],
      mine: false,
    },
  ],
  sarah: [
    {
      id: 1,
      author: "Sarah Chen",
      initials: "SC",
      color: "from-emerald-400 to-teal-500",
      time: "10:20 AM",
      text: "Got a sec to chat about the launch?",
      reactions: [],
      mine: false,
    },
    {
      id: 2,
      author: "You",
      initials: "Y",
      color: "from-amber-400 to-orange-400",
      time: "10:22 AM",
      text: "Yep — give me 5 mins to wrap something up.",
      reactions: [],
      mine: true,
      status: "read",
    },
  ],
  alex: [
    {
      id: 1,
      author: "Alex Rivera",
      initials: "AR",
      color: "from-blue-400 to-indigo-500",
      time: "10:24 AM",
      text: "Sent over the mockups in #design-team 👀",
      reactions: [],
      mine: false,
    },
  ],
  priya: [
    {
      id: 1,
      author: "Priya Sharma",
      initials: "PS",
      color: "from-purple-400 to-violet-500",
      time: "9:48 AM",
      text: "Reviewing your component library now.",
      reactions: [],
      mine: false,
    },
  ],
  marcus: [
    {
      id: 1,
      author: "Marcus Lee",
      initials: "ML",
      color: "from-rose-400 to-pink-500",
      time: "Yesterday",
      text: "Pushed the API fix — let me know if it works.",
      reactions: [],
      mine: false,
    },
  ],
  yuki: [
    {
      id: 1,
      author: "Yuki Tanaka",
      initials: "YT",
      color: "from-amber-400 to-orange-400",
      time: "10:31 AM",
      text: "Coffee break? ☕",
      reactions: [],
      mine: false,
    },
  ],
};

/* ─── Component ─── */

const Chat = () => {
  const [dark, setDark] = useState(true);
  const [activeId, setActiveId] = useState("design-team");
  const [activeKind, setActiveKind] = useState("channel"); // "channel" | "dm"
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState("chats"); // chats | groups | profile
  const [searchQuery, setSearchQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [messagesByChat, setMessagesByChat] = useState(initialMessagesByChat);
  const [dmList, setDmList] = useState(directMessages);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newChatQuery, setNewChatQuery] = useState("");

  const handleMobileTab = (tab) => {
    if (sidebarOpen && mobileTab === tab) {
      setSidebarOpen(false);
      return;
    }
    setMobileTab(tab);
    setSidebarOpen(true);
    setSearchQuery("");
  };

  const startChatWith = (user) => {
    setDmList((prev) => {
      if (prev.some((d) => d.id === user.id)) return prev;
      return [
        {
          id: user.id,
          name: user.name,
          initials: user.initials,
          color: user.color,
          status: user.status,
          lastMessage: "Say hi 👋",
          lastSeen: "now",
          unread: 0,
        },
        ...prev,
      ];
    });
    setMessagesByChat((prev) =>
      prev[user.id] ? prev : { ...prev, [user.id]: [] }
    );
    setActiveId(user.id);
    setActiveKind("dm");
    setNewChatOpen(false);
    setNewChatQuery("");
    setSidebarOpen(false);
  };

  const filteredRecommended = useMemo(() => {
    const q = newChatQuery.trim().toLowerCase();
    if (!q) return recommendedUsers;
    return recommendedUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [newChatQuery]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const t = (darkVal, lightVal) => (dark ? darkVal : lightVal);

  const activeMessages = messagesByChat[activeId] || [];
  const activeChannel = channels.find((c) => c.id === activeId);
  const activeDm = dmList.find((d) => d.id === activeId);

  const filteredChannels = useMemo(
    () =>
      channels.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery]
  );
  const filteredDms = useMemo(
    () =>
      dmList.filter((d) =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery, dmList]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, messagesByChat]);

  const openChat = (id, kind) => {
    setActiveId(id);
    setActiveKind(kind);
    setSidebarOpen(false);
  };

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const newMessage = {
      id: Date.now(),
      author: "You",
      initials: "Y",
      color: "from-amber-400 to-orange-400",
      time,
      text,
      reactions: [],
      mine: true,
      status: "sent",
    };
    setMessagesByChat((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), newMessage],
    }));
    setDraft("");
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const headerTitle =
    activeKind === "channel" ? activeChannel?.name : activeDm?.name;
  const headerSubtitle =
    activeKind === "channel"
      ? `${activeChannel?.members ?? 0} members`
      : activeDm?.status === "online"
        ? "Active now"
        : activeDm?.status === "away"
          ? "Away"
          : `Last seen ${activeDm?.lastSeen}`;

  return (
    <div
      className={`h-screen flex flex-col theme-transition ${t(
        "bg-stone-950 text-white",
        "bg-stone-50 text-stone-900"
      )}`}
    >
      {/* ─── Top bar ─── */}
      <header
        className={`shrink-0 border-b ${t(
          "border-white/5 bg-stone-950/80 backdrop-blur-xl",
          "border-stone-200 bg-white/80 backdrop-blur-xl"
        )}`}
      >
        <div className="flex items-center justify-between px-3 sm:px-5 h-14">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className={`md:hidden p-2 rounded-lg cursor-pointer ${t(
                "text-stone-400 hover:bg-white/5",
                "text-stone-500 hover:bg-stone-100"
              )}`}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <NexTalkLogo className="w-9 h-9" />
              <span className={`text-base font-bold ${t("text-white", "text-stone-900")}`}>
                Nex<span className="text-amber-500">Talk</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setDark(!dark)}
              className={`p-2 rounded-lg cursor-pointer transition-colors ${t(
                "text-stone-400 hover:text-amber-400 hover:bg-white/5",
                "text-stone-500 hover:text-amber-600 hover:bg-stone-100"
              )}`}
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
            <button
              className={`p-2 rounded-lg cursor-pointer transition-colors relative ${t(
                "text-stone-400 hover:bg-white/5",
                "text-stone-500 hover:bg-stone-100"
              )}`}
            >
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
            </button>
            <button
              className={`hidden sm:inline-flex p-2 rounded-lg cursor-pointer transition-colors ${t(
                "text-stone-400 hover:bg-white/5",
                "text-stone-500 hover:bg-stone-100"
              )}`}
            >
              <Settings className="w-4.5 h-4.5" />
            </button>
            <div className={`hidden sm:block w-px h-6 mx-1 ${t("bg-white/10", "bg-stone-200")}`} />
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">Y</span>
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 bg-green-400 ${t("border-stone-950", "border-white")}`} />
              </div>
              <span className={`hidden sm:inline text-sm font-medium ${t("text-stone-200", "text-stone-700")}`}>You</span>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Body ─── */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Sidebar (drawer on mobile) */}
        {sidebarOpen && (
          <div
            className="md:hidden absolute inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`absolute md:relative inset-y-0 left-0 z-50 md:z-auto w-72 md:w-72 lg:w-80 shrink-0 flex flex-col border-r transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          } ${t(
            "bg-stone-900/80 backdrop-blur-xl border-white/5",
            "bg-stone-50/90 backdrop-blur-xl border-stone-200"
          )}`}
        >
          {/* Mobile header */}
          <div className={`md:hidden flex items-center justify-between px-4 py-3 border-b ${t("border-white/5", "border-stone-200")}`}>
            <span className={`text-sm font-semibold ${t("text-white", "text-stone-900")}`}>
              {mobileTab === "chats" ? "Chats" : mobileTab === "groups" ? "Groups" : "Profile"}
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className={`p-1.5 rounded-lg cursor-pointer ${t("text-stone-400 hover:bg-white/5", "text-stone-500 hover:bg-stone-100")}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search (hidden on profile tab on mobile; always shown on desktop) */}
          <div
            className={`px-3 py-3 border-b ${t("border-white/5", "border-stone-200")} ${
              mobileTab === "profile" ? "hidden md:block" : "block"
            }`}
          >
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${t("bg-white/5", "bg-stone-100")}`}>
              <Search className={`w-4 h-4 ${t("text-stone-500", "text-stone-400")}`} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  mobileTab === "groups" ? "Search groups..." : "Search conversations..."
                }
                className={`flex-1 bg-transparent outline-none text-sm ${t(
                  "text-stone-200 placeholder-stone-600",
                  "text-stone-700 placeholder-stone-400"
                )}`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className={`${t("text-stone-500 hover:text-stone-300", "text-stone-400 hover:text-stone-600")}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Lists */}
          <div className="flex-1 overflow-y-auto p-2 space-y-4 sidebar-scroll">
            {/* Channels */}
            <div className={`${mobileTab === "groups" ? "block" : "hidden"} md:block`}>
              <div className="flex items-center justify-between px-3 py-2">
                <p className={`text-[10px] font-semibold uppercase tracking-wider ${t("text-stone-500", "text-stone-400")}`}>
                  Channels
                </p>
                <button
                  className={`p-1 rounded-md cursor-pointer ${t("text-stone-500 hover:text-amber-400 hover:bg-white/5", "text-stone-400 hover:text-amber-600 hover:bg-stone-100")}`}
                  title="New channel"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-0.5">
                {filteredChannels.length === 0 && (
                  <p className={`px-3 py-2 text-xs ${t("text-stone-600", "text-stone-400")}`}>No channels match.</p>
                )}
                {filteredChannels.map((ch) => {
                  const isActive = activeKind === "channel" && activeId === ch.id;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => openChat(ch.id, "channel")}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                        isActive
                          ? t("bg-amber-500/15 text-amber-400", "bg-amber-50 text-amber-600")
                          : t("text-stone-400 hover:bg-white/5 hover:text-stone-200", "text-stone-600 hover:bg-stone-100 hover:text-stone-900")
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        {ch.locked ? (
                          <Lock className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <Hash className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span className="truncate">{ch.name}</span>
                      </span>
                      {ch.unread > 0 && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                          isActive
                            ? t("bg-amber-500/30 text-amber-200", "bg-amber-500 text-white")
                            : t("bg-amber-500 text-stone-900", "bg-amber-500 text-white")
                        }`}>
                          {ch.unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Direct Messages */}
            <div className={`${mobileTab === "chats" ? "block" : "hidden"} md:block`}>
              <div className="flex items-center justify-between px-3 py-2">
                <p className={`text-[10px] font-semibold uppercase tracking-wider ${t("text-stone-500", "text-stone-400")}`}>
                  Direct Messages
                </p>
                <button
                  className={`p-1 rounded-md cursor-pointer ${t("text-stone-500 hover:text-amber-400 hover:bg-white/5", "text-stone-400 hover:text-amber-600 hover:bg-stone-100")}`}
                  title="New message"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-0.5">
                {filteredDms.length === 0 && (
                  <p className={`px-3 py-2 text-xs ${t("text-stone-600", "text-stone-400")}`}>No people match.</p>
                )}
                {filteredDms.map((dm) => {
                  const isActive = activeKind === "dm" && activeId === dm.id;
                  return (
                    <button
                      key={dm.id}
                      onClick={() => openChat(dm.id, "dm")}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left cursor-pointer transition-colors ${
                        isActive
                          ? t("bg-amber-500/15 text-amber-400", "bg-amber-50 text-amber-600")
                          : t("text-stone-400 hover:bg-white/5 hover:text-stone-200", "text-stone-600 hover:bg-stone-100 hover:text-stone-900")
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${dm.color} flex items-center justify-center`}>
                          <span className="text-white text-[10px] font-bold">{dm.initials}</span>
                        </div>
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${t("border-stone-900", "border-white")} ${
                            dm.status === "online"
                              ? "bg-green-400"
                              : dm.status === "away"
                                ? "bg-amber-400"
                                : "bg-stone-500"
                          }`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`truncate text-sm font-medium ${
                            isActive ? "" : t("text-stone-200", "text-stone-800")
                          }`}>
                            {dm.name}
                          </span>
                          <span className={`text-[10px] shrink-0 ${t("text-stone-600", "text-stone-400")}`}>
                            {dm.lastSeen}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className={`truncate text-xs ${t("text-stone-500", "text-stone-500")}`}>
                            {dm.lastMessage}
                          </p>
                          {dm.unread > 0 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-stone-900 shrink-0">
                              {dm.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Profile / Me (mobile only) */}
            <div className={`md:hidden ${mobileTab === "profile" ? "block" : "hidden"}`}>
              <div className={`mx-1 mt-1 mb-3 p-4 rounded-2xl border ${t(
                "bg-gradient-to-br from-amber-500/10 to-amber-500/[0.02] border-white/5",
                "bg-gradient-to-br from-amber-50 to-white border-stone-200"
              )}`}>
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center">
                      <span className="text-white text-lg font-bold">Y</span>
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-400 border-2 ${t("border-stone-900", "border-white")}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-base font-semibold truncate ${t("text-white", "text-stone-900")}`}>You</p>
                    <p className={`text-xs truncate ${t("text-stone-400", "text-stone-500")}`}>Active now · @you</p>
                  </div>
                  <button
                    className={`p-2 rounded-lg cursor-pointer ${t("text-stone-400 hover:bg-white/5", "text-stone-500 hover:bg-stone-100")}`}
                    title="Edit profile"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-0.5">
                {[
                  { icon: Bell, label: "Notifications", hint: "On" },
                  { icon: Shield, label: "Privacy & security", hint: "" },
                  { icon: Bookmark, label: "Saved messages", hint: "" },
                  {
                    icon: dark ? Sun : Moon,
                    label: "Theme",
                    hint: dark ? "Dark" : "Light",
                    onClick: () => setDark(!dark),
                  },
                  { icon: Settings, label: "Settings", hint: "" },
                  { icon: HelpCircle, label: "Help & feedback", hint: "" },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={item.onClick}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors ${t(
                      "hover:bg-white/5",
                      "hover:bg-stone-100"
                    )}`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${t("bg-white/5", "bg-stone-100")}`}>
                      <item.icon className={`w-4 h-4 ${t("text-stone-300", "text-stone-600")}`} />
                    </div>
                    <span className={`flex-1 text-left text-sm font-medium ${t("text-stone-200", "text-stone-700")}`}>
                      {item.label}
                    </span>
                    {item.hint && (
                      <span className={`text-xs ${t("text-stone-500", "text-stone-400")}`}>
                        {item.hint}
                      </span>
                    )}
                    <ChevronRight className={`w-4 h-4 shrink-0 ${t("text-stone-500", "text-stone-400")}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main chat area */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
          <div
            className={`shrink-0 flex items-center justify-between px-3 sm:px-5 h-14 border-b ${t(
              "border-white/5 bg-stone-900/40",
              "border-stone-200 bg-white/60"
            )}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className={`md:hidden p-1.5 rounded-lg cursor-pointer ${t("text-stone-400 hover:bg-white/5", "text-stone-500 hover:bg-stone-100")}`}
                aria-label="Back to conversations"
              >
                <ArrowLeft className="w-4.5 h-4.5" />
              </button>

              {activeKind === "channel" ? (
                <Hash className={`w-4 h-4 shrink-0 ${t("text-stone-500", "text-stone-400")}`} />
              ) : (
                <div className="relative shrink-0">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${activeDm?.color} flex items-center justify-center`}>
                    <span className="text-white text-[10px] font-bold">{activeDm?.initials}</span>
                  </div>
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${t("border-stone-900", "border-white")} ${
                      activeDm?.status === "online"
                        ? "bg-green-400"
                        : activeDm?.status === "away"
                          ? "bg-amber-400"
                          : "bg-stone-500"
                    }`}
                  />
                </div>
              )}

              <div className="min-w-0">
                <h2 className={`text-sm sm:text-base font-semibold truncate ${t("text-white", "text-stone-900")}`}>
                  {headerTitle}
                </h2>
                <p className={`text-[11px] truncate ${t("text-stone-500", "text-stone-400")}`}>
                  {headerSubtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                className={`p-2 rounded-lg cursor-pointer transition-colors ${t("text-stone-400 hover:bg-white/5 hover:text-stone-200", "text-stone-500 hover:bg-stone-100 hover:text-stone-700")}`}
                title="Voice call"
              >
                <Phone className="w-4.5 h-4.5" />
              </button>
              <button
                className={`p-2 rounded-lg cursor-pointer transition-colors ${t("text-stone-400 hover:bg-white/5 hover:text-stone-200", "text-stone-500 hover:bg-stone-100 hover:text-stone-700")}`}
                title="Video call"
              >
                <Video className="w-4.5 h-4.5" />
              </button>
              <button
                className={`hidden sm:inline-flex p-2 rounded-lg cursor-pointer transition-colors ${t("text-stone-400 hover:bg-white/5 hover:text-stone-200", "text-stone-500 hover:bg-stone-100 hover:text-stone-700")}`}
                title="Pinned"
              >
                <Pin className="w-4.5 h-4.5" />
              </button>
              <button
                className={`p-2 rounded-lg cursor-pointer transition-colors ${t("text-stone-400 hover:bg-white/5 hover:text-stone-200", "text-stone-500 hover:bg-stone-100 hover:text-stone-700")}`}
                title="More"
              >
                <MoreVertical className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 chat-scroll">
            {activeMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${t("bg-amber-500/10", "bg-amber-50")}`}>
                  <Send className={`w-6 h-6 ${t("text-amber-400", "text-amber-600")}`} />
                </div>
                <h3 className={`text-base font-semibold ${t("text-white", "text-stone-900")}`}>
                  No messages yet
                </h3>
                <p className={`mt-1 text-sm ${t("text-stone-500", "text-stone-500")}`}>
                  Send a message to start the conversation.
                </p>
              </div>
            ) : (
              <div className="space-y-5 max-w-4xl mx-auto">
                {/* Date divider */}
                <div className="flex items-center gap-3">
                  <div className={`flex-1 h-px ${t("bg-white/5", "bg-stone-200")}`} />
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${t("text-stone-500", "text-stone-400")}`}>
                    Today
                  </span>
                  <div className={`flex-1 h-px ${t("bg-white/5", "bg-stone-200")}`} />
                </div>

                {activeMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex items-start gap-3 ${m.mine ? "flex-row-reverse" : ""}`}
                  >
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${m.color} flex items-center justify-center shrink-0`}>
                      <span className="text-white text-[11px] font-bold">{m.initials}</span>
                    </div>

                    <div className={`max-w-[75%] sm:max-w-[65%] ${m.mine ? "items-end text-right" : ""} flex flex-col`}>
                      <div className={`flex items-baseline gap-2 ${m.mine ? "flex-row-reverse" : ""}`}>
                        <span className={`text-sm font-semibold ${
                          m.mine ? "text-amber-400" : t("text-white", "text-stone-900")
                        }`}>
                          {m.author}
                        </span>
                        <span className={`text-[10px] ${t("text-stone-500", "text-stone-400")}`}>
                          {m.time}
                        </span>
                      </div>

                      <div
                        className={`mt-1 inline-block px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                          m.mine
                            ? "bg-gradient-to-br from-amber-400 to-amber-500 text-stone-900 rounded-tr-sm"
                            : t(
                                "bg-stone-800/70 text-stone-200 rounded-tl-sm border border-white/5",
                                "bg-white text-stone-700 rounded-tl-sm border border-stone-200"
                              )
                        }`}
                      >
                        {m.text}
                      </div>

                      {m.attachment && (
                        <div
                          className={`mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-lg border max-w-xs ${t(
                            "bg-white/5 border-white/5",
                            "bg-stone-50 border-stone-200"
                          )}`}
                        >
                          <ImageIcon className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className={`text-xs truncate ${t("text-stone-300", "text-stone-600")}`}>
                            {m.attachment.name}
                          </span>
                          <span className={`text-[10px] ml-auto shrink-0 ${t("text-stone-500", "text-stone-400")}`}>
                            {m.attachment.size}
                          </span>
                        </div>
                      )}

                      <div className={`mt-1 flex items-center gap-1.5 ${m.mine ? "justify-end" : ""}`}>
                        {m.reactions?.map((r, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs cursor-pointer ${t(
                              "bg-white/5 hover:bg-white/10 text-stone-300",
                              "bg-stone-100 hover:bg-stone-200 text-stone-600"
                            )}`}
                          >
                            <span>{r.emoji}</span>
                            <span className="text-[10px] font-semibold">{r.count}</span>
                          </span>
                        ))}
                        {m.mine && m.status && (
                          <span className={`inline-flex items-center text-[10px] ${t("text-stone-500", "text-stone-400")}`}>
                            {m.status === "read" ? (
                              <CheckCheck className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing indicator (only shows for design-team mock) */}
                {activeId === "design-team" && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center shrink-0">
                      <span className="text-white text-[11px] font-bold">PS</span>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl rounded-tl-sm ${t("bg-stone-800/70 border border-white/5", "bg-white border border-stone-200")}`}>
                      <div className="flex gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:0ms] ${t("bg-stone-500", "bg-stone-400")}`} />
                        <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:150ms] ${t("bg-stone-500", "bg-stone-400")}`} />
                        <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:300ms] ${t("bg-stone-500", "bg-stone-400")}`} />
                      </div>
                      <span className={`text-[11px] ${t("text-stone-500", "text-stone-400")}`}>
                        Priya is typing...
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Composer */}
          <div className={`shrink-0 px-3 sm:px-6 pb-4 pt-3 border-t ${t("border-white/5", "border-stone-200")}`}>
            <div
              className={`max-w-4xl mx-auto flex items-end gap-2 px-3 py-2 rounded-2xl border transition-colors focus-within:ring-2 ${t(
                "bg-stone-900/60 border-white/5 focus-within:ring-amber-500/30",
                "bg-white border-stone-200 focus-within:ring-amber-400/30"
              )}`}
            >
              <button
                className={`p-2 rounded-lg cursor-pointer ${t("text-stone-400 hover:bg-white/5 hover:text-stone-200", "text-stone-500 hover:bg-stone-100 hover:text-stone-700")}`}
                title="Attach file"
              >
                <Paperclip className="w-4.5 h-4.5" />
              </button>
              <textarea
                ref={inputRef}
                rows={1}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKey}
                placeholder={`Message ${activeKind === "channel" ? `#${activeChannel?.name ?? ""}` : activeDm?.name ?? ""}...`}
                className={`flex-1 bg-transparent resize-none outline-none text-sm py-2 max-h-32 ${t(
                  "text-stone-100 placeholder-stone-500",
                  "text-stone-800 placeholder-stone-400"
                )}`}
              />
              <button
                className={`p-2 rounded-lg cursor-pointer ${t("text-stone-400 hover:bg-white/5 hover:text-stone-200", "text-stone-500 hover:bg-stone-100 hover:text-stone-700")}`}
                title="Image"
              >
                <ImageIcon className="w-4.5 h-4.5" />
              </button>
              <button
                className={`p-2 rounded-lg cursor-pointer ${t("text-stone-400 hover:bg-white/5 hover:text-stone-200", "text-stone-500 hover:bg-stone-100 hover:text-stone-700")}`}
                title="Emoji"
              >
                <Smile className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={sendMessage}
                disabled={!draft.trim()}
                className={`p-2.5 rounded-xl transition-all duration-200 ${
                  draft.trim()
                    ? "bg-gradient-to-r from-amber-400 to-amber-500 text-stone-900 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/20 cursor-pointer"
                    : t(
                        "bg-white/5 text-stone-600 cursor-not-allowed",
                        "bg-stone-100 text-stone-400 cursor-not-allowed"
                      )
                }`}
                aria-label="Send message"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </div>
            <p className={`max-w-4xl mx-auto mt-2 text-[10px] text-center ${t("text-stone-600", "text-stone-400")}`}>
              <Lock className="inline w-3 h-3 mr-1 -mt-0.5" />
              End-to-end encrypted. Press Enter to send, Shift+Enter for newline.
            </p>
          </div>
        </main>
      </div>

      {/* ─── Floating Action Button (new chat) ─── */}
      {!newChatOpen && (
        <button
          onClick={() => setNewChatOpen(true)}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 group"
          aria-label="New chat"
          title="New chat"
        >
          <span className="absolute inset-0 rounded-full bg-amber-400/40 blur-xl opacity-70 group-hover:opacity-100 transition-opacity" />
          <span className="absolute inset-0 rounded-full bg-amber-400/30 animate-ping" />
          <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-stone-900 shadow-2xl shadow-amber-500/40 hover:shadow-amber-500/60 hover:from-amber-300 hover:to-amber-400 transition-all duration-300 group-hover:scale-110 group-active:scale-95 cursor-pointer">
            <MessageSquarePlus className="w-6 h-6" strokeWidth={2.2} />
          </span>
        </button>
      )}

      {/* ─── New Chat Modal ─── */}
      {newChatOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
            onClick={() => {
              setNewChatOpen(false);
              setNewChatQuery("");
            }}
          />
          <div
            className={`fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-full sm:w-[460px] sm:max-w-[92vw] max-h-[85vh] sm:max-h-[80vh] flex flex-col rounded-t-3xl sm:rounded-2xl border shadow-2xl animate-fade-in-up ${t(
              "bg-stone-900 border-white/10 shadow-black/60",
              "bg-white border-stone-200 shadow-stone-400/30"
            )}`}
          >
            {/* Drag handle (mobile) */}
            <div className="sm:hidden flex justify-center pt-2 pb-1">
              <div className={`w-10 h-1 rounded-full ${t("bg-stone-700", "bg-stone-300")}`} />
            </div>

            {/* Header */}
            <div className={`flex items-center justify-between px-5 pt-3 pb-4 border-b ${t("border-white/5", "border-stone-200")}`}>
              <div>
                <h2 className={`text-base font-semibold ${t("text-white", "text-stone-900")}`}>
                  New chat
                </h2>
                <p className={`text-xs mt-0.5 ${t("text-stone-500", "text-stone-500")}`}>
                  Find someone on NexTalk and say hi.
                </p>
              </div>
              <button
                onClick={() => {
                  setNewChatOpen(false);
                  setNewChatQuery("");
                }}
                className={`p-2 rounded-lg cursor-pointer transition-colors ${t(
                  "text-stone-400 hover:bg-white/5 hover:text-white",
                  "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                )}`}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 pt-4 pb-3">
              <div
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border transition-colors focus-within:ring-2 ${t(
                  "bg-stone-800/60 border-white/5 focus-within:ring-amber-500/30 focus-within:border-amber-500/30",
                  "bg-stone-50 border-stone-200 focus-within:ring-amber-400/30 focus-within:border-amber-400"
                )}`}
              >
                <Search className={`w-4 h-4 ${t("text-stone-500", "text-stone-400")}`} />
                <input
                  autoFocus
                  value={newChatQuery}
                  onChange={(e) => setNewChatQuery(e.target.value)}
                  placeholder="Search by name or @username"
                  className={`flex-1 bg-transparent outline-none text-sm ${t(
                    "text-stone-100 placeholder-stone-500",
                    "text-stone-800 placeholder-stone-400"
                  )}`}
                />
                {newChatQuery && (
                  <button
                    onClick={() => setNewChatQuery("")}
                    className={`${t("text-stone-500 hover:text-stone-300", "text-stone-400 hover:text-stone-600")}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 chat-scroll">
              {/* Quick actions (only when not searching) */}
              {!newChatQuery && (
                <div className="space-y-1 mb-2">
                  <button
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors ${t(
                      "hover:bg-white/5",
                      "hover:bg-stone-100"
                    )}`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <Users className="w-4.5 h-4.5 text-amber-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`text-sm font-medium ${t("text-stone-100", "text-stone-800")}`}>
                        New group
                      </p>
                      <p className={`text-xs ${t("text-stone-500", "text-stone-500")}`}>
                        Create a channel for your team
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${t("text-stone-500", "text-stone-400")}`} />
                  </button>
                  <button
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors ${t(
                      "hover:bg-white/5",
                      "hover:bg-stone-100"
                    )}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t("bg-white/5", "bg-stone-100")}`}>
                      <Mail className={`w-4.5 h-4.5 ${t("text-stone-300", "text-stone-600")}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`text-sm font-medium ${t("text-stone-100", "text-stone-800")}`}>
                        Invite via email
                      </p>
                      <p className={`text-xs ${t("text-stone-500", "text-stone-500")}`}>
                        Bring someone new to NexTalk
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${t("text-stone-500", "text-stone-400")}`} />
                  </button>
                </div>
              )}

              {/* Section header */}
              <div className="flex items-center gap-2 px-3 pt-2 pb-2">
                <Sparkles className={`w-3.5 h-3.5 ${t("text-amber-400", "text-amber-500")}`} />
                <p className={`text-[10px] font-semibold uppercase tracking-wider ${t("text-stone-400", "text-stone-500")}`}>
                  {newChatQuery ? `Results (${filteredRecommended.length})` : "Recommended"}
                </p>
              </div>

              {/* User list */}
              {filteredRecommended.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-12">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${t("bg-white/5", "bg-stone-100")}`}>
                    <Search className={`w-5 h-5 ${t("text-stone-500", "text-stone-400")}`} />
                  </div>
                  <p className={`text-sm font-medium ${t("text-stone-200", "text-stone-700")}`}>
                    No users found
                  </p>
                  <p className={`text-xs mt-1 ${t("text-stone-500", "text-stone-500")}`}>
                    Try a different name or @username.
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filteredRecommended.map((u) => {
                    const alreadyChatting = dmList.some((d) => d.id === u.id);
                    return (
                      <button
                        key={u.id}
                        onClick={() => startChatWith(u)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors text-left ${t(
                          "hover:bg-white/5",
                          "hover:bg-stone-100"
                        )}`}
                      >
                        <div className="relative shrink-0">
                          <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${u.color} flex items-center justify-center`}>
                            <span className="text-white text-xs font-bold">{u.initials}</span>
                          </div>
                          <div
                            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${t("border-stone-900", "border-white")} ${
                              u.status === "online"
                                ? "bg-green-400"
                                : u.status === "away"
                                  ? "bg-amber-400"
                                  : "bg-stone-500"
                            }`}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-semibold truncate ${t("text-stone-100", "text-stone-800")}`}>
                              {u.name}
                            </p>
                            <span className={`text-[10px] truncate ${t("text-stone-500", "text-stone-500")}`}>
                              @{u.username}
                            </span>
                          </div>
                          <p className={`text-xs truncate ${t("text-stone-400", "text-stone-500")}`}>
                            {u.role}
                          </p>
                          {u.mutuals > 0 && (
                            <p className={`text-[10px] mt-0.5 ${t("text-stone-500", "text-stone-400")}`}>
                              {u.mutuals} mutual {u.mutuals === 1 ? "connection" : "connections"}
                            </p>
                          )}
                        </div>
                        <span
                          className={`shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                            alreadyChatting
                              ? t("bg-white/5 text-stone-400", "bg-stone-100 text-stone-500")
                              : "bg-gradient-to-r from-amber-400 to-amber-500 text-stone-900 group-hover:from-amber-300 group-hover:to-amber-400"
                          }`}
                        >
                          {alreadyChatting ? (
                            <>
                              <MessageCircle className="w-3.5 h-3.5" />
                              Open
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5" />
                              Chat
                            </>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ─── Mobile bottom nav ─── */}
      <nav
        className={`md:hidden shrink-0 border-t backdrop-blur-2xl ${t(
          "border-white/5 bg-stone-950/90",
          "border-stone-200 bg-white/90"
        )}`}
      >
        <div className="grid grid-cols-3">
          {[
            { id: "chats", label: "Chats", icon: MessageCircle, badge: dmList.reduce((n, d) => n + d.unread, 0) },
            { id: "groups", label: "Groups", icon: Users, badge: channels.reduce((n, c) => n + c.unread, 0) },
            { id: "profile", label: "Me", icon: User, badge: 0 },
          ].map((tab) => {
            const isActive = sidebarOpen && mobileTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleMobileTab(tab.id)}
                className="relative flex flex-col items-center justify-center gap-0.5 py-2 cursor-pointer group"
              >
                {/* Active indicator pill */}
                <span
                  className={`absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-b-full transition-all duration-300 ${
                    isActive ? "w-8 bg-amber-400" : "w-0 bg-transparent"
                  }`}
                />

                <div
                  className={`relative flex items-center justify-center w-10 h-9 rounded-xl transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-br from-amber-400/20 to-amber-500/10 scale-105"
                      : "scale-100"
                  }`}
                >
                  <tab.icon
                    className={`w-[18px] h-[18px] transition-colors ${
                      isActive
                        ? "text-amber-400"
                        : t("text-stone-400 group-hover:text-stone-200", "text-stone-500 group-hover:text-stone-700")
                    }`}
                    strokeWidth={isActive ? 2.4 : 2}
                  />
                  {tab.badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-amber-500 text-stone-900 text-[9px] font-bold flex items-center justify-center border-2 border-transparent">
                      {tab.badge > 9 ? "9+" : tab.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[10px] font-medium transition-colors ${
                    isActive
                      ? "text-amber-400"
                      : t("text-stone-500 group-hover:text-stone-300", "text-stone-500 group-hover:text-stone-700")
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <style>{`
        .sidebar-scroll::-webkit-scrollbar,
        .chat-scroll::-webkit-scrollbar { width: 6px; }
        .sidebar-scroll::-webkit-scrollbar-track,
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb,
        .chat-scroll::-webkit-scrollbar-thumb {
          background: ${dark ? "rgba(217,119,6,0.25)" : "rgba(120,113,108,0.3)"};
          border-radius: 10px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover,
        .chat-scroll::-webkit-scrollbar-thumb:hover {
          background: ${dark ? "rgba(217,119,6,0.5)" : "rgba(120,113,108,0.5)"};
        }
        .sidebar-scroll, .chat-scroll {
          scrollbar-width: thin;
          scrollbar-color: ${dark ? "rgba(217,119,6,0.25)" : "rgba(120,113,108,0.3)"} transparent;
        }
      `}</style>
    </div>
  );
};

export default Chat;

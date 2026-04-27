import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, UsersRound, UserPlus, Sparkles, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { ALL_USERS, BLOCKED_USER_IDS } from "../../data/mockChatData";
import Avatar from "../../components/chat/Avatar";
import ChatTopBar from "../../components/chat/ChatTopBar";
import ChatShell from "../../components/chat/ChatShell";

const NewChat = () => {
  const { t } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  // Available users = not blocked, not me
  const usersList = useMemo(() => ALL_USERS.filter((u) => !BLOCKED_USER_IDS.includes(u.id)), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return usersList;
    return usersList.filter(
      (u) =>
        u.display_name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.about?.toLowerCase().includes(q)
    );
  }, [query, usersList]);

  const contacts = filtered.filter((u) => u.is_contact);
  const others = filtered.filter((u) => !u.is_contact);

  return (
    <ChatShell active="chats">
    <div className={`min-h-screen ${t("bg-stone-950 text-stone-100", "bg-stone-50 text-stone-900")}`}>
      <ChatTopBar title="New chat" subtitle={`${usersList.length} users on NexTalk`} />

      {/* Search */}
      <div className="px-4 py-3">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${t(
            "bg-white/5",
            "bg-stone-100"
          )}`}
        >
          <Search className={`w-4 h-4 ${t("text-stone-500", "text-stone-400")}`} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, username..."
            className={`flex-1 bg-transparent outline-none text-sm ${t(
              "text-stone-200 placeholder-stone-600",
              "text-stone-700 placeholder-stone-400"
            )}`}
          />
          {query && (
            <button onClick={() => setQuery("")} className={t("text-stone-500", "text-stone-400")}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Action shortcuts */}
      <div className="px-2 pb-2">
        <ActionRow
          icon={UsersRound}
          label="New group"
          subtitle="Start a chat with multiple people"
          onClick={() => navigate("/chat/new-group")}
        />
        <ActionRow
          icon={UserPlus}
          label="New contact"
          subtitle="Save someone to your contacts"
          onClick={() => navigate("/chat/contacts")}
        />
      </div>

      {/* Contacts on NexTalk */}
      {contacts.length > 0 && (
        <Section title="Contacts on NexTalk">
          {contacts.map((u) => (
            <UserRow key={u.id} user={u} onClick={() => navigate(`/chat/profile/${u.id}`)} />
          ))}
        </Section>
      )}

      {/* Discover users (everyone else) */}
      {others.length > 0 && (
        <Section
          title="Discover people on NexTalk"
          subtitle="Anyone on NexTalk can be messaged."
          icon={Sparkles}
        >
          {others.map((u) => (
            <UserRow key={u.id} user={u} onClick={() => navigate(`/chat/profile/${u.id}`)} />
          ))}
        </Section>
      )}

      {filtered.length === 0 && (
        <div className="px-6 py-16 text-center">
          <p className={`text-sm ${t("text-stone-500", "text-stone-400")}`}>
            No users match "{query}".
          </p>
        </div>
      )}
    </div>
    </ChatShell>
  );
};

const Section = ({ title, subtitle, icon: Icon, children }) => {
  const { t } = useTheme();
  return (
    <div className="mt-3">
      <div className="px-4 pb-2 flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5 text-amber-500" />}
        <p className={`text-[11px] font-semibold uppercase tracking-wider ${t("text-stone-400", "text-stone-500")}`}>
          {title}
        </p>
      </div>
      {subtitle && (
        <p className={`px-4 pb-2 text-xs ${t("text-stone-500", "text-stone-400")}`}>
          {subtitle}
        </p>
      )}
      <div>{children}</div>
    </div>
  );
};

const ActionRow = ({ icon: Icon, label, subtitle, onClick }) => {
  const { t } = useTheme();
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors ${t(
        "hover:bg-white/5",
        "hover:bg-stone-100"
      )}`}
    >
      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className={`text-sm font-semibold ${t("text-stone-100", "text-stone-900")}`}>
          {label}
        </p>
        <p className={`text-xs truncate ${t("text-stone-400", "text-stone-500")}`}>
          {subtitle}
        </p>
      </div>
    </button>
  );
};

const UserRow = ({ user, onClick }) => {
  const { t } = useTheme();
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${t(
        "hover:bg-white/5",
        "hover:bg-stone-100"
      )}`}
    >
      <Avatar initials={user.initials} color={user.color} size="md" status={user.status} />
      <div className="flex-1 text-left min-w-0">
        <p className={`text-sm font-semibold truncate ${t("text-stone-100", "text-stone-900")}`}>
          {user.display_name}
        </p>
        <p className={`text-xs truncate ${t("text-stone-400", "text-stone-500")}`}>
          {user.about || `@${user.username}`}
        </p>
      </div>
    </button>
  );
};

export default NewChat;

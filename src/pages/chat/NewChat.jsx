import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Search, UsersRound, UserPlus, Sparkles, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";
import { searchUsers } from "../../api/users/user";
import { getContacts } from "../../api/contacts/contact";
import { normalizeUser, normalizeContact } from "../../utils/formatters";
import Avatar from "../../components/chat/Avatar";
import ChatTopBar from "../../components/chat/ChatTopBar";
import ChatShell from "../../components/chat/ChatShell";

const NewChat = () => {
  const { t } = useTheme();
  const { user } = useUser();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts", user?.id],
    queryFn: async () => {
      const res = await getContacts();
      return (res.data.data || []).map(normalizeContact).filter(Boolean);
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!query.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(() => {
      searchUsers(query)
        .then(res => {
          const rows = res.data.data || [];
          setSearchResults(rows.map(normalizeUser).filter(Boolean));
        })
        .catch(console.error);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const contactIds = useMemo(() => new Set(contacts.map(c => c.id)), [contacts]);

  const displayedContacts = query.trim()
    ? searchResults.filter(u => contactIds.has(u.id))
    : contacts;

  const others = query.trim()
    ? searchResults.filter(u => !contactIds.has(u.id))
    : [];

  const noResults = query.trim() && searchResults.length === 0;

  return (
    <ChatShell active="chats">
    <div className={`min-h-screen ${t("bg-stone-950 text-stone-100", "bg-stone-50 text-stone-900")}`}>
      <ChatTopBar title="New chat" />

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

      {noResults ? (
        <div className="px-6 py-16 text-center">
          <p className={`text-sm ${t("text-stone-500", "text-stone-400")}`}>
            No users match "{query}".
          </p>
        </div>
      ) : (
        <>
          {displayedContacts.length > 0 && (
            <Section title="Contacts on NexTalk">
              {displayedContacts.map((u) => (
                <UserRow key={u.id} user={u} onClick={() => navigate(`/chat/profile/${u.id}`)} />
              ))}
            </Section>
          )}

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

          {!query.trim() && contacts.length === 0 && (
            <div className="px-6 py-16 text-center">
              <p className={`text-sm ${t("text-stone-500", "text-stone-400")}`}>
                No contacts yet. Search to discover people.
              </p>
            </div>
          )}
        </>
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
      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white shrink-0">
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
      <Avatar src={user.avatar_url} initials={user.initials} color={user.color} size="md" status={user.status} />
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

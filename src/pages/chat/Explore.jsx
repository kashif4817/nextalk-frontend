import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Sparkles, MessageSquare, UserPlus, TrendingUp } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { ALL_USERS, BLOCKED_USER_IDS } from "../../data/mockChatData";
import Avatar from "../../components/chat/Avatar";
import ChatTopBar from "../../components/chat/ChatTopBar";
import ChatShell from "../../components/chat/ChatShell";

const Explore = () => {
  const { t } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const allUsers = useMemo(
    () => ALL_USERS.filter((u) => !BLOCKED_USER_IDS.includes(u.id)),
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter(
      (u) =>
        u.display_name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.about?.toLowerCase().includes(q)
    );
  }, [query, allUsers]);

  const suggestions = filtered.filter((u) => !u.is_contact).slice(0, 8);
  const trending = filtered.filter((u) => u.status === "online").slice(0, 8);
  const others = filtered;

  return (
    <ChatShell active="explore" fullWidth>
      <div className={`min-h-screen ${t("text-stone-100", "text-stone-900")}`}>
        <ChatTopBar
          title="Explore"
          subtitle={`Discover ${allUsers.length} people on NexTalk`}
        />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          {/* Search bar */}
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full ${t(
              "bg-white/5",
              "bg-white border border-stone-200"
            )}`}
          >
            <Search className={`w-4 h-4 ${t("text-stone-500", "text-stone-400")}`} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people, usernames, bios..."
              className={`flex-1 bg-transparent outline-none text-sm ${t(
                "text-stone-200 placeholder-stone-600",
                "text-stone-700 placeholder-stone-400"
              )}`}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className={t("text-stone-500", "text-stone-400")}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <p className={`text-sm ${t("text-stone-500", "text-stone-400")}`}>
                No users match "{query}".
              </p>
            </div>
          ) : (
            <>
              {!query && suggestions.length > 0 && (
                <Section title="Suggested for you" icon={Sparkles}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {suggestions.map((u) => (
                      <SuggestCard
                        key={u.id}
                        user={u}
                        onClick={() => navigate(`/chat/profile/${u.id}`)}
                      />
                    ))}
                  </div>
                </Section>
              )}

              {!query && trending.length > 0 && (
                <Section title="Active now" icon={TrendingUp}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {trending.map((u) => (
                      <UserCard
                        key={u.id}
                        user={u}
                        onClick={() => navigate(`/chat/profile/${u.id}`)}
                      />
                    ))}
                  </div>
                </Section>
              )}

              <Section title={query ? "Results" : "All people"}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {others.map((u) => (
                    <UserCard
                      key={u.id}
                      user={u}
                      onClick={() => navigate(`/chat/profile/${u.id}`)}
                    />
                  ))}
                </div>
              </Section>
            </>
          )}
        </div>
      </div>
    </ChatShell>
  );
};

const Section = ({ title, icon: Icon, children }) => {
  const { t } = useTheme();
  return (
    <div className="mt-6">
      <div className="pb-3 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-amber-500" />}
        <p
          className={`text-xs font-semibold uppercase tracking-wider ${t(
            "text-stone-400",
            "text-stone-500"
          )}`}
        >
          {title}
        </p>
      </div>
      {children}
    </div>
  );
};

const SuggestCard = ({ user, onClick }) => {
  const { t } = useTheme();
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl p-3 flex flex-col items-center gap-2 cursor-pointer transition-all ${t(
        "bg-white/5 hover:bg-white/10 border border-white/5",
        "bg-white hover:bg-stone-50 border border-stone-200 hover:border-stone-300"
      )}`}
    >
      <Avatar initials={user.initials} color={user.color} size="lg" status={user.status} />
      <div className="text-center min-w-0 w-full">
        <p
          className={`text-xs font-semibold truncate ${t(
            "text-stone-100",
            "text-stone-900"
          )}`}
        >
          {user.display_name}
        </p>
        <p className={`text-[10px] truncate ${t("text-stone-400", "text-stone-500")}`}>
          @{user.username}
        </p>
      </div>
      <span className="w-full text-center px-2 py-1.5 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold transition-colors">
        Message
      </span>
    </button>
  );
};

const UserCard = ({ user, onClick }) => {
  const { t } = useTheme();
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${t(
        "bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/5",
        "bg-white hover:bg-stone-100 border border-stone-200"
      )}`}
    >
      <Avatar initials={user.initials} color={user.color} size="md" status={user.status} />
      <div className="flex-1 text-left min-w-0">
        <p
          className={`text-sm font-semibold truncate ${t(
            "text-stone-100",
            "text-stone-900"
          )}`}
        >
          {user.display_name}
        </p>
        <p className={`text-xs truncate ${t("text-stone-400", "text-stone-500")}`}>
          {user.about || `@${user.username}`}
        </p>
      </div>
      {user.is_contact ? (
        <MessageSquare className="w-4 h-4 text-amber-500 shrink-0" />
      ) : (
        <UserPlus
          className={`w-4 h-4 shrink-0 ${t("text-stone-500", "text-stone-400")}`}
        />
      )}
    </button>
  );
};

export default Explore;

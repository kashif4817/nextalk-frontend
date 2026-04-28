import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Search, X, Sparkles, MessageSquare, Users } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { searchUsers, getAllUsers } from "../../api/users/user";
import { normalizeUser } from "../../utils/formatters";
import Avatar from "../../components/chat/Avatar";
import ChatTopBar from "../../components/chat/ChatTopBar";
import ChatShell from "../../components/chat/ChatShell";

const Explore = () => {
  const { t } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce the search input so we don't fire a query on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: allUsers = [], isLoading: loading } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const res = await getAllUsers();
      return (res.data.data || []).map(normalizeUser).filter(Boolean);
    },
    staleTime: 2 * 60_000,
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ["search-users", debouncedQuery],
    queryFn: async () => {
      const res = await searchUsers(debouncedQuery);
      return (res.data.data || []).map(normalizeUser).filter(Boolean);
    },
    enabled: !!debouncedQuery.trim(),
  });

  // Random recommended — shuffled once when allUsers loads, stable for the session
  const recommended = useMemo(() => {
    if (allUsers.length === 0) return [];
    const shuffled = [...allUsers].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(6, shuffled.length));
  }, [allUsers]);

  const recommendedIds = useMemo(() => new Set(recommended.map((u) => u.id)), [recommended]);
  const remainingUsers = useMemo(() => allUsers.filter((u) => !recommendedIds.has(u.id)), [allUsers, recommendedIds]);

  const isSearching = debouncedQuery.trim().length > 0;

  return (
    <ChatShell active="explore" fullWidth>
      <div className={`min-h-screen ${t("text-stone-100", "text-stone-900")}`}>
        <ChatTopBar
          title="Explore"
          subtitle="Discover people on NexTalk"
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
              <button onClick={() => setQuery("")} className={t("text-stone-500", "text-stone-400")}>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <p className={`text-sm ${t("text-stone-500", "text-stone-400")}`}>Loading people…</p>
            </div>
          ) : isSearching ? (
            /* ── Search results ── */
            searchResults.length === 0 ? (
              <div className="py-20 text-center">
                <p className={`text-sm ${t("text-stone-500", "text-stone-400")}`}>
                  No users match "{query}".
                </p>
              </div>
            ) : (
              <Section title="Results" icon={Search}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {searchResults.map((u) => (
                    <UserCard key={u.id} user={u} onClick={() => navigate(`/chat/profile/${u.id}`)} />
                  ))}
                </div>
              </Section>
            )
          ) : (
            /* ── Discovery view ── */
            <>
              {recommended.length > 0 && (
                <Section title="Recommended for you" icon={Sparkles}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {recommended.map((u) => (
                      <SuggestCard key={u.id} user={u} onClick={() => navigate(`/chat/profile/${u.id}`)} />
                    ))}
                  </div>
                </Section>
              )}

              {remainingUsers.length > 0 ? (
                <Section title="Everyone on NexTalk" icon={Users}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {remainingUsers.map((u) => (
                      <UserCard key={u.id} user={u} onClick={() => navigate(`/chat/profile/${u.id}`)} />
                    ))}
                  </div>
                </Section>
              ) : (
                <div className="py-20 text-center">
                  <p className={`text-sm ${t("text-stone-500", "text-stone-400")}`}>
                    No other users yet. Be the first to invite someone!
                  </p>
                </div>
              )}
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
        <p className={`text-xs font-semibold uppercase tracking-wider ${t("text-stone-400", "text-stone-500")}`}>
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
        <p className={`text-xs font-semibold truncate ${t("text-stone-100", "text-stone-900")}`}>
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
        <p className={`text-sm font-semibold truncate ${t("text-stone-100", "text-stone-900")}`}>
          {user.display_name}
        </p>
        <p className={`text-xs truncate ${t("text-stone-400", "text-stone-500")}`}>
          {user.about || `@${user.username}`}
        </p>
      </div>
      <MessageSquare className="w-4 h-4 text-amber-500 shrink-0" />
    </button>
  );
};

export default Explore;

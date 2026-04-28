import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Search, UserPlus, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";
import { getContacts } from "../../api/contacts/contact";
import { normalizeContact } from "../../utils/formatters";
import Avatar from "../../components/chat/Avatar";
import ChatTopBar from "../../components/chat/ChatTopBar";
import ChatShell from "../../components/chat/ChatShell";

const Contacts = () => {
  const { t } = useTheme();
  const { user } = useUser();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts", user?.id],
    queryFn: async () => {
      const res = await getContacts();
      return (res.data.data || []).map(normalizeContact).filter(Boolean);
    },
    enabled: !!user,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (u) =>
        u.display_name?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q)
    );
  }, [query, contacts]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((u) => {
      const key = (u.display_name?.[0] || "?").toUpperCase();
      if (!map[key]) map[key] = [];
      map[key].push(u);
    });
    return Object.keys(map)
      .sort()
      .map((letter) => ({ letter, users: map[letter].sort((a, b) => a.display_name?.localeCompare(b.display_name)) }));
  }, [filtered]);

  return (
    <ChatShell active="contacts">
    <div className={`min-h-screen ${t("bg-stone-950 text-stone-100", "bg-stone-50 text-stone-900")}`}>
      <ChatTopBar
        title="Contacts"
        subtitle={`${contacts.length} contacts`}
        right={
          <button
            onClick={() => navigate("/chat/new")}
            className={`p-2 rounded-lg cursor-pointer ${t(
              "text-stone-400 hover:bg-white/5",
              "text-stone-500 hover:bg-stone-100"
            )}`}
          >
            <UserPlus className="w-5 h-5" />
          </button>
        }
      />

      <div className="px-4 py-3">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${t("bg-white/5", "bg-stone-100")}`}>
          <Search className={`w-4 h-4 ${t("text-stone-500", "text-stone-400")}`} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts..."
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

      {filtered.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className={`text-sm ${t("text-stone-500", "text-stone-400")}`}>
            {query ? `No contacts match "${query}".` : "No contacts yet."}
          </p>
          <button
            onClick={() => navigate("/chat/new")}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Find people
          </button>
        </div>
      ) : (
        <div className="pb-12">
          {grouped.map((group) => (
            <div key={group.letter}>
              <div className={`sticky top-14 px-4 py-1 text-xs font-bold ${t("bg-stone-950/90 text-amber-500", "bg-stone-50/90 text-amber-600")}`}>
                {group.letter}
              </div>
              {group.users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => navigate(`/chat/profile/${u.id}`)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 cursor-pointer ${t("hover:bg-white/5", "hover:bg-stone-100")}`}
                >
                  <Avatar src={u.avatar_url} initials={u.initials} color={u.color} size="md" status={u.status} />
                  <div className="flex-1 text-left min-w-0">
                    <p className={`text-sm font-semibold truncate ${t("text-stone-100", "text-stone-900")}`}>
                      {u.display_name}
                    </p>
                    <p className={`text-xs truncate ${t("text-stone-400", "text-stone-500")}`}>
                      {u.about || `@${u.username}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
    </ChatShell>
  );
};

export default Contacts;

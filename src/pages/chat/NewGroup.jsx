import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Search, X, Check, Camera } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";
import { searchUsers } from "../../api/users/user";
import { getContacts } from "../../api/contacts/contact";
import { createGroup } from "../../api/conversations/conversation";
import { normalizeUser, normalizeContact } from "../../utils/formatters";
import Avatar from "../../components/chat/Avatar";
import ChatTopBar from "../../components/chat/ChatTopBar";
import ChatShell from "../../components/chat/ChatShell";

const NewGroup = () => {
  const { t } = useTheme();
  const { user } = useUser();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState([]); // array of user objects
  const [groupName, setGroupName] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [creating, setCreating] = useState(false);

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

  const candidates = query.trim() ? searchResults : contacts;

  const pickedIds = useMemo(() => new Set(picked.map(u => u.id)), [picked]);

  const toggle = (u) =>
    setPicked(p => pickedIds.has(u.id) ? p.filter(x => x.id !== u.id) : [...p, u]);

  const create = async () => {
    if (!groupName.trim() || picked.length === 0 || creating) return;
    setCreating(true);
    try {
      const res = await createGroup({ group_name: groupName, member_ids: picked.map(u => u.id) });
      navigate(`/chat/${res.data.data.id}`);
    } catch (e) {
      console.error(e);
      setCreating(false);
    }
  };

  if (step === 2) {
    return (
      <ChatShell active="chats">
      <div className={`min-h-screen ${t("bg-stone-950 text-stone-100", "bg-stone-50 text-stone-900")}`}>
        <ChatTopBar title="New group" subtitle={`${picked.length} participants`} onBack={() => setStep(1)} />

        <div className="px-4 py-6 flex flex-col items-center">
          <button
            className={`relative w-24 h-24 rounded-full flex items-center justify-center cursor-pointer ${t(
              "bg-stone-800 hover:bg-stone-700",
              "bg-stone-200 hover:bg-stone-300"
            )}`}
          >
            <Camera className={`w-7 h-7 ${t("text-stone-300", "text-stone-600")}`} />
          </button>
          <p className={`text-xs mt-2 ${t("text-stone-400", "text-stone-500")}`}>Add group icon</p>
        </div>

        <div className="px-4">
          <label className={`text-xs font-semibold ${t("text-stone-400", "text-stone-500")}`}>
            Group name
          </label>
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            maxLength={50}
            placeholder="e.g. Design Team"
            className={`w-full mt-1.5 px-3 py-2.5 rounded-lg border outline-none text-sm ${t(
              "bg-stone-900 border-white/10 text-stone-100 placeholder-stone-600",
              "bg-white border-stone-200 text-stone-900 placeholder-stone-400"
            )} focus:border-amber-500`}
          />
          <p className={`text-[11px] mt-1 ${t("text-stone-500", "text-stone-400")}`}>
            {50 - groupName.length} characters left
          </p>
        </div>

        <div className="px-4 mt-6">
          <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${t("text-stone-400", "text-stone-500")}`}>
            Participants
          </p>
          <div className="flex flex-wrap gap-2">
            {picked.map((u) => (
              <div
                key={u.id}
                className={`flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full text-xs ${t("bg-white/5", "bg-stone-100")}`}
              >
                <Avatar src={u.avatar_url} initials={u.initials} color={u.color} size="xs" />
                <span>{u.display_name}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={create}
          disabled={!groupName.trim() || creating}
          className="fixed bottom-20 right-6 md:bottom-6 md:right-auto md:left-[344px] w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 text-white shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer z-40"
        >
          <Check className="w-6 h-6" />
        </button>
      </div>
      </ChatShell>
    );
  }

  return (
    <ChatShell active="chats">
    <div className={`min-h-screen ${t("bg-stone-950 text-stone-100", "bg-stone-50 text-stone-900")}`}>
      <ChatTopBar
        title="New group"
        subtitle={
          picked.length === 0
            ? "Add participants"
            : `${picked.length} selected`
        }
      />

      <div className="px-4 py-3">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${t("bg-white/5", "bg-stone-100")}`}>
          <Search className={`w-4 h-4 ${t("text-stone-500", "text-stone-400")}`} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users..."
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

      {picked.length > 0 && (
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-none">
          {picked.map((u) => (
            <button
              key={u.id}
              onClick={() => toggle(u)}
              className="flex flex-col items-center gap-1 shrink-0 cursor-pointer"
            >
              <div className="relative">
                <Avatar src={u.avatar_url} initials={u.initials} color={u.color} size="md" />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-stone-800 rounded-full flex items-center justify-center border-2 border-white dark:border-stone-950">
                  <X className="w-3 h-3 text-white" />
                </span>
              </div>
              <span className="text-[11px] max-w-[64px] truncate">{u.display_name.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      )}

      <div className="pb-24">
        {candidates.map((u) => {
          const selected = pickedIds.has(u.id);
          return (
            <button
              key={u.id}
              onClick={() => toggle(u)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 cursor-pointer ${t(
                "hover:bg-white/5",
                "hover:bg-stone-100"
              )}`}
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
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selected
                    ? "bg-amber-500 border-amber-500"
                    : t("border-stone-600", "border-stone-300")
                }`}
              >
                {selected && <Check className="w-3 h-3 text-white" />}
              </div>
            </button>
          );
        })}
      </div>

      {picked.length > 0 && (
        <button
          onClick={() => setStep(2)}
          className="fixed bottom-20 md:bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 text-white shadow-lg flex items-center justify-center cursor-pointer"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      )}
    </div>
    </ChatShell>
  );
};

export default NewGroup;

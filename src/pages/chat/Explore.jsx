import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Sparkles, MessageSquare, UserPlus, Users, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "../../context/ThemeContext";
import { usePeople } from "../../hooks/usePeople";
import { useContacts } from "../../hooks/useContacts";
import { openDM } from "../../services/conversations";
import { addContact } from "../../services/contacts";
import Avatar from "../../components/chat/Avatar";
import ChatTopBar from "../../components/chat/ChatTopBar";
import ChatShell from "../../components/chat/ChatShell";
import { CardGridSkeleton } from "../../components/chat/Skeleton";

const GRID = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3";

const Explore = () => {
  const { t } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  // "<userId>:message" | "<userId>:add" while a card action is in flight.
  const [busy, setBusy] = useState(null);

  const { people, loading, error, reload } = usePeople(query);
  const { contacts, reload: reloadContacts } = useContacts();

  // /users/all and /users/search already exclude blocked users in both
  // directions; `is_contact` is the one thing they do not tell us.
  const contactIds = useMemo(
    () => new Set(contacts.map((c) => c.id)),
    [contacts],
  );

  const allUsers = useMemo(
    () => people.map((u) => ({ ...u, is_contact: contactIds.has(u.id) })),
    [people, contactIds],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter(
      (u) =>
        u.display_name?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.about?.toLowerCase().includes(q)
    );
  }, [query, allUsers]);

  // Each person lands in exactly one card group; "Active now" is just a
  // glanceable avatar strip on top.
  const online = filtered.filter((u) => u.status === "online");
  const suggestions = filtered.filter((u) => !u.is_contact);
  const yourContacts = filtered.filter((u) => u.is_contact);

  const count = allUsers.length;
  const openProfile = (u) => navigate(`/chat/profile/${u.id}`);

  const message = async (u) => {
    if (busy) return;
    setBusy(`${u.id}:message`);
    try {
      const conv = await openDM(u.id);
      if (conv?.id) navigate(`/chat/${conv.id}`);
      else toast.error("Could not open that chat");
    } catch (e) {
      toast.error(e.message || "Could not open that chat");
    } finally {
      setBusy(null);
    }
  };

  const add = async (u) => {
    if (busy) return;
    setBusy(`${u.id}:add`);
    try {
      await addContact(u.id);
      await reloadContacts();
      toast.success(`${u.display_name} added to contacts`);
    } catch (e) {
      toast.error(e.message || "Could not add contact");
    } finally {
      setBusy(null);
    }
  };

  const renderGrid = (list) => (
    <div className={GRID}>
      {list.map((u) => (
        <PersonCard
          key={u.id}
          user={u}
          busy={busy}
          onOpen={() => openProfile(u)}
          onMessage={() => message(u)}
          onAdd={() => add(u)}
        />
      ))}
    </div>
  );

  return (
    <ChatShell active="explore" fullWidth>
      <div className={`min-h-screen ${t("text-stone-100", "text-stone-900")}`}>
        <ChatTopBar
          title="Explore"
          subtitle={
            loading && !count
              ? "Finding people…"
              : `${count} ${count === 1 ? "person" : "people"} on NexTalk`
          }
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
          {/* Search bar */}
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors ${t(
              "bg-white/5 border border-white/5 focus-within:border-amber-500/40",
              "bg-white border border-stone-200 focus-within:border-amber-400"
            )}`}
          >
            <Search className={`w-4 h-4 shrink-0 ${t("text-stone-500", "text-stone-400")}`} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people, usernames, bios..."
              className={`flex-1 min-w-0 bg-transparent outline-none text-sm ${t(
                "text-stone-200 placeholder-stone-600",
                "text-stone-700 placeholder-stone-400"
              )}`}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className={`cursor-pointer ${t("text-stone-500 hover:text-stone-300", "text-stone-400 hover:text-stone-600")}`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {loading ? (
            <CardGridSkeleton gridClassName={GRID} />
          ) : error ? (
            <EmptyState text={error}>
              <button onClick={reload} className="mt-3 text-sm font-medium text-amber-500 cursor-pointer">
                Try again
              </button>
            </EmptyState>
          ) : filtered.length === 0 ? (
            <EmptyState
              text={query ? `No one matches "${query}".` : "No one else is on NexTalk yet."}
            />
          ) : query ? (
            <Section title="Results" count={filtered.length}>
              {renderGrid(filtered)}
            </Section>
          ) : (
            <>
              {online.length > 0 && (
                <Section title="Active now" count={online.length} dot>
                  <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
                    {online.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => openProfile(u)}
                        className="w-16 shrink-0 flex flex-col items-center gap-1.5 cursor-pointer group"
                      >
                        <Avatar initials={u.initials} color={u.color} size="md" status={u.status} />
                        <span
                          className={`w-full text-center text-[11px] truncate ${t(
                            "text-stone-300 group-hover:text-white",
                            "text-stone-600 group-hover:text-stone-900"
                          )}`}
                        >
                          {u.display_name?.split(" ")[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </Section>
              )}

              {suggestions.length > 0 && (
                <Section title="Suggested for you" icon={Sparkles} count={suggestions.length}>
                  {renderGrid(suggestions)}
                </Section>
              )}

              {yourContacts.length > 0 && (
                <Section title="Your contacts" icon={Users} count={yourContacts.length}>
                  {renderGrid(yourContacts)}
                </Section>
              )}
            </>
          )}
        </div>
      </div>
    </ChatShell>
  );
};

const EmptyState = ({ text, children }) => {
  const { t } = useTheme();
  return (
    <div className="py-20 text-center">
      <p className={`text-sm ${t("text-stone-400", "text-stone-500")}`}>{text}</p>
      {children}
    </div>
  );
};

const Section = ({ title, icon: Icon, count, dot, children }) => {
  const { t } = useTheme();
  return (
    <section className="mt-7">
      <div className="mb-3 flex items-center gap-2">
        {dot && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
        {Icon && <Icon className="w-4 h-4 text-amber-500" />}
        <h2
          className={`text-xs font-semibold uppercase tracking-wider ${t(
            "text-stone-400",
            "text-stone-500"
          )}`}
        >
          {title}
        </h2>
        {count != null && (
          <span className={`text-xs ${t("text-stone-600", "text-stone-400")}`}>· {count}</span>
        )}
      </div>
      {children}
    </section>
  );
};

const PersonCard = ({ user, busy, onOpen, onMessage, onAdd }) => {
  const { t } = useTheme();
  const messaging = busy === `${user.id}:message`;
  const adding = busy === `${user.id}:add`;

  return (
    <div
      className={`rounded-2xl p-4 flex flex-col items-center text-center transition-colors ${t(
        "bg-white/5 border border-white/5 hover:border-white/10",
        "bg-white border border-stone-200 hover:border-stone-300 hover:shadow-sm"
      )}`}
    >
      <button onClick={onOpen} className="w-full flex flex-col items-center gap-2 cursor-pointer group">
        <Avatar initials={user.initials} color={user.color} size="lg" status={user.status} />
        <div className="w-full min-w-0">
          <p
            className={`text-sm font-semibold truncate transition-colors ${t(
              "text-stone-100 group-hover:text-amber-400",
              "text-stone-900 group-hover:text-amber-600"
            )}`}
          >
            {user.display_name}
          </p>
          <p className={`text-xs truncate ${t("text-stone-400", "text-stone-500")}`}>
            @{user.username}
          </p>
        </div>
      </button>

      {/* Fixed height so cards line up whether or not there's a bio */}
      <p className={`mt-1 h-4 w-full text-[11px] truncate ${t("text-stone-500", "text-stone-400")}`}>
        {user.about || ""}
      </p>

      <div className="mt-3 w-full flex gap-2">
        <button
          onClick={onMessage}
          disabled={!!busy}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer disabled:cursor-default"
        >
          {messaging ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <MessageSquare className="w-3.5 h-3.5" />
          )}
          Message
        </button>
        {!user.is_contact && (
          <button
            onClick={onAdd}
            disabled={!!busy}
            aria-label={`Add ${user.display_name} to contacts`}
            title="Add to contacts"
            className={`w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-lg border transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-default ${t(
              "border-white/10 text-stone-300 hover:bg-white/5",
              "border-stone-200 text-stone-600 hover:bg-stone-50"
            )}`}
          >
            {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
};

export default Explore;

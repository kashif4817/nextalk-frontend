import { useState } from "react";
import { Outlet, useMatch, useNavigate } from "react-router-dom";
import { Archive, ArchiveRestore } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { CONVERSATIONS, getUser } from "../../data/mockChatData";
import Avatar from "../../components/chat/Avatar";
import ChatTopBar from "../../components/chat/ChatTopBar";
import ChatShell from "../../components/chat/ChatShell";
import BottomSheet, { SheetItem } from "../../components/chat/BottomSheet";
import { useLongPress } from "../../components/chat/useLongPress";

const ArchivedRow = ({ conv, onClick, onLongPress, active }) => {
  const { t } = useTheme();
  const lp = useLongPress(() => onLongPress(conv));
  const other = !conv.is_group ? getUser(conv.other_user_id) : null;

  return (
    <button
      {...lp}
      onClick={() => {
        if (lp.didTriggerLongPress()) return;
        onClick(conv);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
        active
          ? t("bg-amber-500/10", "bg-amber-50")
          : t("hover:bg-white/5", "hover:bg-stone-50")
      }`}
    >
      <Avatar
        initials={conv.is_group ? conv.initials : other?.initials}
        color={conv.is_group ? conv.color : other?.color}
        size="md"
      />
      <div className="flex-1 min-w-0 text-left">
        <p className={`text-sm font-semibold truncate ${t("text-stone-100", "text-stone-900")}`}>
          {conv.title}
        </p>
        <p className={`text-xs truncate ${t("text-stone-400", "text-stone-500")}`}>
          {conv.last_message?.text}
        </p>
      </div>
      <span className={`text-[11px] ${t("text-stone-500", "text-stone-400")}`}>
        {conv.last_message?.time}
      </span>
    </button>
  );
};

const Archived = () => {
  const { t } = useTheme();
  const navigate = useNavigate();
  const childMatch = useMatch("/chat/archived/:id");
  const activeId = childMatch?.params?.id;

  const [conversations, setConversations] = useState(CONVERSATIONS);
  const [actionConv, setActionConv] = useState(null);

  const archived = conversations.filter((c) => c.is_archived);

  const restore = (id) =>
    setConversations((p) => p.map((c) => (c.id === id ? { ...c, is_archived: false } : c)));

  return (
    <ChatShell
      active="archived"
      rightPane={childMatch ? <Outlet /> : undefined}
      placeholderMessage="Select an archived chat to view it"
      showRightOnMobile={!!childMatch}
    >
      <div className={`min-h-screen ${t("bg-stone-950 text-stone-100", "bg-stone-50 text-stone-900")}`}>
        <ChatTopBar title="Archived" subtitle={`${archived.length} chats`} />

        {archived.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Archive className={`w-10 h-10 mx-auto mb-3 ${t("text-stone-500", "text-stone-400")}`} />
            <p className={`text-sm ${t("text-stone-400", "text-stone-500")}`}>
              No archived chats yet.
            </p>
            <p className={`text-xs mt-1 ${t("text-stone-500", "text-stone-400")}`}>
              Long-press any chat and select Archive.
            </p>
          </div>
        ) : (
          <div className={`divide-y ${t("divide-white/5", "divide-stone-100")}`}>
            {archived.map((conv) => (
              <ArchivedRow
                key={conv.id}
                conv={conv}
                active={activeId === conv.id}
                onClick={(c) => navigate(`/chat/archived/${c.id}`)}
                onLongPress={setActionConv}
              />
            ))}
          </div>
        )}

        <BottomSheet open={!!actionConv} onClose={() => setActionConv(null)} title={actionConv?.title}>
          <SheetItem
            icon={ArchiveRestore}
            label="Unarchive"
            onClick={() => {
              restore(actionConv.id);
              setActionConv(null);
            }}
          />
        </BottomSheet>
      </div>
    </ChatShell>
  );
};

export default Archived;

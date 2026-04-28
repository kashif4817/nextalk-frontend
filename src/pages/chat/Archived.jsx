import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Outlet, useMatch, useNavigate } from "react-router-dom";
import { Archive, ArchiveRestore } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";
import { getAllConversations } from "../../api/conversations/conversation";
import { normalizeConversation } from "../../utils/formatters";
import Avatar from "../../components/chat/Avatar";
import ChatTopBar from "../../components/chat/ChatTopBar";
import ChatShell from "../../components/chat/ChatShell";
import BottomSheet, { SheetItem } from "../../components/chat/BottomSheet";
import { useLongPress } from "../../components/chat/useLongPress";

const ArchivedRow = ({ conv, onClick, onLongPress, active }) => {
  const { t } = useTheme();
  const lp = useLongPress(() => onLongPress(conv));

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
      <Avatar src={conv.avatar_url} initials={conv.initials} color={conv.color} size="md" />
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
  const { user } = useUser();
  const navigate = useNavigate();
  const childMatch = useMatch("/chat/archived/:id");
  const activeId = childMatch?.params?.id;

  const queryClient = useQueryClient();
  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      const res = await getAllConversations();
      return (res.data.data || [])
        .map(row => normalizeConversation(row, user.id))
        .filter(Boolean);
    },
    enabled: !!user,
  });

  const [actionConv, setActionConv] = useState(null);

  const archived = conversations.filter(c => c.is_archived);

  const restore = (id) =>
    queryClient.setQueryData(["conversations", user?.id], (prev = []) =>
      prev.map(c => c.id === id ? { ...c, is_archived: false } : c)
    );

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

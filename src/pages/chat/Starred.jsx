import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, StarOff } from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "../../context/ThemeContext";
import { useStarred } from "../../hooks/useStarred";
import { useConversations } from "../../hooks/useConversations";
import { unstarMessage } from "../../services/messages";
import ChatTopBar from "../../components/chat/ChatTopBar";
import ChatShell from "../../components/chat/ChatShell";
import { StarredSkeleton } from "../../components/chat/Skeleton";
import BottomSheet, { SheetItem } from "../../components/chat/BottomSheet";
import { useLongPress } from "../../components/chat/useLongPress";

const StarredRow = ({ msg, onLongPress, onClick }) => {
  const { t } = useTheme();
  const lp = useLongPress(() => onLongPress(msg));
  return (
    <button
      {...lp}
      onClick={() => {
        if (lp.didTriggerLongPress()) return;
        onClick(msg);
      }}
      className={`w-full flex flex-col gap-1 px-4 py-3 text-left cursor-pointer border-b ${t(
        "hover:bg-white/5 border-white/5",
        "hover:bg-stone-50 border-stone-100"
      )}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-amber-500">{msg.sender}</p>
        <span className={`text-[11px] ${t("text-stone-500", "text-stone-400")}`}>
          {msg.time}
        </span>
      </div>
      <p className={`text-sm ${t("text-stone-200", "text-stone-800")}`}>{msg.text}</p>
      <p className={`text-xs ${t("text-stone-500", "text-stone-400")}`}>
        in {msg.conv_title}
      </p>
    </button>
  );
};

const Starred = () => {
  const { t } = useTheme();
  const navigate = useNavigate();
  const { starred, loading, error, reload, remove } = useStarred();
  const { conversations } = useConversations();
  const [actionMsg, setActionMsg] = useState(null);

  // The starred endpoint returns no conversation title, so resolve it here.
  const titleById = useMemo(() => {
    const map = new Map();
    conversations.forEach((c) => map.set(c.id, c.title));
    return map;
  }, [conversations]);

  const items = useMemo(
    () =>
      starred.map((m) => ({
        ...m,
        conv_title: titleById.get(m.conv_id) || "a conversation",
      })),
    [starred, titleById],
  );

  const unstar = async () => {
    if (!actionMsg) return;
    const row = actionMsg;
    setActionMsg(null);
    remove(row.id);
    try {
      await unstarMessage(row.message_id);
    } catch (e) {
      toast.error(e.message || "Could not unstar");
      reload();
    }
  };

  return (
    <ChatShell active="starred">
    <div className={`min-h-screen ${t("bg-stone-950 text-stone-100", "bg-stone-50 text-stone-900")}`}>
      <ChatTopBar title="Starred messages" subtitle={`${items.length} starred`} />

      {loading ? (
        <StarredSkeleton />
      ) : error ? (
        <div className="px-6 py-16 text-center">
          <p className={`text-sm ${t("text-stone-400", "text-stone-500")}`}>{error}</p>
          <button onClick={reload} className="mt-3 text-sm font-medium text-amber-500 cursor-pointer">
            Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <Star className={`w-10 h-10 mx-auto mb-3 ${t("text-stone-500", "text-stone-400")}`} />
          <p className={`text-sm ${t("text-stone-400", "text-stone-500")}`}>
            No starred messages yet.
          </p>
          <p className={`text-xs mt-1 ${t("text-stone-500", "text-stone-400")}`}>
            Long-press any message and tap Star.
          </p>
        </div>
      ) : (
        items.map((m) => (
          <StarredRow
            key={m.id}
            msg={m}
            onClick={(msg) => navigate(`/chat/${msg.conv_id}`)}
            onLongPress={setActionMsg}
          />
        ))
      )}

      <BottomSheet open={!!actionMsg} onClose={() => setActionMsg(null)}>
        <SheetItem icon={StarOff} label="Unstar" onClick={unstar} />
      </BottomSheet>
    </div>
    </ChatShell>
  );
};

export default Starred;

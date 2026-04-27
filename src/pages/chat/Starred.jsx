import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, StarOff } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { STARRED_MESSAGES } from "../../data/mockChatData";
import ChatTopBar from "../../components/chat/ChatTopBar";
import ChatShell from "../../components/chat/ChatShell";
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
  const [items, setItems] = useState(STARRED_MESSAGES);
  const [actionMsg, setActionMsg] = useState(null);

  return (
    <ChatShell active="starred">
    <div className={`min-h-screen ${t("bg-stone-950 text-stone-100", "bg-stone-50 text-stone-900")}`}>
      <ChatTopBar title="Starred messages" subtitle={`${items.length} starred`} />

      {items.length === 0 ? (
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
        <SheetItem
          icon={StarOff}
          label="Unstar"
          onClick={() => {
            setItems((p) => p.filter((m) => m.id !== actionMsg.id));
            setActionMsg(null);
          }}
        />
      </BottomSheet>
    </div>
    </ChatShell>
  );
};

export default Starred;

import { Star } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import ChatTopBar from "../../components/chat/ChatTopBar";
import ChatShell from "../../components/chat/ChatShell";

const Starred = () => {
  const { t } = useTheme();

  return (
    <ChatShell active="starred">
    <div className={`min-h-screen ${t("bg-stone-950 text-stone-100", "bg-stone-50 text-stone-900")}`}>
      <ChatTopBar title="Starred messages" subtitle="0 starred" />

      <div className="px-6 py-16 text-center">
        <Star className={`w-10 h-10 mx-auto mb-3 ${t("text-stone-500", "text-stone-400")}`} />
        <p className={`text-sm ${t("text-stone-400", "text-stone-500")}`}>
          No starred messages yet.
        </p>
        <p className={`text-xs mt-1 ${t("text-stone-500", "text-stone-400")}`}>
          Long-press any message and tap Star.
        </p>
      </div>
    </div>
    </ChatShell>
  );
};

export default Starred;

import { useState } from "react";
import { ArrowRight, Ghost } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import ConfirmModal from "./ConfirmModal";

/**
 * "Start a temp chat?" — confirms, then opens /temp in a new tab so the
 * signed-in app stays open here. Temp chats aren't linked to the account.
 */
export const TempChatConfirm = ({ open, onClose }) => (
  <ConfirmModal
    open={open}
    onClose={onClose}
    onConfirm={() => {
      onClose();
      window.open("/temp", "_blank", "noopener");
    }}
    variant="info"
    title="Start a temp chat?"
    message="You'll get a private link to share. Temp chats are anonymous: they aren't linked to your NexTalk account, nothing is saved, and the chat disappears when either of you leaves. It opens in a new tab, so you stay signed in here."
    confirmLabel="Start temp chat"
    cancelLabel="Not now"
  />
);

/** The amber "Start a temp chat" pill, as on the home page, with its confirmation. */
export const TempChatButton = ({ className = "" }) => {
  const { t } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group inline-flex items-center gap-3 pl-2 pr-5 py-2 rounded-full border transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${t(
          "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15",
          "bg-amber-50 border-amber-200 hover:bg-amber-100 hover:border-amber-300"
        )} ${className}`}
      >
        <span className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30">
          <Ghost className="w-4.5 h-4.5" />
        </span>
        <span className="text-left">
          <span className={`block text-sm font-semibold ${t("text-amber-300", "text-amber-800")}`}>
            Start a temp chat
          </span>
          <span className={`block text-xs ${t("text-stone-400", "text-stone-500")}`}>
            Anonymous. Disappears when you leave.
          </span>
        </span>
        <ArrowRight
          className={`w-4 h-4 group-hover:translate-x-0.5 transition-transform ${t(
            "text-amber-400",
            "text-amber-600"
          )}`}
        />
      </button>
      <TempChatConfirm open={open} onClose={() => setOpen(false)} />
    </>
  );
};

import { useEffect } from "react";
import { Camera, FileText, Headphones, Image as ImageIcon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

// The options WhatsApp offers under its paperclip, minus the ones NexTalk has
// no message type for yet (contact, poll, event).
const ATTACH_OPTIONS = [
  { key: "document", label: "Document", icon: FileText, color: "#7c3aed" },
  { key: "media", label: "Photos & videos", icon: ImageIcon, color: "#0ea5e9" },
  { key: "camera", label: "Camera", icon: Camera, color: "#ec4899" },
  { key: "audio", label: "Audio", icon: Headphones, color: "#f97316" },
];

/**
 * Popover that opens upward from the paperclip button. Render it as a sibling
 * of the trigger inside a `relative` wrapper.
 */
const AttachMenu = ({ open, onClose, onPick }) => {
  const { t } = useTheme();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        role="menu"
        className={`absolute z-50 bottom-full left-0 mb-2 w-56 rounded-2xl border shadow-2xl py-2 origin-bottom-left animate-modal-pop ${t(
          "bg-stone-900 border-white/10",
          "bg-white border-stone-200",
        )}`}
      >
        {ATTACH_OPTIONS.map(({ key, label, icon, color }) => {
          const Icon = icon;
          return (
            <button
              key={key}
              role="menuitem"
              onClick={() => {
                onClose();
                onPick(key);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm font-medium cursor-pointer transition-colors ${t(
                "text-stone-200 hover:bg-white/5",
                "text-stone-700 hover:bg-stone-100",
              )}`}
            >
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: color }}
              >
                <Icon className="w-4.5 h-4.5" />
              </span>
              {label}
            </button>
          );
        })}
      </div>
    </>
  );
};

export default AttachMenu;

import { useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";

// On desktop (position provided): renders as a small positioned dropdown near the cursor.
// On mobile (no position): slides up from the bottom.
const BottomSheet = ({ open, onClose, title, children, position = null }) => {
  const { t } = useTheme();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    if (!position) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, position]);

  if (!open) return null;

  // Desktop: positioned dropdown near cursor (WhatsApp-style)
  if (position) {
    const menuW = 224;
    const menuH = 300;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = Math.min(position.x, vw - menuW - 8);
    const top = position.y + menuH > vh ? position.y - menuH : position.y;

    return (
      <div className="fixed inset-0 z-[60]" onClick={onClose}>
        <div
          className={`absolute rounded-2xl border shadow-2xl overflow-hidden min-w-[200px] ${t(
            "bg-stone-900 border-white/10",
            "bg-white border-stone-200"
          )}`}
          style={{ left, top }}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <div
              className={`px-4 py-3 border-b text-sm font-semibold ${t(
                "border-white/10 text-stone-100",
                "border-stone-200 text-stone-800"
              )}`}
            >
              {title}
            </div>
          )}
          <div className="py-1">{children}</div>
        </div>
      </div>
    );
  }

  // Mobile: slide-up sheet
  return (
    <div className="fixed inset-0 z-[60] flex items-end">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative w-full rounded-t-2xl border ${t(
          "bg-stone-900 border-white/10",
          "bg-white border-stone-200"
        )} shadow-2xl max-h-[80vh] overflow-y-auto scrollbar-hide`}
      >
        <div className="flex justify-center pt-2.5 pb-1">
          <div className={`w-10 h-1 rounded-full ${t("bg-stone-700", "bg-stone-300")}`} />
        </div>
        {title && (
          <div className={`px-5 py-3 border-b ${t("border-white/10", "border-stone-200")}`}>
            <h3 className={`text-sm font-semibold ${t("text-stone-100", "text-stone-900")}`}>
              {title}
            </h3>
          </div>
        )}
        <div className="py-2">{children}</div>
      </div>
    </div>
  );
};

export const SheetItem = ({ icon: Icon, label, onClick, danger = false, hint }) => {
  const { t } = useTheme();
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors cursor-pointer ${
        danger
          ? t("text-red-400 hover:bg-red-500/10", "text-red-600 hover:bg-red-50")
          : t("text-stone-200 hover:bg-white/5", "text-stone-700 hover:bg-stone-100")
      }`}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span className="flex-1">{label}</span>
      {hint && (
        <span className={`text-xs ${t("text-stone-500", "text-stone-400")}`}>{hint}</span>
      )}
    </button>
  );
};

export default BottomSheet;

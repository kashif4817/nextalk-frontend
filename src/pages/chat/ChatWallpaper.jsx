import { useMemo } from "react";
import { Check } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useWallpaper } from "../../context/WallpaperContext";
import { WALLPAPERS } from "../../data/wallpapers";
import ChatTopBar from "../../components/chat/ChatTopBar";
import ChatShell from "../../components/chat/ChatShell";

const CATEGORY_ORDER = ["Themes", "Solid", "Gradient", "Pattern"];
const CATEGORY_LABELS = { Solid: "Solid colors", Gradient: "Gradients", Pattern: "Patterns" };

const IN = "self-start rounded-2xl rounded-bl-md bg-white/95 text-stone-900 shadow-sm";
const OUT = "self-end rounded-2xl rounded-br-md bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm";

// Full-height mock conversation for the desktop right pane.
const PreviewPane = ({ wallpaper, dark }) => (
  <div style={wallpaper.style(dark)} className="h-full w-full flex flex-col justify-end gap-2 p-8">
    <div className={`${IN} max-w-sm px-3.5 py-2 text-sm`}>Hey! How's the new wallpaper?</div>
    <div className={`${OUT} max-w-sm px-3.5 py-2 text-sm`}>Looks great 🔥</div>
    <div className={`${IN} max-w-sm px-3.5 py-2 text-sm`}>Told you {wallpaper.name} would suit you</div>
  </div>
);

const ChatWallpaper = () => {
  const { t, dark } = useTheme();
  const { wallpaperId, setWallpaperId, wallpaper } = useWallpaper();

  const grouped = useMemo(() => {
    const out = {};
    for (const w of WALLPAPERS) {
      (out[w.category] = out[w.category] || []).push(w);
    }
    return out;
  }, []);

  return (
    <ChatShell active="settings" rightPane={<PreviewPane wallpaper={wallpaper} dark={dark} />}>
    <div className={`min-h-screen ${t("bg-stone-950 text-stone-100", "bg-stone-50 text-stone-900")}`}>
      <ChatTopBar title="Chat wallpaper" subtitle={wallpaper.name} />

      {/* Compact inline preview — desktop shows the full one in the right pane */}
      <div
        style={wallpaper.style(dark)}
        className={`md:hidden mx-3 mt-3 h-24 rounded-xl border overflow-hidden flex flex-col justify-end gap-1.5 p-3 ${t("border-white/10", "border-stone-200")}`}
      >
        <div className={`${IN} px-2.5 py-1 text-[11px]`}>Hey! How's the new wallpaper?</div>
        <div className={`${OUT} px-2.5 py-1 text-[11px]`}>Looks great 🔥</div>
      </div>

      <p className={`px-4 pt-3 text-xs ${t("text-stone-400", "text-stone-500")}`}>
        Tap a wallpaper to apply it to all your chats.
      </p>

      {/* Picker grid */}
      <div className="px-3 pt-3 pb-8 space-y-4">
        {CATEGORY_ORDER.filter((c) => grouped[c]).map((category) => (
          <section key={category}>
            <h2 className={`text-[10px] font-semibold uppercase tracking-[0.15em] mb-2 px-1 ${t("text-stone-500", "text-stone-400")}`}>
              {CATEGORY_LABELS[category] || category}
            </h2>
            <div className="grid grid-cols-4 gap-2">
              {grouped[category].map((w) => {
                const selected = w.id === wallpaperId;
                return (
                  <button
                    key={w.id}
                    onClick={() => setWallpaperId(w.id)}
                    style={w.style(dark)}
                    title={w.name}
                    className={`relative aspect-[4/5] rounded-lg overflow-hidden border-2 transition-colors cursor-pointer ${
                      selected
                        ? "border-amber-500"
                        : t(
                            "border-white/10 hover:border-white/25",
                            "border-stone-200 hover:border-stone-300"
                          )
                    }`}
                  >
                    {selected && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center shadow">
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />
                      </span>
                    )}
                    <span className={`absolute inset-x-0 bottom-0 px-1 py-0.5 text-[10px] font-medium truncate ${t("bg-stone-950/65 text-white", "bg-white/85 text-stone-900")}`}>
                      {w.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
    </ChatShell>
  );
};

export default ChatWallpaper;

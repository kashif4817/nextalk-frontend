import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Users,
  Compass,
  Archive,
  Settings,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { ME } from "../../data/mockChatData";

// Thin desktop-only left rail (WhatsApp web style).
// Active state uses a subtle tint instead of full-button highlight.
const RailButton = ({ icon: Icon, label, active, onClick, badge }) => {
  const { t } = useTheme();
  return (
    <button
      onClick={onClick}
      title={label}
      className={`relative w-12 h-10 rounded-lg flex items-center justify-center cursor-pointer transition-colors group ${
        active
          ? t("bg-amber-500/15 text-amber-400", "bg-amber-50 text-amber-600")
          : t(
              "text-stone-400 hover:bg-white/5 hover:text-stone-100",
              "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
            )
      }`}
    >
      <Icon className="w-[18px] h-[18px]" />
      {badge > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      {/* Tooltip */}
      <span
        className={`absolute left-full ml-2 px-2 py-1 rounded-md text-xs whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 ${t(
          "bg-stone-800 text-stone-100 border border-white/10",
          "bg-stone-900 text-white"
        )}`}
      >
        {label}
      </span>
    </button>
  );
};

const LeftRail = ({ active = "chats" }) => {
  const { t, dark, toggle } = useTheme();
  const navigate = useNavigate();

  return (
    <aside
      className={`hidden md:flex flex-col items-center justify-between fixed left-0 top-0 bottom-0 w-16 border-r z-30 py-3 ${t(
        "bg-stone-950/95 border-white/5",
        "bg-white border-stone-200"
      )}`}
    >
      {/* Top: Nav */}
      <div className="flex flex-col items-center gap-1">
        <RailButton
          icon={MessageSquare}
          label="Chats"
          active={active === "chats"}
          onClick={() => navigate("/chat")}
        />
        <RailButton
          icon={Users}
          label="Contacts"
          active={active === "contacts"}
          onClick={() => navigate("/chat/contacts")}
        />
        <RailButton
          icon={Compass}
          label="Explore"
          active={active === "explore"}
          onClick={() => navigate("/chat/explore")}
        />
        <RailButton
          icon={Archive}
          label="Archived"
          active={active === "archived"}
          onClick={() => navigate("/chat/archived")}
        />
      </div>

      {/* Bottom: Theme + Settings + Profile */}
      <div className="flex flex-col items-center gap-1">
        <RailButton
          icon={dark ? Sun : Moon}
          label={dark ? "Light mode" : "Dark mode"}
          onClick={toggle}
        />
        <RailButton
          icon={Settings}
          label="Settings"
          active={active === "settings"}
          onClick={() => navigate("/chat/settings")}
        />
        <button
          onClick={() => navigate("/chat/settings")}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:ring-2 hover:ring-amber-500/50 transition-all"
          title="Profile"
        >
          {ME.initials}
        </button>
      </div>
    </aside>
  );
};

export default LeftRail;

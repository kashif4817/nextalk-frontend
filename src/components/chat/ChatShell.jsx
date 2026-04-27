import LeftRail from "./LeftRail";
import MobileBottomNav from "./MobileBottomNav";
import ChatWelcome from "../../pages/chat/ChatWelcome";
import { useTheme } from "../../context/ThemeContext";
import { MessageCircle } from "lucide-react";

// Default placeholder shown on the right pane for sub-pages (Archived, Settings, etc.)
// when no item is selected.
const SubPagePlaceholder = ({ message = "Select an item to view it here" }) => {
  const { t } = useTheme();
  return (
    <div
      className={`h-full w-full flex flex-col items-center justify-center px-8 text-center ${t(
        "bg-stone-900/30",
        "bg-stone-100"
      )}`}
    >
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${t(
          "bg-white/5",
          "bg-stone-200/60"
        )}`}
      >
        <MessageCircle className={`w-7 h-7 ${t("text-stone-500", "text-stone-400")}`} />
      </div>
      <p className={`text-sm ${t("text-stone-400", "text-stone-500")}`}>{message}</p>
    </div>
  );
};

// Wraps a chat sub-page with the persistent left rail (desktop) and bottom nav (mobile).
//
// `active`             — which rail/nav tab is highlighted
// `hideMobileNav`      — for full-screen pages (e.g., immersive thread view on mobile)
// `fullWidth`          — desktop pages that need breathing room (Explore, etc.)
// `rightPane`          — JSX to render in the right pane on desktop (e.g., <Outlet/>)
// `placeholderMessage` — custom message for the default placeholder
// `showRightOnMobile`  — when true, hide the left column on mobile and show the right
//                        pane full-screen (master-detail pattern)
const ChatShell = ({
  children,
  active = "chats",
  hideMobileNav = false,
  fullWidth = false,
  rightPane,
  placeholderMessage,
  showRightOnMobile = false,
}) => {
  const { t } = useTheme();

  if (fullWidth) {
    return (
      <div className={`md:flex md:h-screen ${t("bg-stone-950", "bg-stone-50")}`}>
        <LeftRail active={active} />
        <div
          className={`md:ml-16 flex-1 md:h-full md:overflow-y-auto md:scrollbar-hide ${
            hideMobileNav ? "" : "pb-14 md:pb-0"
          }`}
        >
          {children}
        </div>
        {!hideMobileNav && <MobileBottomNav active={active} />}
      </div>
    );
  }

  // Default: 2-column split (page content in 360px column + right pane)
  const leftClass = showRightOnMobile ? "hidden md:block" : "block";
  const rightClass = showRightOnMobile ? "block" : "hidden md:block";

  return (
    <div className={`md:flex md:h-screen ${t("bg-stone-950", "bg-stone-50")}`}>
      <LeftRail active={active} />

      <div
        className={`${leftClass} md:ml-16 md:w-[360px] md:shrink-0 md:h-full md:overflow-y-auto md:scrollbar-hide md:border-r ${t(
          "md:border-white/5",
          "md:border-stone-200"
        )} ${hideMobileNav ? "" : "pb-14 md:pb-0"}`}
      >
        {children}
      </div>

      <div className={`${rightClass} flex-1 h-screen md:h-full md:overflow-hidden`}>
        {rightPane !== undefined ? rightPane : (
          <SubPagePlaceholder message={placeholderMessage} />
        )}
      </div>

      {!hideMobileNav && !showRightOnMobile && <MobileBottomNav active={active} />}
    </div>
  );
};

export { ChatWelcome, SubPagePlaceholder };
export default ChatShell;

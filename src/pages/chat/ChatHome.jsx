import { useParams } from "react-router-dom";
import LeftRail from "../../components/chat/LeftRail";
import MobileBottomNav from "../../components/chat/MobileBottomNav";
import ChatListPane from "../../components/chat/ChatListPane";
import ChatThread from "./ChatThread";
import ChatWelcome from "./ChatWelcome";
import { useTheme } from "../../context/ThemeContext";

// WhatsApp-web split view:
//   • Desktop (md+): left rail + chat list pane (left, ~360px) + active pane (right)
//   • Mobile: shows EITHER the chat list OR the thread (based on URL :id)
const ChatHome = () => {
  const { id } = useParams();
  const { t } = useTheme();
  const showThread = !!id;

  return (
    <div className={`h-screen flex ${t("bg-stone-950", "bg-stone-50")}`}>
      <LeftRail active="chats" />

      {/* Chat list column — always visible on desktop, hidden on mobile when a thread is open */}
      <aside
        className={`${
          showThread ? "hidden md:flex" : "flex"
        } md:ml-16 w-full md:w-[360px] md:shrink-0 md:border-r ${t(
          "md:border-white/5",
          "md:border-stone-200"
        )} relative flex-col overflow-hidden`}
      >
        <ChatListPane />
      </aside>

      {/* Right pane — active conversation OR welcome screen */}
      <main
        className={`${
          showThread ? "flex" : "hidden md:flex"
        } flex-1 flex-col overflow-hidden`}
      >
        {showThread ? <ChatThread /> : <ChatWelcome />}
      </main>

      {/* Mobile bottom nav — only when on chat list (not in a thread) */}
      {!showThread && <MobileBottomNav active="chats" />}
    </div>
  );
};

export default ChatHome;

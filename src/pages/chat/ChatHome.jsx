import { useNavigate, useParams } from "react-router-dom";
import { Sparkles } from "lucide-react";
import LeftRail from "../../components/chat/LeftRail";
import MobileBottomNav from "../../components/chat/MobileBottomNav";
import ChatListPane from "../../components/chat/ChatListPane";
import ChatThread from "./ChatThread";
import ChatWelcome from "./ChatWelcome";
import AIChat from "./AIChat";
import { useTheme } from "../../context/ThemeContext";

export const AI_BOT_ID = "ai-bot";

// WhatsApp-web split view:
//   • Desktop (md+): left rail + chat list pane (left, ~360px) + active pane (right)
//   • Mobile: shows EITHER the chat list OR the thread (based on URL :id)
const ChatHome = () => {
  const { id } = useParams();
  const { t } = useTheme();
  const navigate = useNavigate();
  const showThread = !!id;
  const isAI = id === AI_BOT_ID;

  return (
    <div className={`h-screen flex ${t("bg-stone-950", "bg-stone-50")}`}>
      <LeftRail active={isAI ? "ai" : "chats"} />

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

      {/* Right pane — AI chat OR active conversation OR welcome screen */}
      <main
        className={`${
          showThread ? "flex" : "hidden md:flex"
        } flex-1 flex-col overflow-hidden`}
      >
        {showThread ? (isAI ? <AIChat /> : <ChatThread />) : <ChatWelcome />}
      </main>

      {/* Floating AI bubble — mobile only, stacked above the existing "new chat" FAB
          (which sits at bottom-20). Hidden when a chat thread is open. */}
      {!showThread && (
        <button
          onClick={() => navigate(`/chat/${AI_BOT_ID}`)}
          title="Chat with NexTalk AI"
          className="md:hidden fixed right-6 bottom-40 w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 text-white shadow-lg shadow-amber-500/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer z-30"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      )}

      {/* Mobile bottom nav — only when on chat list (not in a thread) */}
      {!showThread && <MobileBottomNav active="chats" />}
    </div>
  );
};

export default ChatHome;

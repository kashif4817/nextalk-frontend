import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Lock,
  Bell,
  MessageSquare,
  HelpCircle,
  LogOut,
  Sparkles,
  Database,
  KeyRound,
  Languages,
  CircleUser,
  Palette,
  Image as ImageIcon,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useWallpaper } from "../../context/WallpaperContext";
import { ME } from "../../data/mockChatData";
import Avatar from "../../components/chat/Avatar";
import ChatTopBar from "../../components/chat/ChatTopBar";
import ChatShell from "../../components/chat/ChatShell";
import ConfirmModal from "../../components/chat/ConfirmModal";
import supabase from "../../utils/supabaseClient";
import { comingSoon } from "../../utils/toast";

const Settings = () => {
  const { t, dark, toggle } = useTheme();
  const { wallpaper } = useWallpaper();
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore — still navigate to login
    }
    navigate("/login");
  };

  return (
    <ChatShell active="settings">
    <div className={`min-h-screen ${t("bg-stone-950 text-stone-100", "bg-stone-50 text-stone-900")}`}>
      <ChatTopBar title="Settings" />

      {/* Profile card */}
      <button
        onClick={() => comingSoon("Profile editing")}
        className={`w-full flex items-center gap-3 px-4 py-4 cursor-pointer ${t("bg-stone-900/40 hover:bg-white/5", "bg-white hover:bg-stone-50")}`}
      >
        <Avatar initials={ME.initials} color={ME.color} size="lg" />
        <div className="flex-1 text-left min-w-0">
          <p className={`text-base font-semibold ${t("text-stone-100", "text-stone-900")}`}>
            {ME.display_name}
          </p>
          <p className={`text-xs truncate ${t("text-stone-400", "text-stone-500")}`}>
            {ME.about}
          </p>
        </div>
        <ChevronRight className={`w-5 h-5 ${t("text-stone-600", "text-stone-300")}`} />
      </button>

      {/* Sections */}
      <Section>
        <Row icon={KeyRound} label="Account" hint="Privacy, security, change number" onClick={() => navigate("/chat/settings/privacy")} />
        <Row icon={Lock} label="Privacy" hint="Last seen, photo, about, read receipts" onClick={() => navigate("/chat/settings/privacy")} />
        <Row icon={ImageIcon} label="Chat wallpaper" hint={wallpaper.name} onClick={() => navigate("/chat/settings/wallpaper")} />
        <Row icon={MessageSquare} label="Chats" hint="Theme, history" onClick={() => comingSoon("Chat preferences")} />
        <Row icon={Bell} label="Notifications" hint="Messages, groups, calls" onClick={() => comingSoon("Notification settings")} />
        <Row icon={Database} label="Storage and data" hint="Network usage, auto-download" onClick={() => comingSoon("Storage settings")} />
      </Section>

      <Section>
        <Row
          icon={Palette}
          label="Theme"
          hint={dark ? "Dark" : "Light"}
          onClick={toggle}
        />
        <Row icon={Languages} label="App language" hint="English" onClick={() => comingSoon("More languages")} />
      </Section>

      <Section>
        <Row icon={Sparkles} label="What's new" onClick={() => comingSoon("Changelog")} />
        <Row icon={HelpCircle} label="Help" hint="Help center, contact us" onClick={() => comingSoon("Help center")} />
      </Section>

      <Section>
        <Row icon={LogOut} label="Log out" danger onClick={() => setLogoutOpen(true)} />
      </Section>

      <p className={`text-center py-6 text-xs ${t("text-stone-500", "text-stone-400")}`}>
        NexTalk v1.0 · Made with{" "}
        <span className="text-rose-500">♡</span> by{" "}
        <span className="font-semibold bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent tracking-wide">
          Kashif Mehmood
        </span>
      </p>

      <ConfirmModal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
        variant="logout"
        title="Log out of NexTalk?"
        message="You'll need to sign in again to access your messages and contacts."
        confirmLabel="Log out"
        cancelLabel="Stay signed in"
      />
    </div>
    </ChatShell>
  );
};

const Section = ({ children }) => {
  const { t } = useTheme();
  return (
    <div className={`mt-2 ${t("bg-stone-900/40", "bg-white")} divide-y ${t("divide-white/5", "divide-stone-100")}`}>
      {children}
    </div>
  );
};

const Row = ({ icon: Icon, label, hint, danger, onClick }) => {
  const { t } = useTheme();
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${t(
        "hover:bg-white/5",
        "hover:bg-stone-50"
      )}`}
    >
      <Icon className={`w-5 h-5 ${danger ? "text-red-500" : t("text-stone-400", "text-stone-500")}`} />
      <div className="flex-1 min-w-0 text-left">
        <p className={`text-sm ${danger ? "text-red-500" : t("text-stone-100", "text-stone-900")}`}>{label}</p>
        {hint && (
          <p className={`text-xs truncate ${t("text-stone-400", "text-stone-500")}`}>{hint}</p>
        )}
      </div>
      <ChevronRight className={`w-4 h-4 ${t("text-stone-600", "text-stone-300")}`} />
    </button>
  );
};

export default Settings;

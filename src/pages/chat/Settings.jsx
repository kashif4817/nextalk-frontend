import { useRef, useState } from "react";
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
  Palette,
  Image as ImageIcon,
  Camera,
  Loader2,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useWallpaper } from "../../context/WallpaperContext";
import Avatar from "../../components/chat/Avatar";
import ChatTopBar from "../../components/chat/ChatTopBar";
import ChatShell from "../../components/chat/ChatShell";
import ConfirmModal from "../../components/chat/ConfirmModal";
import supabase from "../../utils/supabaseClient";
import { comingSoon, showError, showSuccess } from "../../utils/toast";
import { useUser } from "../../context/UserContext";
import { logout } from "../../api/auth/login";
import { updateProfile } from "../../api/users/user";
import { uploadImage as uploadImageApi } from "../../api/upload/upload";

const Settings = () => {
  const { t, dark, toggle } = useTheme();
  const { wallpaper } = useWallpaper();
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore — continue with local signout
    }
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setAvatarUploading(true);
    try {
      const { data } = await uploadImageApi(file);
      const avatarUrl = data.data.url;
      await updateProfile({ avatar_url: avatarUrl });
      setUser(prev => ({ ...prev, avatar_url: avatarUrl }));
      showSuccess("Profile photo updated");
    } catch {
      showError("Failed to update profile photo");
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <ChatShell active="settings">
    <div className={`min-h-screen ${t("bg-stone-950 text-stone-100", "bg-stone-50 text-stone-900")}`}>
      <ChatTopBar title="Settings" />

      {/* Hidden avatar input */}
      <input
        ref={avatarInputRef}
        type="file"
        hidden
        accept="image/*"
        onChange={handleAvatarChange}
      />

      {/* Profile card */}
      <div className={`w-full flex items-center gap-3 px-4 py-4 ${t("bg-stone-900/40", "bg-white")}`}>
        {/* Avatar with camera overlay */}
        <button
          onClick={() => avatarInputRef.current?.click()}
          disabled={avatarUploading}
          className="relative shrink-0 group cursor-pointer"
        >
          <Avatar
            src={user?.avatar_url}
            initials={user?.initials ?? "?"}
            color={user?.color}
            size="lg"
          />
          <div className={`absolute inset-0 rounded-full flex items-center justify-center transition-opacity ${avatarUploading ? "opacity-100 bg-black/50" : "opacity-0 group-hover:opacity-100 bg-black/40"}`}>
            {avatarUploading
              ? <Loader2 className="w-5 h-5 text-white animate-spin" />
              : <Camera className="w-5 h-5 text-white" />
            }
          </div>
        </button>

        <button
          onClick={() => comingSoon("Profile editing")}
          className="flex-1 text-left min-w-0 cursor-pointer"
        >
          <p className={`text-base font-semibold ${t("text-stone-100", "text-stone-900")}`}>
            {user?.display_name ?? ""}
          </p>
          <p className={`text-xs truncate ${t("text-stone-400", "text-stone-500")}`}>
            {user?.about ?? ""}
          </p>
        </button>

        <ChevronRight className={`w-5 h-5 ${t("text-stone-600", "text-stone-300")}`} />
      </div>

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

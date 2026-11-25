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
  KeyRound,
  Languages,
  CircleUser,
  Palette,
  Image as ImageIcon,
  Check,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { usePreferences } from "../../context/PreferencesContext";
import BottomSheet, { SheetItem } from "../../components/chat/BottomSheet";
import { notificationPermission } from "../../lib/notify";
import { useWallpaper } from "../../context/WallpaperContext";
import { useUser } from "../../context/UserContext";
import {
  getInitials,
  gradientForId,
  resolveDisplayName,
} from "../../utils/profile";
import Avatar from "../../components/chat/Avatar";
import ChatTopBar from "../../components/chat/ChatTopBar";
import ChatShell from "../../components/chat/ChatShell";
import { ProfileCardSkeleton } from "../../components/chat/Skeleton";
import ConfirmModal from "../../components/chat/ConfirmModal";
import SoonBadge from "../../components/chat/SoonBadge";
import supabase from "../../utils/supabaseClient";
import { comingSoon } from "../../utils/toast";

const THEME_OPTIONS = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", hint: "Match your device (default)", icon: Monitor },
];

const Settings = () => {
  const { t, dark, mode, setMode } = useTheme();
  const { wallpaper } = useWallpaper();
  const { user, profile, profileLoading } = useUser();
  const { prefs } = usePreferences();
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  const themeHint =
    mode === "system"
      ? `System (${dark ? "Dark" : "Light"})`
      : THEME_OPTIONS.find((o) => o.id === mode)?.label;

  const desktopOn = prefs.notifyDesktop && notificationPermission() === "granted";
  const notificationsHint = desktopOn
    ? prefs.notifySound
      ? "Desktop alerts and sound"
      : "Desktop alerts"
    : prefs.notifySound
      ? "Sound only"
      : "Off";

  const displayName = resolveDisplayName(profile, user);
  // Nudge users who skipped setup, instead of showing an empty subtitle.
  const subtitle =
    profile?.about?.trim() ||
    (profile?.username ? `@${profile.username}` : "Tap to finish your profile");

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
        onClick={() => navigate("/chat/settings/profile")}
        className={`w-full flex items-center gap-3 px-4 py-4 cursor-pointer ${t("bg-stone-900/40 hover:bg-white/5", "bg-white hover:bg-stone-50")}`}
      >
        {profileLoading ? (
          <ProfileCardSkeleton />
        ) : (
          <>
            <Avatar
              initials={getInitials(displayName)}
              color={gradientForId(user?.id)}
              size="lg"
            />
            <div className="flex-1 text-left min-w-0">
              <p className={`text-base font-semibold truncate ${t("text-stone-100", "text-stone-900")}`}>
                {displayName}
              </p>
              <p className={`text-xs truncate ${t("text-stone-400", "text-stone-500")}`}>
                {subtitle}
              </p>
            </div>
          </>
        )}
        <ChevronRight className={`w-5 h-5 ${t("text-stone-600", "text-stone-300")}`} />
      </button>

      {/* Sections */}
      <Section>
        <Row icon={KeyRound} label="Account" hint="Email, sign-in, security" onClick={() => navigate("/chat/settings/account")} />
        <Row icon={Lock} label="Privacy" hint="Last seen, photo, about, read receipts" onClick={() => navigate("/chat/settings/privacy")} />
        <Row icon={ImageIcon} label="Chat wallpaper" hint={wallpaper.name} onClick={() => navigate("/chat/settings/wallpaper")} />
        <Row icon={MessageSquare} label="Chats" hint="Enter to send, text size" onClick={() => navigate("/chat/settings/chats")} />
        <Row icon={Bell} label="Notifications" hint={notificationsHint} onClick={() => navigate("/chat/settings/notifications")} />
      </Section>

      <Section>
        <Row
          icon={Palette}
          label="Theme"
          hint={themeHint}
          onClick={() => setThemeOpen(true)}
        />
        <Row icon={Languages} label="App language" hint="English" soon onClick={() => comingSoon("More languages")} />
      </Section>

      <Section>
        <Row icon={Sparkles} label="What's new" soon onClick={() => comingSoon("Changelog")} />
        <Row icon={HelpCircle} label="Help" hint="Help center, contact us" soon onClick={() => comingSoon("Help center")} />
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

      <BottomSheet open={themeOpen} onClose={() => setThemeOpen(false)} title="Theme">
        {THEME_OPTIONS.map((o) => (
          <SheetItem
            key={o.id}
            icon={mode === o.id ? Check : o.icon}
            label={o.label}
            hint={o.hint}
            onClick={() => {
              setMode(o.id);
              setThemeOpen(false);
            }}
          />
        ))}
      </BottomSheet>

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

// `soon` marks a feature that isn't built yet: tagged, and its text muted.
const Row = ({ icon: Icon, label, hint, danger, soon, onClick }) => {
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
      <div className={`flex-1 min-w-0 text-left ${soon ? "opacity-70" : ""}`}>
        <p className={`flex items-center gap-2 text-sm ${danger ? "text-red-500" : t("text-stone-100", "text-stone-900")}`}>
          {label}
          {soon && <SoonBadge />}
        </p>
        {hint && (
          <p className={`text-xs truncate ${t("text-stone-400", "text-stone-500")}`}>{hint}</p>
        )}
      </div>
      <ChevronRight className={`w-4 h-4 ${t("text-stone-600", "text-stone-300")}`} />
    </button>
  );
};

export default Settings;

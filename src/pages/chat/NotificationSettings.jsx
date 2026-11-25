import { useState } from "react";
import { BellRing, Send, ShieldAlert, Volume2 } from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "../../context/ThemeContext";
import { usePreferences } from "../../context/PreferencesContext";
import ChatTopBar from "../../components/chat/ChatTopBar";
import ChatShell from "../../components/chat/ChatShell";
import { SettingsLabel, SettingsSection, ToggleRow } from "../../components/chat/SettingsUI";
import {
  notificationPermission,
  requestNotificationPermission,
  showNotification,
} from "../../lib/notify";
import { playMessageSound, unlockSound } from "../../lib/notifySound";

const NotificationSettings = () => {
  const { t } = useTheme();
  const { prefs, setPref } = usePreferences();
  const [permission, setPermission] = useState(notificationPermission);

  const desktopOn = prefs.notifyDesktop && permission === "granted";

  const setDesktop = async (on) => {
    if (!on) {
      setPref("notifyDesktop", false);
      return;
    }
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === "granted") {
      setPref("notifyDesktop", true);
    } else if (result === "unsupported") {
      toast.error("This browser doesn't support desktop notifications.");
    } else if (result === "denied") {
      toast.error("Notifications are blocked for this site in your browser.");
    }
  };

  const sendTest = () => {
    unlockSound();
    if (prefs.notifySound) playMessageSound();
    if (desktopOn) {
      showNotification({
        title: "NexTalk",
        body: "This is how new messages will appear.",
        tag: "nextalk-test",
      });
    }
    if (!prefs.notifySound && !desktopOn) {
      toast("Turn on a notification type first.");
    }
  };

  return (
    <ChatShell active="settings">
      <div className={`min-h-screen pb-10 ${t("bg-stone-950 text-stone-100", "bg-stone-50 text-stone-900")}`}>
        <ChatTopBar title="Notifications" subtitle="New message alerts" />

        <p className={`px-4 pt-4 text-xs leading-relaxed ${t("text-stone-400", "text-stone-500")}`}>
          Alerts for messages that arrive while NexTalk is in the background. Muted chats
          stay silent.
        </p>

        <SettingsLabel>Messages</SettingsLabel>
        <SettingsSection>
          <ToggleRow
            id="notify-desktop"
            icon={BellRing}
            label="Desktop notifications"
            hint="Show a popup with the sender and message"
            checked={desktopOn}
            onChange={setDesktop}
            disabled={permission === "unsupported"}
          />
          <ToggleRow
            id="notify-sound"
            icon={Volume2}
            label="Sound"
            hint="Play a chime for new messages"
            checked={prefs.notifySound}
            onChange={(v) => {
              setPref("notifySound", v);
              // Toggling counts as a user gesture, which lets audio start.
              if (v) unlockSound();
            }}
          />
        </SettingsSection>

        {permission === "denied" && (
          <div
            role="alert"
            className={`mx-4 mt-3 flex items-start gap-2.5 p-3 rounded-xl border text-xs leading-relaxed ${t(
              "bg-amber-500/10 border-amber-500/20 text-amber-200",
              "bg-amber-50 border-amber-200 text-amber-800"
            )}`}
          >
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Your browser is blocking notifications for this site. Click the icon at the
              left of the address bar, set <strong>Notifications</strong> to Allow, then
              reload the page.
            </p>
          </div>
        )}

        <div className="mt-3">
          <SettingsSection>
            <button
              type="button"
              onClick={sendTest}
              className={`w-full flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${t(
                "hover:bg-white/5",
                "hover:bg-stone-50"
              )}`}
            >
              <Send className="w-5 h-5 text-amber-500" />
              <span className={`text-sm ${t("text-stone-100", "text-stone-900")}`}>
                Send a test notification
              </span>
            </button>
          </SettingsSection>
        </div>

        <p className={`px-4 pt-3 text-xs ${t("text-stone-500", "text-stone-400")}`}>
          These settings apply to this browser only.
        </p>
      </div>
    </ChatShell>
  );
};

export default NotificationSettings;

import { CornerDownLeft } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { usePreferences } from "../../context/PreferencesContext";
import ChatTopBar from "../../components/chat/ChatTopBar";
import ChatShell from "../../components/chat/ChatShell";
import { SettingsLabel, SettingsSection, ToggleRow } from "../../components/chat/SettingsUI";

// Ids match the `[data-chat-text]` rules in index.css.
const TEXT_SIZES = [
  { id: "small", label: "Small" },
  { id: "medium", label: "Medium" },
  { id: "large", label: "Large" },
];

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const SEND_COMBO = isMac ? "⌘ + Enter" : "Ctrl + Enter";

const ChatSettings = () => {
  const { t } = useTheme();
  const { prefs, setPref } = usePreferences();

  return (
    <ChatShell active="settings">
      <div className={`min-h-screen pb-10 ${t("bg-stone-950 text-stone-100", "bg-stone-50 text-stone-900")}`}>
        <ChatTopBar title="Chats" subtitle="Typing and text size" />

        <SettingsLabel>Typing</SettingsLabel>
        <SettingsSection>
          <ToggleRow
            id="enter-to-send"
            icon={CornerDownLeft}
            label="Enter to send"
            hint={
              prefs.enterToSend
                ? "Enter sends your message. Shift + Enter adds a new line."
                : `Enter adds a new line. ${SEND_COMBO} sends.`
            }
            checked={prefs.enterToSend}
            onChange={(v) => setPref("enterToSend", v)}
          />
        </SettingsSection>

        <SettingsLabel>Text size</SettingsLabel>
        <SettingsSection>
          <div className="px-4 py-4 space-y-4">
            <div
              role="radiogroup"
              aria-label="Message text size"
              className={`grid grid-cols-3 gap-1 p-1 rounded-xl ${t("bg-stone-900", "bg-stone-100")}`}
            >
              {TEXT_SIZES.map((size) => {
                const active = prefs.textSize === size.id;
                return (
                  <button
                    key={size.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setPref("textSize", size.id)}
                    className={`py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 ${
                      active
                        ? "bg-amber-500 text-white shadow-sm"
                        : t("text-stone-300 hover:bg-white/5", "text-stone-600 hover:bg-white")
                    }`}
                  >
                    {size.label}
                  </button>
                );
              })}
            </div>

            {/* Live preview, styled like real bubbles */}
            <div className={`rounded-xl p-3 space-y-2 ${t("bg-stone-900/60", "bg-stone-100")}`} aria-hidden="true">
              <div className="flex justify-start">
                <p
                  className={`chat-text max-w-[80%] px-3 py-2 rounded-2xl rounded-bl-md ${t(
                    "bg-stone-800 text-stone-100",
                    "bg-white text-stone-900 border border-stone-200"
                  )}`}
                >
                  Hey! Is the text size okay for you?
                </p>
              </div>
              <div className="flex justify-end">
                <p className="chat-text max-w-[80%] px-3 py-2 rounded-2xl rounded-br-md bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                  Much better, thanks 👍
                </p>
              </div>
            </div>
          </div>
        </SettingsSection>

        <p className={`px-4 pt-3 text-xs ${t("text-stone-500", "text-stone-400")}`}>
          These settings apply to this browser only.
        </p>
      </div>
    </ChatShell>
  );
};

export default ChatSettings;

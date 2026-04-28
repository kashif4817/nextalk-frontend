import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ShieldOff, Check } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import ChatTopBar from "../../components/chat/ChatTopBar";
import ChatShell from "../../components/chat/ChatShell";
import BottomSheet, { SheetItem } from "../../components/chat/BottomSheet";
import { comingSoon } from "../../utils/toast";

const PRIVACY_FIELDS = [
  { key: "last_seen_privacy", label: "Last seen & online", desc: "Who can see your last seen and online status" },
  { key: "profile_photo_privacy", label: "Profile photo", desc: "Who can see your profile photo" },
  { key: "about_privacy", label: "About", desc: "Who can see your About info" },
  { key: "read_receipts_privacy", label: "Read receipts", desc: "Whether others see when you read messages" },
];

const OPTIONS = [
  { id: "everyone", label: "Everyone" },
  { id: "contacts", label: "My contacts" },
  { id: "nobody", label: "Nobody" },
];

const PrivacySettings = () => {
  const { t } = useTheme();
  const navigate = useNavigate();
  const [privacy, setPrivacy] = useState({
    last_seen_privacy: "everyone",
    profile_photo_privacy: "everyone",
    about_privacy: "everyone",
    read_receipts_privacy: "everyone",
  });
  const [editing, setEditing] = useState(null);

  const labelFor = (val) => OPTIONS.find((o) => o.id === val)?.label;

  return (
    <ChatShell active="settings">
    <div className={`min-h-screen ${t("bg-stone-950 text-stone-100", "bg-stone-50 text-stone-900")}`}>
      <ChatTopBar title="Privacy" />

      <p className={`px-4 pt-4 text-xs ${t("text-stone-400", "text-stone-500")}`}>
        Control who can see your information. Read receipts are always shown for groups.
      </p>

      <div className={`mt-3 ${t("bg-stone-900/40", "bg-white")} divide-y ${t("divide-white/5", "divide-stone-100")}`}>
        {PRIVACY_FIELDS.map((f) => (
          <button
            key={f.key}
            onClick={() => setEditing(f)}
            className={`w-full flex items-center gap-3 px-4 py-3 cursor-pointer ${t("hover:bg-white/5", "hover:bg-stone-50")}`}
          >
            <div className="flex-1 text-left min-w-0">
              <p className={`text-sm ${t("text-stone-100", "text-stone-900")}`}>{f.label}</p>
              <p className={`text-xs ${t("text-stone-400", "text-stone-500")}`}>
                {labelFor(privacy[f.key])}
              </p>
            </div>
            <ChevronRight className={`w-4 h-4 ${t("text-stone-600", "text-stone-300")}`} />
          </button>
        ))}
      </div>

      <div className={`mt-3 ${t("bg-stone-900/40", "bg-white")}`}>
        <button
          onClick={() => navigate("/chat/blocked")}
          className={`w-full flex items-center gap-3 px-4 py-3 cursor-pointer ${t("hover:bg-white/5", "hover:bg-stone-50")}`}
        >
          <ShieldOff className={`w-5 h-5 ${t("text-stone-400", "text-stone-500")}`} />
          <div className="flex-1 text-left">
            <p className={`text-sm ${t("text-stone-100", "text-stone-900")}`}>Blocked contacts</p>
            <p className={`text-xs ${t("text-stone-400", "text-stone-500")}`}>0 contacts</p>
          </div>
          <ChevronRight className={`w-4 h-4 ${t("text-stone-600", "text-stone-300")}`} />
        </button>
      </div>

      <BottomSheet open={!!editing} onClose={() => setEditing(null)} title={editing?.label}>
        {OPTIONS.map((o) => (
          <SheetItem
            key={o.id}
            icon={privacy[editing?.key] === o.id ? Check : null}
            label={o.label}
            onClick={() => {
              setPrivacy((p) => ({ ...p, [editing.key]: o.id }));
              comingSoon(`${editing.label} controls`);
              setEditing(null);
            }}
          />
        ))}
      </BottomSheet>
    </div>
    </ChatShell>
  );
};

export default PrivacySettings;

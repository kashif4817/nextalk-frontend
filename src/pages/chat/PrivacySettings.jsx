import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ShieldOff, Check } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import toast from "react-hot-toast";
import { useUser } from "../../context/UserContext";
import { useBlocked } from "../../hooks/useBlocked";
import { updatePrivacy } from "../../services/users";
import ChatTopBar from "../../components/chat/ChatTopBar";
import ChatShell from "../../components/chat/ChatShell";
import { Bone } from "../../components/chat/Skeleton";
import BottomSheet, { SheetItem } from "../../components/chat/BottomSheet";

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
  const { profile, profileLoading, refreshProfile } = useUser();
  const { blocked } = useBlocked();
  const [editing, setEditing] = useState(null);
  // Only what this session changed; everything else reads from the profile.
  const [overrides, setOverrides] = useState({});

  // Derived, so a late-arriving profile needs no setState in an effect.
  // "everyone" is the server-side default for an unset column.
  const valueOf = (key) =>
    overrides[key] ?? profile?.[key] ?? "everyone";

  const privacy = {
    last_seen_privacy: valueOf("last_seen_privacy"),
    profile_photo_privacy: valueOf("profile_photo_privacy"),
    about_privacy: valueOf("about_privacy"),
    read_receipts_privacy: valueOf("read_receipts_privacy"),
  };

  const choose = async (field, value) => {
    setOverrides((o) => ({ ...o, [field.key]: value }));
    setEditing(null);
    try {
      await updatePrivacy({ [field.key]: value });
      refreshProfile();
    } catch (e) {
      // Drop the override so the row falls back to the stored value.
      setOverrides((o) => {
        const next = { ...o };
        delete next[field.key];
        return next;
      });
      toast.error(e.message || `Could not update ${field.label.toLowerCase()}`);
    }
  };

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
              {profileLoading ? (
                <Bone className="mt-1.5 h-2.5 w-16" />
              ) : (
                <p className={`text-xs ${t("text-stone-400", "text-stone-500")}`}>
                  {labelFor(privacy[f.key])}
                </p>
              )}
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
            <p className={`text-xs ${t("text-stone-400", "text-stone-500")}`}>
              {blocked.length} {blocked.length === 1 ? "contact" : "contacts"}
            </p>
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
            onClick={() => choose(editing, o.id)}
          />
        ))}
      </BottomSheet>
    </div>
    </ChatShell>
  );
};

export default PrivacySettings;

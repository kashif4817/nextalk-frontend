import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Mail,
  Link2,
  CalendarDays,
  Clock,
  Lock,
  AtSign,
  LogOut,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";
import ChatTopBar from "../../components/chat/ChatTopBar";
import ChatShell from "../../components/chat/ChatShell";
import { Bone } from "../../components/chat/Skeleton";
import ConfirmModal from "../../components/chat/ConfirmModal";
import SoonBadge from "../../components/chat/SoonBadge";
import supabase from "../../utils/supabaseClient";
import { comingSoon } from "../../utils/toast";

const PROVIDER_NAMES = { google: "Google", github: "GitHub", email: "Email" };

const providerName = (p) => PROVIDER_NAMES[p] || (p ? p[0].toUpperCase() + p.slice(1) : null);

const formatDate = (iso, withTime = false) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
};

const AccountSettings = () => {
  const { t } = useTheme();
  const navigate = useNavigate();
  const { user, profile, profileLoading } = useUser();
  const [signOutAllOpen, setSignOutAllOpen] = useState(false);

  // NexTalk signs in through OAuth only, so the account is defined by the
  // linked identities rather than a phone number or password.
  const providers = [
    ...new Set(
      (user?.identities?.map((i) => i.provider) ?? [user?.app_metadata?.provider])
        .filter(Boolean)
    ),
  ];
  const linked = providers.map(providerName).join(", ") || "—";

  const handleSignOutAll = async () => {
    setSignOutAllOpen(false);
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) {
      toast.error(error.message || "Could not log out of other devices");
      return;
    }
    navigate("/login");
  };

  return (
    <ChatShell active="settings">
    <div className={`min-h-screen ${t("bg-stone-950 text-stone-100", "bg-stone-50 text-stone-900")}`}>
      <ChatTopBar title="Account" />

      <SectionLabel>Sign-in</SectionLabel>
      <Section>
        <Row icon={Mail} label="Email" hint={user?.email || "—"} />
        <Row icon={Link2} label="Linked accounts" hint={linked} />
        <Row icon={CalendarDays} label="Member since" hint={formatDate(user?.created_at)} />
        <Row icon={Clock} label="Last sign-in" hint={formatDate(user?.last_sign_in_at, true)} />
      </Section>

      <SectionLabel>Profile & privacy</SectionLabel>
      <Section>
        <Row
          icon={AtSign}
          label="Username"
          hint={profileLoading ? <Bone className="mt-1.5 h-2.5 w-20" /> : profile?.username ? `@${profile.username}` : "Not set"}
          onClick={() => navigate("/chat/settings/profile")}
        />
        <Row
          icon={Lock}
          label="Privacy"
          hint="Last seen, photo, about, read receipts"
          onClick={() => navigate("/chat/settings/privacy")}
        />
      </Section>

      <SectionLabel>Security</SectionLabel>
      <Section>
        <Row
          icon={LogOut}
          label="Log out of all devices"
          hint="Ends every session, including this one"
          danger
          onClick={() => setSignOutAllOpen(true)}
        />
        <Row
          icon={Trash2}
          label="Delete account"
          hint="Permanently remove your account and messages"
          danger
          soon
          onClick={() => comingSoon("Account deletion")}
        />
      </Section>

      <ConfirmModal
        open={signOutAllOpen}
        onClose={() => setSignOutAllOpen(false)}
        onConfirm={handleSignOutAll}
        variant="logout"
        title="Log out of all devices?"
        message="You'll be signed out everywhere NexTalk is open, including this browser."
        confirmLabel="Log out everywhere"
        cancelLabel="Cancel"
      />
    </div>
    </ChatShell>
  );
};

const SectionLabel = ({ children }) => {
  const { t } = useTheme();
  return (
    <p className={`px-4 pt-4 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${t("text-stone-500", "text-stone-400")}`}>
      {children}
    </p>
  );
};

const Section = ({ children }) => {
  const { t } = useTheme();
  return (
    <div className={`${t("bg-stone-900/40", "bg-white")} divide-y ${t("divide-white/5", "divide-stone-100")}`}>
      {children}
    </div>
  );
};

// A row with `onClick` is a link (hover + chevron); without one it's read-only info.
// `soon` marks a feature that isn't built yet.
const Row = ({ icon: Icon, label, hint, danger, soon, onClick }) => {
  const { t } = useTheme();
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 ${
        onClick ? `cursor-pointer transition-colors ${t("hover:bg-white/5", "hover:bg-stone-50")}` : ""
      }`}
    >
      <Icon className={`w-5 h-5 shrink-0 ${danger ? "text-red-500" : t("text-stone-400", "text-stone-500")}`} />
      <div className={`flex-1 min-w-0 text-left ${soon ? "opacity-70" : ""}`}>
        <p className={`flex items-center gap-2 text-sm ${danger ? "text-red-500" : t("text-stone-100", "text-stone-900")}`}>
          {label}
          {soon && <SoonBadge />}
        </p>
        {hint && (
          <div className={`text-xs truncate ${t("text-stone-400", "text-stone-500")}`}>{hint}</div>
        )}
      </div>
      {onClick && <ChevronRight className={`w-4 h-4 ${t("text-stone-600", "text-stone-300")}`} />}
    </Tag>
  );
};

export default AccountSettings;

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  MessageSquare,
  UserPlus,
  UserMinus,
  ShieldOff,
  ShieldCheck,
  Flag,
  Bell,
  BellOff,
  Image as ImageIcon,
  Link as LinkIcon,
  FileText,
  ChevronRight,
  AtSign,
  Info,
  Phone,
  Video,
  MoreVertical,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { ALL_USERS, CONVERSATIONS, getUser } from "../../data/mockChatData";
import Avatar from "../../components/chat/Avatar";
import ChatTopBar from "../../components/chat/ChatTopBar";
import ChatShell from "../../components/chat/ChatShell";
import BottomSheet, { SheetItem } from "../../components/chat/BottomSheet";
import { comingSoon } from "../../utils/toast";

const UserProfile = () => {
  const { t } = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const initial = getUser(id);
  const [user, setUser] = useState(initial);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) {
    return (
      <ChatShell active="chats">
        <div className={`min-h-screen flex flex-col items-center justify-center ${t("bg-stone-950 text-stone-300", "bg-stone-50 text-stone-700")}`}>
          <p className="mb-4">User not found.</p>
          <button onClick={() => navigate("/chat")} className="text-amber-500 underline">
            Back to chats
          </button>
        </div>
      </ChatShell>
    );
  }

  const startChat = () => {
    // Find existing DM or create one (UI only — id will be conv-{userId})
    const existing = CONVERSATIONS.find((c) => !c.is_group && c.other_user_id === user.id);
    navigate(existing ? `/chat/${existing.id}` : `/chat/conv-${user.id}`);
  };

  const toggleContact = () =>
    setUser((u) => ({ ...u, is_contact: !u.is_contact }));
  const toggleBlock = () =>
    setUser((u) => ({ ...u, is_blocked: !u.is_blocked }));

  return (
    <ChatShell active="chats">
    <div className={`min-h-screen ${t("bg-stone-950 text-stone-100", "bg-stone-50 text-stone-900")}`}>
      <ChatTopBar
        title="Profile"
        right={
          <button
            onClick={() => setMenuOpen(true)}
            className={`p-2 rounded-lg cursor-pointer ${t(
              "text-stone-400 hover:bg-white/5",
              "text-stone-500 hover:bg-stone-100"
            )}`}
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        }
      />

      {/* Hero */}
      <div className={`flex flex-col items-center pt-6 pb-5 px-4 ${t("bg-stone-900/40", "bg-white")}`}>
        <Avatar initials={user.initials} color={user.color} size="xl" status={user.status} />
        <h2 className="mt-3 text-xl font-bold">{user.display_name}</h2>
        <p className={`text-sm mt-0.5 ${t("text-stone-400", "text-stone-500")}`}>
          @{user.username}
        </p>
        <p className={`text-xs mt-1 ${user.status === "online" ? "text-green-500" : t("text-stone-500", "text-stone-400")}`}>
          {user.status === "online" ? "online" : `last seen ${user.last_seen}`}
        </p>

        {/* Quick actions */}
        <div className="mt-5 grid grid-cols-3 gap-3 w-full max-w-xs">
          <QuickAction icon={MessageSquare} label="Message" onClick={startChat} />
          <QuickAction icon={Phone} label="Audio" onClick={() => comingSoon("Voice calls")} />
          <QuickAction icon={Video} label="Video" onClick={() => comingSoon("Video calls")} />
        </div>
      </div>

      {/* About */}
      <Section>
        <Field label="About" value={user.about || "—"} icon={Info} />
        <Field label="Username" value={`@${user.username}`} icon={AtSign} />
      </Section>

      {/* Media / Links / Docs */}
      <Section title="Media, links, docs">
        <Row icon={ImageIcon} label="Media" hint="0" onClick={() => comingSoon("Media gallery")} />
        <Row icon={LinkIcon} label="Links" hint="0" onClick={() => comingSoon("Shared links")} />
        <Row icon={FileText} label="Docs" hint="0" onClick={() => comingSoon("Shared docs")} />
      </Section>

      {/* Notifications */}
      <Section>
        <Row icon={Bell} label="Mute notifications" hint="Off" onClick={() => comingSoon("Mute settings")} />
        <Row icon={ImageIcon} label="Wallpaper & sound" onClick={() => comingSoon("Custom wallpapers")} />
      </Section>

      {/* Actions */}
      <Section>
        <ActionButton
          icon={user.is_contact ? UserMinus : UserPlus}
          label={user.is_contact ? "Remove from contacts" : "Add to contacts"}
          onClick={toggleContact}
        />
        <ActionButton
          icon={user.is_blocked ? ShieldCheck : ShieldOff}
          label={user.is_blocked ? `Unblock ${user.display_name}` : `Block ${user.display_name}`}
          danger={!user.is_blocked}
          onClick={toggleBlock}
        />
        <ActionButton
          icon={Flag}
          label={`Report ${user.display_name}`}
          danger
          onClick={() => comingSoon("Reporting")}
        />
      </Section>

      <div className="h-12" />

      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title={user.display_name}>
        <SheetItem icon={UserPlus} label={user.is_contact ? "Remove from contacts" : "Add to contacts"} onClick={() => { toggleContact(); setMenuOpen(false); }} />
        <SheetItem icon={ShieldOff} label={user.is_blocked ? "Unblock" : "Block"} danger onClick={() => { toggleBlock(); setMenuOpen(false); }} />
        <SheetItem icon={Flag} label="Report" danger onClick={() => setMenuOpen(false)} />
      </BottomSheet>
    </div>
    </ChatShell>
  );
};

const QuickAction = ({ icon: Icon, label, onClick }) => {
  const { t } = useTheme();
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl cursor-pointer transition-colors ${t(
        "bg-white/5 hover:bg-white/10",
        "bg-stone-100 hover:bg-stone-200"
      )}`}
    >
      <Icon className="w-5 h-5 text-amber-500" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
};

const Section = ({ title, children }) => {
  const { t } = useTheme();
  return (
    <div className={`mt-2 ${t("bg-stone-900/40", "bg-white")} divide-y ${t("divide-white/5", "divide-stone-100")}`}>
      {title && (
        <p className={`px-4 pt-3 pb-2 text-[11px] font-semibold uppercase tracking-wider ${t("text-stone-500", "text-stone-400")}`}>
          {title}
        </p>
      )}
      {children}
    </div>
  );
};

const Field = ({ icon: Icon, label, value }) => {
  const { t } = useTheme();
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      {Icon && <Icon className={`w-4.5 h-4.5 mt-0.5 ${t("text-stone-400", "text-stone-500")}`} />}
      <div className="min-w-0">
        <p className={`text-[11px] uppercase tracking-wider ${t("text-stone-500", "text-stone-400")}`}>
          {label}
        </p>
        <p className={`text-sm mt-0.5 ${t("text-stone-100", "text-stone-900")}`}>
          {value}
        </p>
      </div>
    </div>
  );
};

const Row = ({ icon: Icon, label, hint, onClick }) => {
  const { t } = useTheme();
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${t(
        "hover:bg-white/5",
        "hover:bg-stone-50"
      )}`}
    >
      <Icon className={`w-4.5 h-4.5 ${t("text-stone-400", "text-stone-500")}`} />
      <span className="flex-1 text-left text-sm">{label}</span>
      {hint && (
        <span className={`text-xs ${t("text-stone-500", "text-stone-400")}`}>{hint}</span>
      )}
      <ChevronRight className={`w-4 h-4 ${t("text-stone-600", "text-stone-300")}`} />
    </button>
  );
};

const ActionButton = ({ icon: Icon, label, danger, onClick }) => {
  const { t } = useTheme();
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm cursor-pointer transition-colors ${
        danger
          ? t("text-red-400 hover:bg-red-500/10", "text-red-600 hover:bg-red-50")
          : t("text-stone-200 hover:bg-white/5", "text-stone-700 hover:bg-stone-50")
      }`}
    >
      <Icon className="w-4.5 h-4.5" />
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
};

export default UserProfile;

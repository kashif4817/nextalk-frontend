import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  UserPlus,
  UserMinus,
  ShieldOff,
  ShieldCheck,
  Flag,
  Bell,
  Image as ImageIcon,
  Link as LinkIcon,
  FileText,
  ChevronRight,
  AtSign,
  Info,
  Phone,
  Video,
  MoreVertical,
  Pencil,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { getUserProfile } from "../../api/users/user";
import { getContacts, addContact, updateContact, removeContact } from "../../api/contacts/contact";
import { getBlockedUsers, blockUser, unblockUser } from "../../api/blocks/block";
import { createOrGetDM } from "../../api/conversations/conversation";
import { useUser } from "../../context/UserContext";
import { normalizeUser, normalizeContact, normalizeBlockedUser } from "../../utils/formatters";
import Avatar from "../../components/chat/Avatar";
import ChatTopBar from "../../components/chat/ChatTopBar";
import ChatShell from "../../components/chat/ChatShell";
import BottomSheet, { SheetItem } from "../../components/chat/BottomSheet";
import { comingSoon } from "../../utils/toast";

const UserProfile = () => {
  const { t } = useTheme();
  const { user } = useUser();
  const { id } = useParams();
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const nicknameInputRef = useRef(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [showContactSheet, setShowContactSheet] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState("");

  const results = useQueries({
    queries: [
      {
        queryKey: ["profile", id],
        queryFn: async () => {
          const res = await getUserProfile(id);
          return normalizeUser(res.data.data);
        },
        enabled: !!id,
      },
      {
        queryKey: ["contacts", user?.id],
        queryFn: async () => {
          const res = await getContacts();
          return (res.data.data || []).map(normalizeContact).filter(Boolean);
        },
        enabled: !!user,
      },
      {
        queryKey: ["blocks"],
        queryFn: async () => {
          const res = await getBlockedUsers();
          return (res.data.data || []).map(normalizeBlockedUser).filter(Boolean);
        },
      },
    ],
  });
  const [profileQ, contactsQ, blocksQ] = results;

  const profile = profileQ.data || null;
  const contacts = contactsQ.data || [];
  const blocks = blocksQ.data || [];

  const loading = profileQ.isLoading || contactsQ.isLoading || blocksQ.isLoading;
  const notFound = profileQ.isError || (profileQ.isFetched && !profile);

  const contactRow = contacts.find(c => c.id === id);
  const isContact = !!contactRow;
  const contactNickname = contactRow?.nickname || "";

  const blockRow = blocks.find(b => b.id === id);
  const isBlocked = !!blockRow;
  const blockRowId = blockRow?.block_row_id || null;

  const startChat = async () => {
    try {
      const res = await createOrGetDM(id);
      navigate(`/chat/${res.data.data.id}`);
    } catch {
      navigate("/chat");
    }
  };

  const openContactSheet = () => {
    setNicknameDraft(contactNickname || profile?.display_name || "");
    setShowContactSheet(true);
    // Focus the input after sheet opens
    setTimeout(() => nicknameInputRef.current?.focus(), 80);
  };

  const saveContact = async () => {
    const name = nicknameDraft.trim();
    try {
      if (isContact) {
        await updateContact(id, name || null);
      } else {
        await addContact(id, name || null);
      }
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setShowContactSheet(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveContact = async () => {
    try {
      await removeContact(id);
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    } catch (e) {
      console.error(e);
    }
  };

  const toggleBlock = async () => {
    try {
      if (isBlocked) {
        await unblockUser(blockRowId);
      } else {
        await blockUser(id);
      }
      queryClient.invalidateQueries({ queryKey: ["blocks"] });
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <ChatShell active="chats">
        <div className={`min-h-screen flex items-center justify-center ${t("bg-stone-950", "bg-stone-50")}`}>
          <div className="w-6 h-6 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
        </div>
      </ChatShell>
    );
  }

  if (notFound || !profile) {
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

      <div className={`flex flex-col items-center pt-6 pb-5 px-4 ${t("bg-stone-900/40", "bg-white")}`}>
        <Avatar src={profile.avatar_url} initials={profile.initials} color={profile.color} size="xl" status={profile.status} />
        <h2 className="mt-3 text-xl font-bold">{profile.display_name}</h2>
        <p className={`text-sm mt-0.5 ${t("text-stone-400", "text-stone-500")}`}>
          @{profile.username}
        </p>
        <p className={`text-xs mt-1 ${profile.status === "online" ? "text-green-500" : t("text-stone-500", "text-stone-400")}`}>
          {profile.status === "online" ? "online" : profile.last_seen ? `last seen ${profile.last_seen}` : "offline"}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-3 w-full max-w-xs">
          <QuickAction icon={MessageSquare} label="Message" onClick={startChat} />
          <QuickAction icon={Phone} label="Audio" onClick={() => comingSoon("Voice calls")} />
          <QuickAction icon={Video} label="Video" onClick={() => comingSoon("Video calls")} />
        </div>
      </div>

      <Section>
        {isContact && contactNickname && (
          <Field label="Contact name" value={contactNickname} icon={UserPlus} />
        )}
        <Field label="About" value={profile.about || "—"} icon={Info} />
        <Field label="Username" value={`@${profile.username}`} icon={AtSign} />
      </Section>

      <Section title="Media, links, docs">
        <Row icon={ImageIcon} label="Media" hint="0" onClick={() => comingSoon("Media gallery")} />
        <Row icon={LinkIcon} label="Links" hint="0" onClick={() => comingSoon("Shared links")} />
        <Row icon={FileText} label="Docs" hint="0" onClick={() => comingSoon("Shared docs")} />
      </Section>

      <Section>
        <Row icon={Bell} label="Mute notifications" hint="Off" onClick={() => comingSoon("Mute settings")} />
        <Row icon={ImageIcon} label="Wallpaper & sound" onClick={() => comingSoon("Custom wallpapers")} />
      </Section>

      <Section>
        {isContact ? (
          <>
            <ActionButton icon={Pencil} label="Edit contact name" onClick={openContactSheet} />
            <ActionButton icon={UserMinus} label="Remove from contacts" danger onClick={handleRemoveContact} />
          </>
        ) : (
          <ActionButton icon={UserPlus} label="Add to contacts" onClick={openContactSheet} />
        )}
        <ActionButton
          icon={isBlocked ? ShieldCheck : ShieldOff}
          label={isBlocked ? `Unblock ${contactNickname || profile.display_name}` : `Block ${contactNickname || profile.display_name}`}
          danger={!isBlocked}
          onClick={toggleBlock}
        />
        <ActionButton
          icon={Flag}
          label={`Report ${contactNickname || profile.display_name}`}
          danger
          onClick={() => comingSoon("Reporting")}
        />
      </Section>

      <div className="h-12" />

      {/* 3-dot menu */}
      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title={profile.display_name}>
        {isContact ? (
          <>
            <SheetItem icon={Pencil} label="Edit contact name" onClick={() => { setMenuOpen(false); openContactSheet(); }} />
            <SheetItem icon={UserMinus} label="Remove from contacts" danger onClick={() => { setMenuOpen(false); handleRemoveContact(); }} />
          </>
        ) : (
          <SheetItem icon={UserPlus} label="Add to contacts" onClick={() => { setMenuOpen(false); openContactSheet(); }} />
        )}
        <SheetItem icon={ShieldOff} label={isBlocked ? "Unblock" : "Block"} danger onClick={() => { toggleBlock(); setMenuOpen(false); }} />
        <SheetItem icon={Flag} label="Report" danger onClick={() => setMenuOpen(false)} />
      </BottomSheet>

      {/* Add / edit contact name sheet */}
      <BottomSheet
        open={showContactSheet}
        onClose={() => setShowContactSheet(false)}
        title={isContact ? "Edit contact name" : "Add to contacts"}
      >
        <div className="px-5 py-3 space-y-3">
          <p className={`text-xs ${t("text-stone-400", "text-stone-500")}`}>
            This name is only visible to you.
          </p>
          <input
            ref={nicknameInputRef}
            value={nicknameDraft}
            onChange={(e) => setNicknameDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveContact()}
            placeholder="Contact name"
            className={`w-full px-3 py-2.5 rounded-xl text-sm outline-none border transition-colors ${t(
              "bg-stone-800 border-white/10 text-stone-100 placeholder-stone-500 focus:border-amber-500/50",
              "bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400 focus:border-amber-400"
            )}`}
          />
          <button
            onClick={saveContact}
            disabled={!nicknameDraft.trim()}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-opacity"
          >
            {isContact ? "Save changes" : "Add contact"}
          </button>
        </div>
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

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AtSign,
  Check,
  ChevronDown,
  Copy,
  FileText,
  Loader2,
  Mail,
  User,
  X,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";
import ChatTopBar from "../../components/chat/ChatTopBar";
import ChatShell from "../../components/chat/ChatShell";
import { FormSkeleton } from "../../components/chat/Skeleton";
import Avatar from "../../components/chat/Avatar";
import supabase from "../../utils/supabaseClient";
import { showError, showSuccess } from "../../utils/toast";
import {
  ABOUT_MAX,
  DISPLAY_NAME_MAX,
  GENDER_OPTIONS,
  buildProfilePayload,
  describeProfileError,
  getInitials,
  gradientForId,
  resolveDisplayName,
} from "../../utils/profile";

/** What's currently in the database — the baseline for "has anything changed?" */
const savedFrom = (profile) => ({
  username: profile?.username ?? "",
  displayName: profile?.display_name ?? "",
  about: profile?.about ?? "",
  gender: profile?.gender ?? "not_selected",
});

// ─── Shared field styling ───────────────────────────────────────────────────
const fieldStyles = (t) => ({
  inputClass: `w-full pl-11 pr-4 py-3 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 ${t(
    "bg-stone-900/60 border-white/10 text-stone-100 placeholder:text-stone-500",
    "bg-white border-stone-200 text-stone-900 placeholder:text-stone-400"
  )}`,
  labelClass: `block text-sm font-medium mb-1.5 ${t(
    "text-stone-300",
    "text-stone-700"
  )}`,
  iconClass: `absolute left-3.5 w-5 h-5 ${t("text-stone-500", "text-stone-400")}`,
  hintClass: `mt-1 text-[11px] ${t("text-stone-500", "text-stone-400")}`,
});

// ─── Read-only, click-to-copy field ─────────────────────────────────────────
const CopyField = ({ id, label, icon: Icon, value, copyLabel, emptyText, hint }) => {
  const { t } = useTheme();
  const { inputClass, labelClass, iconClass, hintClass } = fieldStyles(t);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      showSuccess(`${copyLabel} copied`);
    } catch {
      showError(`Couldn't copy ${copyLabel.toLowerCase()}`);
    }
  };

  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      <div className="relative flex items-center">
        <Icon className={`${iconClass} pointer-events-none`} />
        <button
          id={id}
          type="button"
          onClick={handleCopy}
          disabled={!value}
          title={value ? `Copy ${copyLabel.toLowerCase()}` : undefined}
          className={`${inputClass} pr-11 text-left truncate cursor-pointer hover:border-amber-400/60 disabled:cursor-default`}
        >
          {value || (
            <span className={t("text-stone-500", "text-stone-400")}>
              {emptyText}
            </span>
          )}
        </button>
        {value && (
          <span className="absolute right-3.5 flex items-center pointer-events-none">
            {copied ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className={`w-4 h-4 ${t("text-stone-500", "text-stone-400")}`} />
            )}
          </span>
        )}
      </div>
      <p className={hintClass}>{hint}</p>
    </div>
  );
};

// ─── Form ───────────────────────────────────────────────────────────────────
// Mounted with a key of the user id, so initial state can come straight from
// useState initialisers — no hydrating effect, no cascading render.
const ProfileForm = ({ user, profile }) => {
  const { t } = useTheme();
  const navigate = useNavigate();
  const { refreshProfile } = useUser();

  const [saved, setSaved] = useState(() => savedFrom(profile));
  const [form, setForm] = useState(() => {
    const meta = user?.user_metadata ?? {};
    return {
      ...savedFrom(profile),
      // Pre-fill a name from the OAuth provider when there isn't one yet. It
      // counts as an unsaved change, which is why `saved` doesn't get it.
      displayName:
        profile?.display_name ?? meta.full_name ?? meta.name ?? "",
    };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (error) setError("");
  };

  const dirty = useMemo(
    () =>
      form.displayName.trim() !== saved.displayName.trim() ||
      form.about.trim() !== saved.about.trim() ||
      form.gender !== saved.gender,
    [form, saved]
  );

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user?.id || saving) return;

    // Username is chosen once during setup and is read-only here.
    if (!saved.username) {
      setError("Finish setting up your profile (pick a username) before saving.");
      return;
    }

    setSaving(true);
    setError("");

    const payload = buildProfilePayload({
      id: user.id,
      username: saved.username,
      displayName: form.displayName,
      about: form.about,
      gender: form.gender,
    });

    const { error: saveError } = await supabase
      .from("profiles")
      .upsert(payload);

    setSaving(false);

    if (saveError) {
      const described = describeProfileError(saveError);
      setError(described);
      showError(described);
      return;
    }

    setSaved({
      username: payload.username,
      displayName: payload.display_name ?? "",
      about: payload.about ?? "",
      gender: payload.gender,
    });
    refreshProfile();
    showSuccess("Profile updated");
  };

  const handleDiscard = () => {
    setForm({ ...saved });
    setError("");
  };

  const { inputClass, labelClass, iconClass, hintClass } = fieldStyles(t);

  const previewName = resolveDisplayName(
    { display_name: form.displayName, username: saved.username },
    user
  );
  const canSave = dirty && !saving;

  return (
    <div
      className={`min-h-screen ${t(
        "bg-stone-950 text-stone-100",
        "bg-stone-50 text-stone-900"
      )}`}
    >
      <ChatTopBar
        title="Profile"
        subtitle={dirty ? "Unsaved changes" : "Your NexTalk identity"}
      />

      {/* ── Header preview ── */}
      <div
        className={`flex flex-col items-center gap-3 px-4 py-7 border-b ${t(
          "bg-stone-900/40 border-white/5",
          "bg-white border-stone-200"
        )}`}
      >
        <Avatar
          initials={getInitials(previewName)}
          color={gradientForId(user?.id)}
          size="xl"
        />
        <div className="text-center min-w-0 max-w-full">
          <p className="text-lg font-semibold truncate">{previewName}</p>
          <p className={`text-sm truncate ${t("text-stone-400", "text-stone-500")}`}>
            {saved.username ? `@${saved.username}` : "No username yet"}
          </p>
        </div>
      </div>

      {/* ── Form ── */}
      <div className="px-4 py-6 max-w-xl mx-auto w-full space-y-5 pb-10">
        {/* Display name */}
        <div>
          <label className={labelClass} htmlFor="displayName">
            Display name
          </label>
          <div className="relative flex items-center">
            <User className={iconClass} />
            <input
              id="displayName"
              type="text"
              value={form.displayName}
              maxLength={DISPLAY_NAME_MAX}
              onChange={(e) => set("displayName")(e.target.value)}
              placeholder="How should we call you?"
              className={inputClass}
            />
          </div>
          <p className={hintClass}>This is the name other people see.</p>
        </div>

        {/* Username — chosen once during setup, read-only here */}
        <CopyField
          id="username"
          label="Username"
          icon={AtSign}
          value={saved.username}
          copyLabel="Username"
          emptyText="No username yet"
          hint="Your username can't be changed. Click to copy it."
        />

        {/* About */}
        <div>
          <label className={labelClass} htmlFor="about">
            About
          </label>
          <div className="relative flex">
            <FileText className={`${iconClass} top-3.5`} />
            <textarea
              id="about"
              rows={3}
              value={form.about}
              maxLength={ABOUT_MAX}
              onChange={(e) => set("about")(e.target.value)}
              placeholder="A short bio about yourself..."
              className={`${inputClass} resize-none`}
            />
            <span
              className={`absolute bottom-2.5 right-3 text-[10px] select-none ${t(
                "text-stone-600",
                "text-stone-300"
              )}`}
            >
              {form.about.length}/{ABOUT_MAX}
            </span>
          </div>
        </div>

        {/* Gender */}
        <div>
          <label className={labelClass} htmlFor="gender">
            Gender
          </label>
          <div className="relative flex items-center">
            <User className={`${iconClass} pointer-events-none`} />
            <select
              id="gender"
              value={form.gender}
              onChange={(e) => set("gender")(e.target.value)}
              className={`${inputClass} appearance-none pr-10 cursor-pointer`}
            >
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className={`${iconClass} left-auto right-3.5 pointer-events-none`}
            />
          </div>
        </div>

        {/* Email — owned by the OAuth provider, so read-only here */}
        <CopyField
          id="email"
          label="Email"
          icon={Mail}
          value={user?.email ?? ""}
          copyLabel="Email"
          emptyText="No email on this account"
          hint="Comes from the account you signed in with. Click to copy it."
        />

        {error && (
          <div
            role="alert"
            className={`flex items-start gap-2.5 p-3.5 rounded-xl border ${t(
              "bg-red-500/10 border-red-500/20",
              "bg-red-50 border-red-100"
            )}`}
          >
            <X className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-500 leading-relaxed">{error}</p>
          </div>
        )}
      </div>

      {/* ── Sticky action bar ── */}
      <div
        className={`sticky bottom-0 border-t backdrop-blur-xl px-4 py-3 ${t(
          "bg-stone-950/85 border-white/5",
          "bg-white/90 border-stone-200"
        )}`}
      >
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <button
            onClick={dirty ? handleDiscard : () => navigate("/chat/settings")}
            disabled={saving}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${t(
              "text-stone-300 hover:bg-white/5",
              "text-stone-600 hover:bg-stone-100"
            )}`}
          >
            {dirty ? "Discard" : "Back"}
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-semibold shadow-lg shadow-amber-500/20 transition-all duration-200 cursor-pointer hover:from-amber-600 hover:to-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {dirty ? "Save changes" : "Saved"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Route entry ────────────────────────────────────────────────────────────
const EditProfile = () => {
  const { t } = useTheme();
  const { user, profile, profileLoading } = useUser();

  return (
    <ChatShell active="settings">
      {profileLoading ? (
        <div className={`min-h-screen ${t("bg-stone-950 text-stone-100", "bg-stone-50 text-stone-900")}`}>
          <ChatTopBar title="Profile" subtitle="Your NexTalk identity" />
          <FormSkeleton />
        </div>
      ) : (
        <ProfileForm key={user?.id ?? "anon"} user={user} profile={profile} />
      )}
    </ChatShell>
  );
};

export default EditProfile;

// Shared profile rules — used by both the first-run setup (/complete-profile)
// and the editor (/chat/settings/profile) so the two can never disagree about
// what a valid profile looks like.

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const ABOUT_MAX = 160;
export const DISPLAY_NAME_MAX = 50;

export const GENDER_OPTIONS = [
  { value: "not_selected", label: "Select gender" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export const genderLabel = (value) =>
  GENDER_OPTIONS.find((g) => g.value === value)?.label ?? "Not set";

/** Usernames are stored lowercase so uniqueness is case-insensitive. */
export const normalizeUsername = (value) => (value ?? "").trim().toLowerCase();

/** Returns an error string, or null when the username is acceptable. */
export const validateUsername = (value) => {
  const u = (value ?? "").trim();
  if (!u) return "Username is required.";
  if (u.length < USERNAME_MIN)
    return `Username must be at least ${USERNAME_MIN} characters.`;
  if (u.length > USERNAME_MAX)
    return `Username must be ${USERNAME_MAX} characters or fewer.`;
  if (!/^[a-zA-Z0-9_.]+$/.test(u))
    return "Username can only contain letters, numbers, dots and underscores.";
  if (/^[._]|[._]$/.test(u))
    return "Username can't start or end with a dot or underscore.";
  if (/[._]{2}/.test(u))
    return "Username can't contain two dots or underscores in a row.";
  return null;
};

export const getInitials = (name) => {
  if (!name?.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
};

// Avatar gradients, matched to the palette already used across the chat UI.
const AVATAR_GRADIENTS = [
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-sky-400 to-blue-500",
  "from-violet-400 to-purple-500",
  "from-rose-400 to-pink-500",
  "from-cyan-400 to-sky-500",
];

/** Stable per-user colour, so an avatar never changes between renders. */
export const gradientForId = (id) => {
  if (!id) return AVATAR_GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
};

/**
 * Best display name for a profile, falling back through OAuth metadata and
 * finally the email local-part, so the UI never renders an empty name.
 */
export const resolveDisplayName = (profile, user) =>
  profile?.display_name?.trim() ||
  profile?.username ||
  user?.user_metadata?.full_name ||
  user?.user_metadata?.name ||
  user?.email?.split("@")[0] ||
  "You";

/** The exact column set the app writes. Keep in sync with the profiles table. */
export const buildProfilePayload = ({
  id,
  username,
  displayName,
  about,
  gender,
}) => ({
  id,
  username: normalizeUsername(username),
  display_name: displayName?.trim() || null,
  about: about?.trim() || null,
  gender: gender || "not_selected",
});

/** Turns a Postgres/PostgREST error into something worth showing a user. */
export const describeProfileError = (error) => {
  if (!error) return "";
  if (error.code === "23505" || /unique/i.test(error.message ?? ""))
    return "That username is already taken. Try another one.";
  if (error.code === "23514")
    return "Those details don't pass the database's validation rules.";
  if (error.code === "42501")
    return "You don't have permission to save this profile. Check the table's RLS policies.";
  return error.message || "Something went wrong while saving.";
};

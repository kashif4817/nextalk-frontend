// Maps API payloads onto the view shape the chat UI already expects.
// Keeping this in one place means the components stay as written and the
// mapping is reviewable in isolation.

import { colorOf, initialsOf } from "./avatar";
import { describeFile, parseFileType } from "./attachments";

/** Short clock label for today, otherwise a date. */
export const timeLabel = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const TYPE_LABELS = {
  image: "Photo",
  video: "Video",
  audio: "Voice message",
  document: "Document",
  sticker: "Sticker",
  gif: "GIF",
  location: "Location",
  contact: "Contact",
};

/** One-line chat-list preview of a message row ("Voice message", not "[audio]"). */
export const previewText = (msg) => {
  if (!msg) return "";
  const fileName = parseFileType(msg.file_type).name;
  // A shared audio file carries its name; a recorded voice note never does.
  if (msg.message_type === "audio") return fileName ? "Audio" : TYPE_LABELS.audio;
  // WhatsApp lists a document by its file name.
  if (msg.message_type === "document") return fileName || msg.content || TYPE_LABELS.document;
  return msg.content || TYPE_LABELS[msg.message_type] || "";
};

/** A profile row -> the shape Avatar and the people lists want. */
export const toUserView = (profile) => {
  if (!profile) return null;
  const name = profile.display_name || profile.username || "Unknown";
  return {
    id: profile.id,
    username: profile.username,
    display_name: name,
    avatar_url: profile.avatar_url ?? null,
    about: profile.about ?? null,
    initials: initialsOf(name),
    color: colorOf(profile.id),
    is_online: Boolean(profile.is_online),
    status: profile.is_online ? "online" : "offline",
    last_seen: profile.last_seen ?? null,
  };
};

/**
 * Apply a `presence:update` socket event ({ userId, is_online, last_seen }) to
 * a conversation view. Returns the same object when that user isn't in it.
 */
export const applyPresence = (conv, { userId, is_online, last_seen }) => {
  if (!conv?.members?.some((m) => m.id === userId)) return conv;

  const update = (u) =>
    u?.id === userId
      ? {
          ...u,
          is_online,
          status: is_online ? "online" : "offline",
          // Coming online sends no last_seen; keep the previous one.
          last_seen: last_seen ?? u.last_seen,
        }
      : u;

  const other = update(conv.other);
  return {
    ...conv,
    members: conv.members.map(update),
    other,
    status: conv.is_group ? conv.status : other?.status ?? conv.status,
  };
};

/**
 * A `conversation_members` row (with its nested conversation) -> a chat-list row.
 * @param row  one entry from GET /conversations
 * @param meId the signed-in user's id
 */
export const toConversationView = (row, meId) => {
  const c = row?.conversation;
  if (!c) return null;

  const members = (c.members || [])
    .map((m) => toUserView(m.profile))
    .filter(Boolean);

  const other = c.is_group ? null : members.find((m) => m.id !== meId) || null;

  const title = c.is_group
    ? c.group_name || "Group"
    : other?.display_name || "Unknown";

  const last = c.last_message;

  return {
    id: c.id,
    membership_id: row.id,
    is_group: Boolean(c.is_group),
    title,
    other_user_id: other?.id ?? null,
    other,
    members,
    members_count: members.length,
    role: row.role ?? null,

    // Avatar bits, resolved here so rows need no extra lookup.
    initials: c.is_group ? initialsOf(title) : other?.initials ?? "?",
    color: c.is_group ? colorOf(c.id) : other?.color,
    status: c.is_group ? null : other?.status ?? null,
    avatar_url: c.is_group ? c.group_avatar ?? null : other?.avatar_url ?? null,

    last_message: last
      ? {
          id: last.id,
          text: previewText(last),
          sender_id: last.sender_id,
          type: last.message_type,
          time: timeLabel(last.created_at),
        }
      : null,

    unread_count: row.unread_count ?? 0,
    is_pinned: Boolean(row.is_pinned),
    is_archived: Boolean(row.is_archived),
    // muted_until is a timestamp; "muted" means it is still in the future.
    is_muted: Boolean(row.muted_until && new Date(row.muted_until) > new Date()),
    muted_until: row.muted_until ?? null,
    last_read_at: row.last_read_at ?? null,
    last_message_at: c.last_message_at || c.created_at,
    group_description: c.group_description ?? null,
  };
};

/**
 * A message row -> a bubble.
 *
 * `sender_id` is deliberately rewritten to the literal "me" for your own
 * messages, because that is what the thread UI compares against. The real id
 * stays available as `author_id`.
 */
export const toMessageView = (msg, meId) => {
  if (!msg) return null;
  const mine = msg.sender_id === meId;

  // Collapse per-user reaction rows into one entry per emoji.
  const byEmoji = new Map();
  for (const r of msg.reactions || []) {
    const entry = byEmoji.get(r.emoji) || { emoji: r.emoji, count: 0, by_me: false };
    entry.count += 1;
    if (r.user_id === meId) entry.by_me = true;
    byEmoji.set(r.emoji, entry);
  }

  const seen = msg.seen_by || [];

  return {
    id: msg.id,
    sender_id: mine ? "me" : msg.sender_id,
    author_id: msg.sender_id,
    is_mine: mine,
    sender: toUserView(msg.sender),
    text: msg.content ?? "",
    message_type: msg.message_type || "text",
    file_url: msg.file_url ?? null,
    file_type: msg.file_type ?? null,
    time: timeLabel(msg.created_at),
    created_at: msg.created_at,
    edited_at: msg.edited_at ?? null,
    pinned: Boolean(msg.is_pinned),
    starred: Boolean(msg.starred),
    reactions: [...byEmoji.values()],
    // Only meaningful on your own messages.
    status: mine ? (seen.length > 0 ? "read" : "sent") : undefined,
    seen_by: seen,
    reply_to: msg.reply_to
      ? {
          id: msg.reply_to.id,
          text: msg.reply_to.content ?? "",
          sender_id: msg.reply_to.sender_id,
          sender:
            msg.reply_to.sender_id === meId
              ? "You"
              : toUserView(msg.sender)?.display_name ?? "Unknown",
        }
      : null,
    // Voice notes render their own player, not a file card. Name, size and
    // dimensions ride along as MIME parameters on file_type (lib/attachments).
    attachment:
      msg.file_url && msg.message_type !== "audio"
        ? { ...describeFile(msg.file_url, msg.file_type), type: msg.message_type, url: msg.file_url }
        : null,
    // Set for a shared audio file (shown above its player), null for voice notes.
    audio_name:
      msg.message_type === "audio" ? parseFileType(msg.file_type).name ?? null : null,
  };
};

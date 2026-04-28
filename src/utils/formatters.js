const COLORS = [
  "from-rose-400 to-pink-500",
  "from-violet-400 to-purple-500",
  "from-blue-400 to-indigo-500",
  "from-sky-400 to-cyan-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-400",
  "from-fuchsia-400 to-pink-500",
  "from-lime-400 to-green-500",
]

export function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "?"
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function getColor(seed = "") {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + (hash << 5) - hash
  return COLORS[Math.abs(hash) % COLORS.length]
}

export function formatTime(timestamp) {
  if (!timestamp) return ""
  const date = new Date(timestamp)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((today - msgDate) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: "short" })
  return date.toLocaleDateString([], { month: "short", day: "numeric" })
}

export function normalizeUser(u) {
  if (!u) return null
  return {
    ...u,
    initials: getInitials(u.display_name || u.username || ""),
    color: getColor(u.id || u.username || ""),
    status: u.is_online ? "online" : "offline",
  }
}

export function normalizeConversation(row, myId) {
  const conv = row.conversation
  if (!conv) return null
  const activeMembers = (conv.members || []).filter(m => !m.left_at && !m.removed_at)
  const other = activeMembers.find(m => m.profile?.id !== myId)?.profile
  const isMuted = !!row.muted_until && new Date(row.muted_until) > new Date()
  return {
    id: conv.id,
    member_row_id: row.id,
    is_group: conv.is_group,
    title: conv.is_group ? (conv.group_name || "Unnamed group") : (other?.display_name || "Unknown"),
    other_user_id: other?.id,
    avatar_url: conv.is_group ? conv.group_avatar : other?.avatar_url,
    initials: conv.is_group ? getInitials(conv.group_name || "") : getInitials(other?.display_name || ""),
    color: getColor(conv.is_group ? conv.id : (other?.id || conv.id)),
    status: !conv.is_group ? (other?.is_online ? "online" : "offline") : null,
    last_seen: other?.last_seen,
    last_message: conv.last_message
      ? { text: conv.last_message.content, time: formatTime(conv.last_message.created_at) }
      : null,
    last_message_at: conv.last_message_at,
    unread_count: row.unread_count || 0,
    is_pinned: row.is_pinned,
    is_muted: isMuted,
    is_archived: row.is_archived,
    members_count: activeMembers.length,
    group_description: conv.group_description,
    members: activeMembers.map(m => ({
      ...m.profile,
      initials: getInitials(m.profile?.display_name || ""),
      color: getColor(m.profile?.id || ""),
      status: m.profile?.is_online ? "online" : "offline",
    })),
  }
}

export function normalizeConversationDetail(conv, myId) {
  if (!conv) return null
  const activeMembers = conv.members || []
  const other = activeMembers.find(m => m.profile?.id !== myId)?.profile
  return {
    id: conv.id,
    is_group: conv.is_group,
    title: conv.is_group ? (conv.group_name || "Unnamed group") : (other?.display_name || "Unknown"),
    other_user_id: other?.id,
    avatar_url: conv.is_group ? conv.group_avatar : other?.avatar_url,
    initials: conv.is_group ? getInitials(conv.group_name || "") : getInitials(other?.display_name || ""),
    color: getColor(conv.is_group ? conv.id : (other?.id || conv.id)),
    status: !conv.is_group ? (other?.is_online ? "online" : "offline") : null,
    last_seen: other?.last_seen,
    members_count: activeMembers.length,
    is_muted: false,
    group_description: conv.group_description,
    members: activeMembers.map(m => ({
      ...m.profile,
      role: m.role,
      initials: getInitials(m.profile?.display_name || ""),
      color: getColor(m.profile?.id || ""),
      status: m.profile?.is_online ? "online" : "offline",
    })),
  }
}

export function normalizeMessage(msg, myId) {
  if (!msg) return null
  return {
    ...msg,
    text: msg.content,
    time: formatTime(msg.created_at),
    status: (msg.seen_by?.length > 0) ? "read" : "sent",
    sender: msg.sender ? normalizeUser(msg.sender) : null,
    reactions: (msg.reactions || []).reduce((acc, r) => {
      const ex = acc.find(x => x.emoji === r.emoji)
      if (ex) { ex.count++; if (r.user_id === myId) ex.by_me = true }
      else acc.push({ emoji: r.emoji, count: 1, by_me: r.user_id === myId })
      return acc
    }, []),
    reply_to: msg.reply_to ? {
      id: msg.reply_to.id,
      text: msg.reply_to.content,
      message_type: msg.reply_to.message_type || "text",
      file_url: msg.reply_to.file_url || null,
      sender_id: msg.reply_to.sender_id,
      sender_name: msg.reply_to.sender_id === myId ? "You" : (msg.reply_to.sender?.display_name || null),
    } : null,
  }
}

export function normalizeContact(c) {
  if (!c) return null
  return {
    ...c.contact,
    initials: getInitials(c.contact?.display_name || ""),
    color: getColor(c.contact?.id || ""),
    status: c.contact?.is_online ? "online" : "offline",
    nickname: c.nickname,
    contact_row_id: c.id,
  }
}

export function normalizeBlockedUser(b) {
  if (!b) return null
  return {
    ...b.blocked,
    block_row_id: b.id,
    initials: getInitials(b.blocked?.display_name || ""),
    color: getColor(b.blocked?.id || ""),
  }
}

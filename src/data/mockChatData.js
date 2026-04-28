// Mock data for NexTalk chat UI
// Mirrors the v1.0 schema shape so swapping in real API later is mechanical.

export const ME = {
  id: "me",
  username: "you",
  display_name: "You",
  avatar_url: null,
  about: "Building NexTalk 🚀",
  initials: "Y",
  color: "from-amber-400 to-orange-400",
  last_seen_privacy: "everyone",
  profile_photo_privacy: "everyone",
  about_privacy: "everyone",
  read_receipts_privacy: "everyone",
};

// All registered NexTalk users (for discovery/search)
export const ALL_USERS = [
  { id: "sarah", username: "sarahc", display_name: "Sarah Chen", initials: "SC", color: "from-emerald-400 to-teal-500", status: "online", about: "Product designer · Coffee enthusiast", last_seen: "online", is_contact: true, is_blocked: false },
  { id: "alex", username: "alexr", display_name: "Alex Rivera", initials: "AR", color: "from-blue-400 to-indigo-500", status: "online", about: "Senior Designer @ Layer", last_seen: "online", is_contact: true, is_blocked: false },
  { id: "priya", username: "priyas", display_name: "Priya Sharma", initials: "PS", color: "from-purple-400 to-violet-500", status: "away", about: "Frontend engineer 🌸", last_seen: "9:48 AM", is_contact: true, is_blocked: false },
  { id: "marcus", username: "marcusl", display_name: "Marcus Lee", initials: "ML", color: "from-rose-400 to-pink-500", status: "offline", about: "Backend dev · Coffee → Code", last_seen: "Yesterday at 11:42 PM", is_contact: true, is_blocked: false },
  { id: "yuki", username: "yukit", display_name: "Yuki Tanaka", initials: "YT", color: "from-amber-400 to-orange-400", status: "online", about: "DevRel · Tokyo", last_seen: "online", is_contact: false, is_blocked: false },
  { id: "emma", username: "emmat", display_name: "Emma Thompson", initials: "ET", color: "from-rose-400 to-pink-500", status: "online", about: "Product Designer at Figma", last_seen: "online", is_contact: false, is_blocked: false },
  { id: "david", username: "dkim", display_name: "David Kim", initials: "DK", color: "from-blue-400 to-cyan-500", status: "online", about: "Senior Engineer at Stripe", last_seen: "online", is_contact: false, is_blocked: false },
  { id: "olivia", username: "oliviap", display_name: "Olivia Park", initials: "OP", color: "from-emerald-400 to-green-500", status: "away", about: "Product Manager at Linear", last_seen: "12 min ago", is_contact: false, is_blocked: false },
  { id: "jamal", username: "jamalc", display_name: "Jamal Carter", initials: "JC", color: "from-amber-400 to-yellow-500", status: "offline", about: "Developer Advocate", last_seen: "2 hours ago", is_contact: false, is_blocked: false },
  { id: "lin", username: "linwei", display_name: "Lin Wei", initials: "LW", color: "from-indigo-400 to-purple-500", status: "online", about: "Researcher at Meta", last_seen: "online", is_contact: false, is_blocked: false },
  { id: "sofia", username: "sofiar", display_name: "Sofia Russo", initials: "SR", color: "from-fuchsia-400 to-pink-500", status: "offline", about: "Writer at Vercel", last_seen: "Yesterday", is_contact: false, is_blocked: false },
  { id: "noah", username: "noahb", display_name: "Noah Bennett", initials: "NB", color: "from-teal-400 to-cyan-500", status: "online", about: "Founder at Layer", last_seen: "online", is_contact: false, is_blocked: false },
];

// Conversations (DMs + groups unified — mirrors schema)
export const CONVERSATIONS = [
  {
    id: "conv-sarah",
    is_group: false,
    other_user_id: "sarah",
    title: "Sarah Chen",
    last_message: { text: "These look incredible! Love the hero section.", sender_id: "sarah", time: "10:26 AM", type: "text" },
    unread_count: 2,
    is_pinned: true,
    is_archived: false,
    is_muted: false,
    pinned_at: "2026-04-27T10:00:00Z",
    last_message_at: "2026-04-27T10:26:00Z",
  },
  {
    id: "conv-alex",
    is_group: false,
    other_user_id: "alex",
    title: "Alex Rivera",
    last_message: { text: "Hey team! The new landing page mockups are ready.", sender_id: "alex", time: "10:24 AM", type: "text" },
    unread_count: 0,
    is_pinned: false,
    is_archived: false,
    is_muted: false,
    last_message_at: "2026-04-27T10:24:00Z",
  },
  {
    id: "conv-design",
    is_group: true,
    group_name: "Design Team",
    group_avatar: null,
    members_count: 6,
    title: "Design Team",
    initials: "DT",
    color: "from-violet-400 to-purple-500",
    last_message: { text: "Priya: Quick note — the spacing on the CTA needs more breathing room.", sender_id: "priya", time: "10:30 AM", type: "text" },
    unread_count: 3,
    is_pinned: false,
    is_archived: false,
    is_muted: false,
    last_message_at: "2026-04-27T10:30:00Z",
    my_role: "member",
  },
  {
    id: "conv-yuki",
    is_group: false,
    other_user_id: "yuki",
    title: "Yuki Tanaka",
    last_message: { text: "Coffee break? ☕", sender_id: "yuki", time: "10:31 AM", type: "text" },
    unread_count: 1,
    is_pinned: false,
    is_archived: false,
    is_muted: false,
    last_message_at: "2026-04-27T10:31:00Z",
  },
  {
    id: "conv-priya",
    is_group: false,
    other_user_id: "priya",
    title: "Priya Sharma",
    last_message: { text: "Reviewing your component library now.", sender_id: "priya", time: "9:48 AM", type: "text" },
    unread_count: 0,
    is_pinned: false,
    is_archived: false,
    is_muted: true,
    last_message_at: "2026-04-27T09:48:00Z",
  },
  {
    id: "conv-marcus",
    is_group: false,
    other_user_id: "marcus",
    title: "Marcus Lee",
    last_message: { text: "Pushed the API fix — let me know if it works.", sender_id: "marcus", time: "Yesterday", type: "text" },
    unread_count: 0,
    is_pinned: false,
    is_archived: true,
    is_muted: false,
    last_message_at: "2026-04-26T22:42:00Z",
  },
  {
    id: "conv-eng",
    is_group: true,
    group_name: "Engineering",
    members_count: 18,
    title: "Engineering",
    initials: "EN",
    color: "from-blue-400 to-cyan-500",
    last_message: { text: "Marcus: API rate-limit fix is in main.", sender_id: "marcus", time: "8:45 AM", type: "text" },
    unread_count: 0,
    is_pinned: false,
    is_archived: false,
    is_muted: false,
    last_message_at: "2026-04-27T08:45:00Z",
    my_role: "admin",
  },
];

// Messages keyed by conversation id
export const MESSAGES = {
  "conv-sarah": [
    { id: 1, sender_id: "sarah", text: "Got a sec to chat about the launch?", time: "10:20 AM", reactions: [], starred: false, pinned: false },
    { id: 2, sender_id: "me", text: "Yep — give me 5 mins to wrap something up.", time: "10:22 AM", reactions: [], starred: false, status: "read" },
    { id: 3, sender_id: "sarah", text: "These look incredible! Love the hero section.", time: "10:26 AM", reactions: [{ emoji: "🔥", count: 1, by_me: false }], starred: true, pinned: false },
  ],
  "conv-alex": [
    { id: 1, sender_id: "alex", text: "Sent over the mockups in the design team chat 👀", time: "10:24 AM", reactions: [], starred: false },
    { id: 2, sender_id: "alex", text: "Hey team! The new landing page mockups are ready.", time: "10:24 AM", reactions: [], starred: false, attachment: { name: "landing-v3.fig", size: "2.4 MB", type: "file" } },
  ],
  "conv-design": [
    { id: 1, sender_id: "alex", text: "Hey team! The new landing page mockups are ready for review.", time: "10:24 AM", reactions: [], starred: false, attachment: { name: "landing-v3.fig", size: "2.4 MB", type: "file" } },
    { id: 2, sender_id: "sarah", text: "These look incredible! Love the hero section. Let's ship it 🚀", time: "10:26 AM", reactions: [{ emoji: "🔥", count: 3, by_me: false }], starred: false },
    { id: 3, sender_id: "me", text: "Deploying to staging now. Should be live in 2 minutes!", time: "10:28 AM", reactions: [], starred: false, status: "read" },
    { id: 4, sender_id: "priya", text: "Quick note — the spacing on the CTA section needs a little more breathing room. I'll push a Figma update by EOD.", time: "10:30 AM", reactions: [{ emoji: "👍", count: 2, by_me: true }], starred: false },
  ],
  "conv-yuki": [
    { id: 1, sender_id: "yuki", text: "Coffee break? ☕", time: "10:31 AM", reactions: [], starred: false },
  ],
  "conv-priya": [
    { id: 1, sender_id: "priya", text: "Reviewing your component library now.", time: "9:48 AM", reactions: [], starred: false },
  ],
  "conv-marcus": [
    { id: 1, sender_id: "marcus", text: "Pushed the API fix — let me know if it works.", time: "Yesterday", reactions: [], starred: false },
  ],
  "conv-eng": [
    { id: 1, sender_id: "marcus", text: "API rate-limit fix is in main. Tag me on any regressions.", time: "8:45 AM", reactions: [{ emoji: "🎉", count: 4, by_me: false }], starred: false },
  ],
};

// Starred messages (across conversations)
export const STARRED_MESSAGES = [
  { id: "s1", conv_id: "conv-sarah", conv_title: "Sarah Chen", sender: "Sarah Chen", text: "These look incredible! Love the hero section.", time: "10:26 AM", date: "Today" },
];

// Blocked users (currently empty for new flow)
export const BLOCKED_USER_IDS = [];

// Helpers
export const getUser = (id) => ALL_USERS.find((u) => u.id === id);
export const getConversation = (id) => CONVERSATIONS.find((c) => c.id === id);
export const getMessages = (convId) => MESSAGES[convId] || [];

import api, { unwrap } from "../utils/axiosInstance";

export const listConversations = () => unwrap(api.get("/conversations"));
export const getConversation = (id) => unwrap(api.get(`/conversations/${id}`));

export const openDM = (user_id) =>
  unwrap(api.post("/conversations/dm", { user_id }));

export const createGroup = ({
  group_name,
  member_ids,
  group_avatar = null,
  group_description = null,
}) =>
  unwrap(
    api.post("/conversations/group", {
      group_name,
      member_ids,
      group_avatar,
      group_description,
    }),
  );

export const updateGroupInfo = (id, body) =>
  unwrap(api.put(`/conversations/${id}/group-info`, body));

// Simple state toggles — all POST with no body.
const act = (id, action) => unwrap(api.post(`/conversations/${id}/${action}`));

export const archiveConversation = (id) => act(id, "archive");
export const unarchiveConversation = (id) => act(id, "unarchive");
export const pinConversation = (id) => act(id, "pin");
export const unpinConversation = (id) => act(id, "unpin");
export const muteConversation = (id) => act(id, "mute");
export const unmuteConversation = (id) => act(id, "unmute");
export const clearChat = (id) => act(id, "clear");
export const markRead = (id) => act(id, "read");
export const leaveGroup = (id) => act(id, "leave");

export const addMember = (id, user_id) =>
  unwrap(api.post(`/conversations/${id}/members`, { user_id }));
export const removeMember = (id, userId) =>
  unwrap(api.delete(`/conversations/${id}/members/${userId}`));
export const changeMemberRole = (id, userId, role) =>
  unwrap(api.patch(`/conversations/${id}/members/${userId}/role`, { role }));

export const deleteConversation = (id) => unwrap(api.delete(`/conversations/${id}`));

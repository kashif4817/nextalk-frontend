import api, { unwrap } from "../utils/axiosInstance";

/** Newest-first page. `cursor` is the created_at of the oldest row you hold. */
export const listMessages = (convId, { limit, cursor } = {}) =>
  unwrap(api.get(`/messages/${convId}`, { params: { limit, cursor } }));

export const sendMessage = ({
  conversation_id,
  content = null,
  message_type = "text",
  file_url = null,
  file_type = null,
  reply_to_id = null,
}) =>
  unwrap(
    api.post("/messages", {
      conversation_id,
      content,
      message_type,
      file_url,
      file_type,
      reply_to_id,
    }),
  );

export const editMessage = (id, content) =>
  unwrap(api.put(`/messages/${id}`, { content }));

/** mode: "for_me" | "for_everyone" */
export const deleteMessage = (id, mode = "for_me") =>
  unwrap(api.delete(`/messages/${id}`, { data: { mode } }));

export const pinMessage = (id) => unwrap(api.post(`/messages/${id}/pin`));
export const unpinMessage = (id) => unwrap(api.post(`/messages/${id}/unpin`));

export const forwardMessage = (id, conversation_ids) =>
  unwrap(api.post(`/messages/${id}/forward`, { conversation_ids }));

export const markSeen = (id) => unwrap(api.post(`/messages/${id}/seen`));
export const getSeenBy = (id) => unwrap(api.get(`/messages/${id}/seen`));

export const reactToMessage = (id, emoji) =>
  unwrap(api.post(`/messages/${id}/react`, { emoji }));
export const removeReaction = (id, emoji) =>
  unwrap(api.delete(`/messages/${id}/react`, { data: { emoji } }));
export const getReactions = (id) => unwrap(api.get(`/messages/${id}/reactions`));

export const starMessage = (id) => unwrap(api.post(`/messages/${id}/star`));
export const unstarMessage = (id) => unwrap(api.delete(`/messages/${id}/star`));
export const listStarred = () => unwrap(api.get("/starred"));

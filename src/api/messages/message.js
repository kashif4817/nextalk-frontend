import api from '../../lib/axios'

export const getMessages = (convId, { limit, cursor } = {}) => {
  return api.get(`/messages/${convId}`, { params: { limit, cursor } })
}

export const sendMessage = ({ conversation_id, content, message_type = 'text', file_url, file_type, reply_to_id }) => {
  return api.post('/messages', { conversation_id, content, message_type, file_url, file_type, reply_to_id })
}

export const editMessage = (id, content) => {
  return api.put(`/messages/${id}`, { content })
}

export const deleteMessage = (id, mode) => {
  return api.delete(`/messages/${id}`, { data: { mode } })
}

export const pinMessage = (id) => {
  return api.post(`/messages/${id}/pin`)
}

export const unpinMessage = (id) => {
  return api.post(`/messages/${id}/unpin`)
}

export const forwardMessage = (id, conversation_ids) => {
  return api.post(`/messages/${id}/forward`, { conversation_ids })
}

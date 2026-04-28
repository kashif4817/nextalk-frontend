import api from '../../lib/axios'

export const getAllConversations = () => {
  return api.get('/conversations')
}

export const getConversation = (id) => {
  return api.get(`/conversations/${id}`)
}

export const createOrGetDM = (user_id) => {
  return api.post('/conversations/dm', { user_id })
}

export const createGroup = ({ group_name, group_avatar, group_description, member_ids }) => {
  return api.post('/conversations/group', { group_name, group_avatar, group_description, member_ids })
}

export const updateGroupInfo = (id, { group_name, group_avatar, group_description }) => {
  return api.put(`/conversations/${id}/group-info`, { group_name, group_avatar, group_description })
}

export const markRead = (id) => {
  return api.post(`/conversations/${id}/read`)
}

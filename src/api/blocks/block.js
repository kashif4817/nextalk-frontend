import api from '../../lib/axios'

export const getBlockedUsers = () => {
  return api.get('/blocks')
}

export const blockUser = (blocked_id) => {
  return api.post('/blocks', { blocked_id })
}

export const unblockUser = (id) => {
  return api.delete(`/blocks/${id}`)
}

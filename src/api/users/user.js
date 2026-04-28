import api from '../../lib/axios'

export const getMe = () => {
  return api.get('/users/me')
}

export const searchUsers = (query) => {
  return api.get('/users/search', { params: { search: query } })
}

export const getAllUsers = () => {
  return api.get('/users/all')
}

export const getUserProfile = (id) => {
  return api.get(`/users/${id}`)
}

export const updateProfile = (data) => {
  return api.put('/users/me', data)
}

export const setUsername = (username) => {
  return api.put('/users/me/username', { username })
}

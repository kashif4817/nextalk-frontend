import api from '../../lib/axios'

export const getContacts = () => {
  return api.get('/contacts')
}

export const addContact = (contact_id, nickname) => {
  return api.post('/contacts', { contact_id, nickname })
}

export const updateContact = (contact_id, nickname) => {
  return api.patch(`/contacts/${contact_id}`, { nickname })
}

export const removeContact = (contact_id) => {
  return api.delete(`/contacts/${contact_id}`)
}

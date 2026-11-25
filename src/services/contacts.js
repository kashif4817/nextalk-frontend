import api, { unwrap } from "../utils/axiosInstance";

export const listContacts = () => unwrap(api.get("/contacts"));
export const addContact = (contact_id, nickname = null) =>
  unwrap(api.post("/contacts", { contact_id, nickname }));
export const updateContact = (contactId, nickname) =>
  unwrap(api.patch(`/contacts/${contactId}`, { nickname }));
export const removeContact = (contactId) =>
  unwrap(api.delete(`/contacts/${contactId}`));

import api, { unwrap } from "../utils/axiosInstance";

export const getMe = () => unwrap(api.get("/users/me"));
export const getUser = (id) => unwrap(api.get(`/users/${id}`));
export const getAllUsers = () => unwrap(api.get("/users/all"));
export const searchUsers = (search) =>
  unwrap(api.get("/users/search", { params: { search } }));

export const updateProfile = (body) => unwrap(api.put("/users/me", body));
export const setUsername = (username) =>
  unwrap(api.put("/users/me/username", { username }));
export const updatePrivacy = (body) => unwrap(api.put("/users/me/privacy", body));
export const updatePresence = (body) => unwrap(api.put("/users/me/presence", body));

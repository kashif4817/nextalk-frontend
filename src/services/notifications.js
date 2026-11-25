import api, { unwrap } from "../utils/axiosInstance";

export const listNotifications = () => unwrap(api.get("/notifications"));
export const markAllRead = () => unwrap(api.put("/notifications/read-all"));
export const markOneRead = (id) => unwrap(api.put(`/notifications/${id}/read`));

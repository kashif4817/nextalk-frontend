import api, { unwrap } from "../utils/axiosInstance";

export const listBlocked = () => unwrap(api.get("/blocks"));
export const blockUser = (blocked_id) => unwrap(api.post("/blocks", { blocked_id }));
export const unblockUser = (id) => unwrap(api.delete(`/blocks/${id}`));

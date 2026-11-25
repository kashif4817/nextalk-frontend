import api, { unwrap } from "../utils/axiosInstance";

// The backend reads a single multipart field named "file" on all three routes.
const upload = (endpoint, file, onProgress) => {
  const form = new FormData();
  form.append("file", file);

  return unwrap(
    api.post(endpoint, form, {
      headers: { "Content-Type": "multipart/form-data" },
      // The client default (30s) would cut off a 25 MB video on a slow link.
      timeout: 5 * 60 * 1000,
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    }),
  );
};

/** Images: jpeg/png/gif/webp, 5 MB max. */
export const uploadImage = (file, onProgress) =>
  upload("/upload/image", file, onProgress);

/** Documents, video and shared audio files, 25 MB max. */
export const uploadFile = (file, onProgress) =>
  upload("/upload/file", file, onProgress);

/** Voice notes: webm/mpeg/mp4/ogg/wav, 5 MB max. */
export const uploadAudio = (file, onProgress) =>
  upload("/upload/audio", file, onProgress);

// Attachment helpers shared by the composer, the bubbles and the adapters.
//
// The messages table only has `file_url` and `file_type`, so the details a
// WhatsApp-style bubble needs (file name, size, image dimensions, video
// length) travel as MIME parameters on `file_type`, the same way an email
// Content-Type carries them:
//
//   application/pdf; name=Q1%20report.pdf; size=482113
//   image/jpeg; size=201733; w=1600; h=1200
//
// Old rows with a bare MIME type still parse; they just lack the extras.

import toast from "react-hot-toast";

export const MB = 1024 * 1024;

/** Server-side ceilings (see nextalk-backend/src/middlewares/uploadMiddleware.js). */
export const LIMITS = {
  image: 5 * MB,
  video: 25 * MB,
  audio: 25 * MB,
  document: 25 * MB,
};

/** WhatsApp lets you pick a batch; past this it gets unwieldy to review. */
export const MAX_BATCH = 30;

// Formats the image endpoint accepts. Anything else that claims to be an
// image (svg, heic, bmp...) is sent as a document instead.
const UPLOADABLE_IMAGES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/** Which message_type a picked file becomes. */
export const kindOf = (file) => {
  const type = file?.type || "";
  if (UPLOADABLE_IMAGES.includes(type)) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  return "document";
};

export const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / MB).toFixed(bytes < 10 * MB ? 1 : 0)} MB`;
};

export const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "";
  const total = Math.round(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

export const extOf = (name = "") => {
  const dot = name.lastIndexOf(".");
  return dot > 0 && dot < name.length - 1 ? name.slice(dot + 1).toLowerCase() : "";
};

// ── file_type encoding ─────────────────────────────────────────────────────

const PARAM_KEYS = { name: "name", size: "size", width: "w", height: "h", duration: "dur" };

/** MIME type plus metadata -> the string stored in messages.file_type. */
export const encodeFileType = (mime, meta = {}) => {
  const parts = [mime || "application/octet-stream"];
  for (const [field, key] of Object.entries(PARAM_KEYS)) {
    const value = meta[field];
    if (value === undefined || value === null || value === "") continue;
    if (field === "name") {
      // Long names are cut here rather than letting the insert fail.
      parts.push(`${key}=${encodeURIComponent(String(value).slice(0, 120))}`);
    } else if (Number.isFinite(Number(value))) {
      parts.push(`${key}=${field === "duration" ? Number(value).toFixed(1) : Math.round(value)}`);
    }
  }
  return parts.join("; ");
};

/** messages.file_type -> { mime, name, size, width, height, duration }. */
export const parseFileType = (fileType) => {
  const [mime = "", ...params] = String(fileType || "").split(";");
  const out = { mime: mime.trim().toLowerCase() };
  for (const param of params) {
    const eq = param.indexOf("=");
    if (eq === -1) continue;
    const key = param.slice(0, eq).trim();
    const raw = param
      .slice(eq + 1)
      .trim()
      .replace(/^"|"$/g, "");
    const field = Object.keys(PARAM_KEYS).find((f) => PARAM_KEYS[f] === key);
    if (!field) continue;
    if (field === "name") {
      try {
        out.name = decodeURIComponent(raw);
      } catch {
        out.name = raw;
      }
    } else {
      const n = Number(raw);
      if (Number.isFinite(n)) out[field] = n;
    }
  }
  return out;
};

/**
 * Best-effort name from a Cloudinary URL, for rows sent before names were
 * stored. Cloudinary keeps the original name and appends `_<6 chars>`.
 */
export const fileNameFromUrl = (url) => {
  if (!url || url.startsWith("blob:")) return "";
  try {
    const last = decodeURIComponent(new URL(url).pathname.split("/").pop() || "");
    return last.replace(/_[a-z0-9]{6}(?=\.[^.]+$|$)/i, "");
  } catch {
    return "";
  }
};

/** Everything a bubble needs to draw a file, from the two stored columns. */
export const describeFile = (fileUrl, fileType) => {
  const meta = parseFileType(fileType);
  const name = meta.name || fileNameFromUrl(fileUrl) || "File";
  return { ...meta, name, ext: extOf(name) };
};

// ── Document icon colours (by extension, like WhatsApp's file chips) ───────

const DOC_STYLES = [
  { exts: ["pdf"], label: "PDF", color: "#e5484d" },
  { exts: ["doc", "docx", "odt", "rtf"], label: "DOC", color: "#3b82f6" },
  { exts: ["xls", "xlsx", "ods", "csv"], label: "XLS", color: "#16a34a" },
  { exts: ["ppt", "pptx", "odp", "key"], label: "PPT", color: "#f97316" },
  { exts: ["zip", "rar", "7z", "tar", "gz"], label: "ZIP", color: "#a16207" },
  { exts: ["txt", "md", "json", "xml", "log"], label: "TXT", color: "#64748b" },
  { exts: ["apk", "exe", "dmg", "msi"], label: "APP", color: "#7c3aed" },
];

export const docStyle = (ext) => {
  const hit = DOC_STYLES.find((s) => s.exts.includes(ext));
  if (hit) return hit;
  return { label: (ext || "file").slice(0, 4).toUpperCase(), color: "#78716c" };
};

/** "PDF · 1.2 MB" */
export const docSubtitle = ({ ext, size }) =>
  [ext ? ext.toUpperCase() : "File", formatBytes(size)].filter(Boolean).join(" · ");

// ── Cloudinary delivery URLs ───────────────────────────────────────────────

const isCloudinary = (url) => typeof url === "string" && url.includes("res.cloudinary.com");

/** A width-capped copy of an uploaded image, so bubbles don't pull full-size files. */
export const imageThumbUrl = (url, width = 720) =>
  isCloudinary(url) && url.includes("/image/upload/")
    ? url.replace("/image/upload/", `/image/upload/c_limit,w_${width},q_auto,f_auto/`)
    : url;

/** A still from the first second of an uploaded video, for the bubble poster. */
export const videoPosterUrl = (url, width = 720) =>
  isCloudinary(url) && url.includes("/video/upload/")
    ? url
        .replace("/video/upload/", `/video/upload/so_0,c_limit,w_${width}/`)
        .replace(/\.[a-z0-9]+(\?.*)?$/i, ".jpg")
    : null;

// ── Reading files in the browser ───────────────────────────────────────────

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image."));
    img.src = src;
  });

const loadMedia = (tag, src) =>
  new Promise((resolve) => {
    const el = document.createElement(tag);
    el.preload = "metadata";
    el.muted = true;
    const done = (value) => {
      el.removeAttribute("src");
      el.load();
      resolve(value);
    };
    el.onloadedmetadata = () =>
      done({
        width: el.videoWidth || undefined,
        height: el.videoHeight || undefined,
        duration: Number.isFinite(el.duration) ? el.duration : undefined,
      });
    el.onerror = () => done({});
    el.src = src;
  });

/** Pixel size / running time of a picked file. Never throws: missing is fine. */
export const readMediaMeta = async (file, kind = kindOf(file)) => {
  if (kind !== "image" && kind !== "video" && kind !== "audio") return {};
  const url = URL.createObjectURL(file);
  try {
    if (kind === "image") {
      const img = await loadImage(url);
      return { width: img.naturalWidth, height: img.naturalHeight };
    }
    return await loadMedia(kind === "video" ? "video" : "audio", url);
  } catch {
    return {};
  } finally {
    URL.revokeObjectURL(url);
  }
};

const MAX_EDGE = 2560;
const COMPRESS_ABOVE = 1.5 * MB;

/**
 * Shrink a large photo before upload, the way WhatsApp does: phone photos are
 * often over the 5 MB image limit, and nobody needs 4000px in a chat. GIFs
 * are left alone (a canvas would freeze them), as is anything the browser
 * makes bigger.
 */
export const compressImage = async (file) => {
  if (file.type === "image/gif" || file.size <= COMPRESS_ABOVE) return file;

  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.round(img.naturalWidth * scale);
    const height = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(img, 0, 0, width, height);

    // WebP keeps PNG transparency; JPEG is smaller for photos.
    const target = file.type === "image/png" ? "image/webp" : "image/jpeg";
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, target, 0.85));
    if (!blob || blob.size >= file.size || !UPLOADABLE_IMAGES.includes(blob.type)) return file;

    const ext = blob.type === "image/webp" ? "webp" : "jpg";
    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${base}.${ext}`, { type: blob.type, lastModified: Date.now() });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
};

/**
 * Save a file under its real name. Cloudinary serves with CORS, so fetching
 * it as a blob lets the `download` attribute work cross-origin; if that fails
 * the file just opens in a new tab.
 */
export const downloadFile = async (url, name) => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    const blobUrl = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = name || "download";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
};

/**
 * Phones and tablets: they get the native camera instead of the webcam modal,
 * and the emoji panel stands in for the keyboard rather than sitting beside it.
 */
export const isTouchFirst = () =>
  typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;

// ── Picking files ──────────────────────────────────────────────────────────

let seq = 0;

// Non-GIF photos are shrunk before upload, so they may start out larger than
// the 5 MB image limit. This only stops absurd files from being read at all.
const RAW_IMAGE_CEILING = 40 * MB;

const tooBig = (file, kind) => {
  if (kind === "image") {
    const ceiling = file.type === "image/gif" ? LIMITS.image : RAW_IMAGE_CEILING;
    return file.size > ceiling ? ceiling : 0;
  }
  return file.size > LIMITS[kind] ? LIMITS[kind] : 0;
};

/**
 * Turn picked files into composer items, refusing (with a toast) ones the
 * server would. `asDocument` sends everything as files, the way WhatsApp's
 * Document option does. Call it from event handlers, not during render: it toasts and
 * creates object URLs, which StrictMode's double render would duplicate.
 */
export const prepareAttachments = (files, room = MAX_BATCH, { asDocument = false } = {}) => {
  const items = [];
  for (const file of files) {
    if (items.length >= room) {
      toast.error(`You can send up to ${MAX_BATCH} files at once.`);
      break;
    }
    // Picked through "Document", even a photo goes as an uncompressed file.
    const kind = asDocument ? "document" : kindOf(file);
    const limit = tooBig(file, kind);
    if (limit) {
      toast.error(`"${file.name}" is over ${formatBytes(limit)}.`);
      continue;
    }
    if (file.size === 0) {
      toast.error(`"${file.name}" is empty.`);
      continue;
    }
    items.push({
      id: `att-${++seq}`,
      file,
      kind,
      caption: "",
      previewUrl: kind === "document" ? null : URL.createObjectURL(file),
      meta: readMediaMeta(file, kind),
    });
  }
  return items;
};

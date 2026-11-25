import { useCallback, useEffect, useRef, useState } from "react";
import { Headphones, Plus, Send, Video, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { DocChip } from "./MessageAttachment";
import {
  MAX_BATCH,
  docSubtitle,
  extOf,
  formatBytes,
  isTouchFirst,
  prepareAttachments,
} from "../../lib/attachments";

const Preview = ({ item }) => {
  const { t } = useTheme();
  const card = `w-full max-w-sm rounded-2xl border px-6 py-8 flex flex-col items-center text-center gap-3 ${t(
    "bg-stone-900 border-white/10",
    "bg-white border-stone-200",
  )}`;
  const sub = t("text-stone-400", "text-stone-500");

  if (item.kind === "image") {
    return (
      <img
        src={item.previewUrl}
        alt={item.file.name}
        className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
      />
    );
  }

  if (item.kind === "video") {
    return (
      <video
        key={item.id}
        src={item.previewUrl}
        controls
        playsInline
        className="max-h-full max-w-full rounded-lg shadow-lg bg-black"
      />
    );
  }

  if (item.kind === "audio") {
    return (
      <div className={card}>
        <span className="w-16 h-16 rounded-full flex items-center justify-center bg-orange-500 text-white">
          <Headphones className="w-8 h-8" />
        </span>
        <p className="text-sm font-semibold break-all">{item.file.name}</p>
        <p className={`text-xs ${sub}`}>{formatBytes(item.file.size)}</p>
        <audio key={item.id} src={item.previewUrl} controls className="w-full mt-1" />
      </div>
    );
  }

  return (
    <div className={card}>
      <DocChip name={item.file.name} size="lg" />
      <p className="text-sm font-semibold break-all">{item.file.name}</p>
      <p className={`text-xs ${sub}`}>No preview available</p>
      <p className={`text-xs ${sub}`}>
        {docSubtitle({ ext: extOf(item.file.name), size: item.file.size })}
      </p>
    </div>
  );
};

const Thumb = ({ item, active, onSelect, onRemove }) => {
  const { t } = useTheme();
  return (
    <div className="relative group shrink-0">
      <button
        onClick={onSelect}
        title={item.file.name}
        className={`w-14 h-14 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer border-2 transition-colors ${
          active
            ? "border-amber-500"
            : t("border-transparent bg-stone-800", "border-transparent bg-stone-200")
        }`}
      >
        {item.kind === "image" ? (
          <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
        ) : item.kind === "video" ? (
          <>
            <video
              src={item.previewUrl}
              muted
              preload="metadata"
              className="w-full h-full object-cover"
            />
            <Video className="absolute bottom-1 left-1 w-3.5 h-3.5 text-white drop-shadow" />
          </>
        ) : item.kind === "audio" ? (
          <Headphones className="w-6 h-6 text-orange-500" />
        ) : (
          <DocChip name={item.file.name} />
        )}
      </button>
      <button
        onClick={onRemove}
        aria-label={`Remove ${item.file.name}`}
        className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center bg-stone-900 text-white border border-white/20 cursor-pointer transition-opacity ${
          active ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus:opacity-100"
        }`}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

/**
 * WhatsApp's "review before sending" screen: a big preview, a caption per
 * file, a strip to switch between / remove / add files, and one send button.
 * It covers the chat pane (the parent must be `relative`).
 *
 * `initialItems` come from prepareAttachments() (`accept` / `asDocument`
 * repeat how they were picked, for the "+" tile); the composer owns their
 * preview URLs from then on and frees them when it closes.
 * onSend receives [{ file, kind, caption, meta }] in the order shown.
 */
const AttachmentComposer = ({ initialItems, accept, asDocument = false, onSend, onClose }) => {
  const { t } = useTheme();
  const [items, setItems] = useState(initialItems);
  const [active, setActive] = useState(0);
  const [sending, setSending] = useState(false);
  const addRef = useRef(null);
  const captionRef = useRef(null);

  // Every preview URL this composer has held, freed once it really unmounts.
  // The check is deferred because StrictMode unmounts and remounts once in
  // development, and freeing on that fake unmount would blank the previews.
  const urlsRef = useRef(new Set());
  const mountedRef = useRef(false);
  useEffect(() => {
    items.forEach((it) => it.previewUrl && urlsRef.current.add(it.previewUrl));
  }, [items]);
  useEffect(() => {
    mountedRef.current = true;
    const urls = urlsRef.current;
    return () => {
      mountedRef.current = false;
      setTimeout(() => {
        if (!mountedRef.current) urls.forEach((u) => URL.revokeObjectURL(u));
      }, 0);
    };
  }, []);

  // Nothing usable was picked (all too big, say): bow out.
  useEffect(() => {
    if (items.length === 0) onClose();
  }, [items.length, onClose]);

  useEffect(() => {
    if (!isTouchFirst()) captionRef.current?.focus();
  }, [active]);

  const send = useCallback(async () => {
    if (sending || !items.length) return;
    setSending(true);
    const metas = await Promise.all(items.map((it) => it.meta));
    onSend(
      items.map((it, i) => ({
        file: it.file,
        kind: it.kind,
        caption: it.caption.trim(),
        meta: metas[i] || {},
      })),
    );
  }, [items, onSend, sending]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const current = items[Math.min(active, items.length - 1)];
  if (!current) return null;

  const remove = (id) => {
    const idx = items.findIndex((it) => it.id === id);
    const gone = items[idx];
    if (gone?.previewUrl) {
      URL.revokeObjectURL(gone.previewUrl);
      urlsRef.current.delete(gone.previewUrl);
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
    setActive((a) => (idx < a || a === items.length - 1 ? Math.max(0, a - 1) : a));
  };

  const addMore = (picked) => {
    const fresh = prepareAttachments(picked, MAX_BATCH - items.length, { asDocument });
    if (!fresh.length) return;
    setItems((prev) => [...prev, ...fresh]);
    setActive(items.length);
  };

  const setCaption = (value) =>
    setItems((prev) => prev.map((it) => (it.id === current.id ? { ...it, caption: value } : it)));

  return (
    <div
      className={`absolute inset-0 z-30 flex flex-col animate-backdrop-fade ${t(
        "bg-stone-950 text-stone-100",
        "bg-stone-100 text-stone-900",
      )}`}
    >
      {/* Header */}
      <div
        className={`shrink-0 h-14 flex items-center gap-3 px-2 border-b ${t(
          "border-white/5 bg-stone-950/80",
          "border-stone-200 bg-white/85",
        )}`}
      >
        <button
          onClick={onClose}
          aria-label="Discard"
          className={`p-2 rounded-lg cursor-pointer ${t("text-stone-300 hover:bg-white/5", "text-stone-600 hover:bg-stone-100")}`}
        >
          <X className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{current.file.name}</p>
          {items.length > 1 && (
            <p className={`text-[11px] ${t("text-stone-400", "text-stone-500")}`}>
              {Math.min(active, items.length - 1) + 1} of {items.length}
            </p>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-4 sm:p-8">
        <Preview item={current} />
      </div>

      {/* Caption */}
      <div className="shrink-0 px-3 sm:px-6 pb-3">
        <div
          className={`max-w-2xl mx-auto flex items-center px-4 py-2.5 rounded-2xl ${t(
            "bg-stone-900",
            "bg-white border border-stone-200",
          )}`}
        >
          <input
            ref={captionRef}
            value={current.caption}
            onChange={(e) => setCaption(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Add a caption"
            maxLength={1024}
            className={`flex-1 bg-transparent outline-none text-sm ${t(
              "text-stone-100 placeholder-stone-500",
              "text-stone-900 placeholder-stone-400",
            )}`}
          />
        </div>
      </div>

      {/* Strip + send */}
      <div
        className={`shrink-0 border-t px-3 sm:px-6 py-3 flex items-center gap-3 ${t(
          "border-white/5",
          "border-stone-200 bg-white",
        )}`}
      >
        <div className="flex-1 min-w-0 flex items-center justify-center gap-2 overflow-x-auto scrollbar-hide pt-2 pb-1">
          {items.map((it, i) => (
            <Thumb
              key={it.id}
              item={it}
              active={it.id === current.id}
              onSelect={() => setActive(i)}
              onRemove={() => remove(it.id)}
            />
          ))}
          {items.length < MAX_BATCH && (
            <button
              onClick={() => addRef.current?.click()}
              aria-label="Add more files"
              className={`w-14 h-14 shrink-0 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer ${t(
                "border-stone-700 text-stone-400 hover:border-amber-500 hover:text-amber-500",
                "border-stone-300 text-stone-500 hover:border-amber-500 hover:text-amber-500",
              )}`}
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
          <input
            ref={addRef}
            type="file"
            multiple
            accept={accept}
            className="hidden"
            onChange={(e) => {
              addMore([...e.target.files]);
              e.target.value = "";
            }}
          />
        </div>

        <button
          onClick={send}
          disabled={sending}
          aria-label={`Send ${items.length} ${items.length === 1 ? "file" : "files"}`}
          className="relative shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg cursor-pointer disabled:opacity-60"
        >
          <Send className="w-5 h-5" />
          {items.length > 1 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-white text-amber-600 text-[11px] font-bold flex items-center justify-center border border-amber-200">
              {items.length}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default AttachmentComposer;

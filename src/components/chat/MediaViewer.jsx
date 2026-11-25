import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import Avatar from "./Avatar";
import { downloadFile } from "../../lib/attachments";

/**
 * Full-screen photo / video viewer, like tapping media in WhatsApp.
 * `items` are message views with an image or video attachment; arrows (and
 * the keyboard) step through every one in the chat.
 */
const MediaViewer = ({ items, index, onIndex, onClose }) => {
  const msg = items[index];
  const hasPrev = index > 0;
  const hasNext = index < items.length - 1;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && hasPrev) onIndex(index - 1);
      else if (e.key === "ArrowRight" && hasNext) onIndex(index + 1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, hasPrev, hasNext, onIndex, onClose]);

  if (!msg?.attachment?.url) return null;
  const att = msg.attachment;
  const who = msg.is_mine ? "You" : (msg.sender?.display_name ?? "Unknown");

  const navBtn =
    "absolute top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer backdrop-blur-sm";

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-black/95 text-white animate-backdrop-fade"
      role="dialog"
      aria-modal="true"
      aria-label="Media viewer"
    >
      <div className="shrink-0 h-16 flex items-center gap-3 px-4">
        <Avatar
          initials={msg.is_mine ? "Y" : msg.sender?.initials}
          color={msg.sender?.color}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{who}</p>
          <p className="text-xs text-white/60">
            {new Date(msg.created_at).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
        <button
          onClick={() => downloadFile(att.url, att.name)}
          aria-label="Download"
          className="p-2.5 rounded-full hover:bg-white/10 cursor-pointer"
        >
          <Download className="w-5 h-5" />
        </button>
        <button
          onClick={onClose}
          aria-label="Close"
          className="p-2.5 rounded-full hover:bg-white/10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div
        className="relative flex-1 min-h-0 flex items-center justify-center px-4 sm:px-16 pb-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {att.type === "video" ? (
          <video
            key={msg.id}
            src={att.url}
            controls
            autoPlay
            playsInline
            className="max-h-full max-w-full rounded-lg bg-black"
          />
        ) : (
          <img
            key={msg.id}
            src={att.url}
            alt={msg.text || att.name || "Photo"}
            className="max-h-full max-w-full object-contain select-none animate-modal-pop"
            draggable={false}
          />
        )}

        {hasPrev && (
          <button
            onClick={() => onIndex(index - 1)}
            aria-label="Previous"
            className={`${navBtn} left-3`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {hasNext && (
          <button
            onClick={() => onIndex(index + 1)}
            aria-label="Next"
            className={`${navBtn} right-3`}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {msg.text && (
        <p className="shrink-0 max-w-3xl mx-auto px-6 pb-6 text-center text-sm text-white/90 whitespace-pre-wrap">
          {msg.text}
        </p>
      )}
    </div>,
    document.body,
  );
};

export default MediaViewer;

import { useState } from "react";
import { AlertCircle, Download, FileText, Play, Video } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import {
  docStyle,
  docSubtitle,
  downloadFile,
  extOf,
  formatDuration,
  imageThumbUrl,
  videoPosterUrl,
} from "../../lib/attachments";

/** Coloured file-type chip (red PDF, blue DOC, green XLS ...). */
export const DocChip = ({ name, size = "md" }) => {
  const { label, color } = docStyle(extOf(name));
  const box = size === "lg" ? "w-20 h-24 text-sm rounded-xl" : "w-10 h-12 text-[10px] rounded-md";
  return (
    <span
      className={`relative flex items-end justify-center pb-1.5 font-bold text-white shrink-0 ${box}`}
      style={{ backgroundColor: color }}
    >
      <FileText
        className={`absolute opacity-40 ${size === "lg" ? "w-8 h-8 top-4" : "w-4 h-4 top-1.5"}`}
      />
      {label}
    </span>
  );
};

/** Upload ring; spins until the first progress event arrives. */
export const ProgressRing = ({ progress, size = 40, className = "" }) => {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const known = Number.isFinite(progress);
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`${known ? "-rotate-90" : "animate-spin"} ${className}`}
      role="progressbar"
      aria-valuenow={known ? progress : undefined}
      aria-label="Uploading"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={known ? c * (1 - Math.min(100, Math.max(2, progress)) / 100) : c * 0.7}
        className="transition-[stroke-dashoffset] duration-200"
      />
    </svg>
  );
};

const MediaOverlay = ({ status, progress }) => {
  if (status === "sending") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/35">
        <ProgressRing progress={progress} size={48} className="text-white" />
      </div>
    );
  }
  if (status === "failed") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/45 text-white text-xs font-medium">
        <AlertCircle className="w-6 h-6 text-red-400" />
        Not sent
      </div>
    );
  }
  return null;
};

// Keep odd shapes inside a WhatsApp-like frame: very tall or very wide media
// is cropped by object-cover rather than blowing up the thread.
const frameRatio = (w, h) => (w && h ? Math.min(1.9, Math.max(0.7, w / h)) : 4 / 3);

const MediaFrame = ({ att, onOpen, children, status, progress }) => (
  <button
    type="button"
    onClick={status ? undefined : onOpen}
    className={`relative block w-[240px] sm:w-[300px] max-w-full overflow-hidden rounded-xl bg-black/10 ${
      status ? "cursor-default" : "cursor-pointer"
    }`}
    style={{ aspectRatio: frameRatio(att.width, att.height) }}
  >
    {children}
    <MediaOverlay status={status} progress={progress} />
  </button>
);

const ImageAttachment = ({ att, onOpen, status, progress }) => (
  <MediaFrame att={att} onOpen={onOpen} status={status} progress={progress}>
    <img
      src={status ? att.url : imageThumbUrl(att.url)}
      alt={att.name || "Photo"}
      loading="lazy"
      draggable={false}
      className="w-full h-full object-cover"
    />
  </MediaFrame>
);

const VideoAttachment = ({ att, onOpen, status, progress }) => {
  const poster = status ? null : videoPosterUrl(att.url);
  const [posterFailed, setPosterFailed] = useState(false);

  return (
    <MediaFrame att={att} onOpen={onOpen} status={status} progress={progress}>
      {poster && !posterFailed ? (
        <img
          src={poster}
          alt=""
          loading="lazy"
          draggable={false}
          onError={() => setPosterFailed(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <video
          src={att.url}
          preload="metadata"
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      )}
      {!status && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </span>
        </span>
      )}
      <span className="absolute bottom-0 inset-x-0 px-2 py-1.5 flex items-center gap-1 text-[11px] font-medium text-white bg-gradient-to-t from-black/60 to-transparent">
        <Video className="w-3.5 h-3.5" />
        {formatDuration(att.duration)}
      </span>
    </MediaFrame>
  );
};

const DocumentAttachment = ({ att, mine, status, progress }) => {
  const { t } = useTheme();
  const ready = !status && att.url;

  return (
    <div
      className={`w-[240px] sm:w-[280px] max-w-full flex items-center gap-3 p-2 rounded-xl ${
        mine ? "bg-white/15" : t("bg-white/5", "bg-stone-100")
      }`}
    >
      <button
        type="button"
        onClick={() => ready && window.open(att.url, "_blank", "noopener,noreferrer")}
        className={`flex items-center gap-3 min-w-0 flex-1 text-left ${ready ? "cursor-pointer" : "cursor-default"}`}
        title={ready ? `Open ${att.name}` : att.name}
      >
        <DocChip name={att.name} />
        <span className="min-w-0">
          <span className="block text-sm font-medium leading-snug line-clamp-2 break-all">
            {att.name}
          </span>
          <span
            className={`block text-[11px] mt-0.5 ${
              mine ? "text-white/75" : t("text-stone-400", "text-stone-500")
            }`}
          >
            {status === "failed" ? "Not sent" : docSubtitle(att)}
          </span>
        </span>
      </button>

      {status === "sending" ? (
        <ProgressRing
          progress={progress}
          size={34}
          className={`shrink-0 ${mine ? "text-white" : "text-amber-500"}`}
        />
      ) : status === "failed" ? (
        <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
      ) : (
        <button
          type="button"
          onClick={() => downloadFile(att.url, att.name)}
          aria-label={`Download ${att.name}`}
          className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer border transition-colors ${
            mine
              ? "border-white/40 text-white hover:bg-white/15"
              : t(
                  "border-white/15 text-stone-300 hover:bg-white/5",
                  "border-stone-300 text-stone-500 hover:bg-stone-200",
                )
          }`}
        >
          <Download className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

/**
 * The file part of a bubble. `msg.attachment` comes from toMessageView (or an
 * optimistic bubble), `msg.status` / `msg.progress` drive the upload overlay.
 */
const MessageAttachment = ({ msg, mine, onOpenMedia }) => {
  const att = msg.attachment;
  // A document still uploading has no URL yet; its card shows the progress.
  if (!att || (!att.url && att.type !== "document")) return null;

  // Only an in-flight or failed send changes how it draws.
  const status = msg.status === "sending" || msg.status === "failed" ? msg.status : null;
  const open = () => onOpenMedia?.(msg);

  if (att.type === "image") {
    return <ImageAttachment att={att} onOpen={open} status={status} progress={msg.progress} />;
  }
  if (att.type === "video") {
    return <VideoAttachment att={att} onOpen={open} status={status} progress={msg.progress} />;
  }
  return <DocumentAttachment att={att} mine={mine} status={status} progress={msg.progress} />;
};

export default MessageAttachment;

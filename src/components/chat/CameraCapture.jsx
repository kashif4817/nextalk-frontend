import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { RefreshCw, X } from "lucide-react";

const errorText = (err) => {
  switch (err?.name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Camera access was blocked. Allow it in your browser's site settings and try again.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "No camera was found on this device.";
    case "NotReadableError":
      return "Your camera is being used by another app.";
    default:
      return "Couldn't start the camera.";
  }
};

/**
 * Webcam capture for desktops (WhatsApp Web's "Camera" option). Phones use a
 * native `capture` file input instead, which opens the real camera app.
 * onCapture receives a JPEG File.
 */
const CameraCapture = ({ onCapture, onClose, onError }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState("user");
  const [canFlip, setCanFlip] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      setReady(false);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => {});
        }
        setReady(true);

        const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
        if (!cancelled) setCanFlip(devices.filter((d) => d.kind === "videoinput").length > 1);
      } catch (err) {
        if (!cancelled) onError?.(errorText(err));
      }
    };

    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    };
    // onError is a toast; re-requesting the camera when it changes would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const capture = () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    // The preview is mirrored for the front camera; save what the user saw.
    if (facing === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
        onCapture(new File([blob], `photo-${stamp}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9,
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-black text-white animate-backdrop-fade"
      role="dialog"
      aria-modal="true"
      aria-label="Take a photo"
    >
      <div className="shrink-0 h-14 flex items-center justify-between px-3">
        <button
          onClick={onClose}
          aria-label="Close camera"
          className="p-2.5 rounded-full hover:bg-white/10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        <p className="text-sm font-semibold">Take photo</p>
        <span className="w-10" />
      </div>

      <div className="relative flex-1 min-h-0 flex items-center justify-center">
        <video
          ref={videoRef}
          muted
          playsInline
          className={`max-h-full max-w-full ${facing === "user" ? "-scale-x-100" : ""}`}
        />
        {!ready && (
          <span className="absolute w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        )}
      </div>

      <div className="shrink-0 h-28 flex items-center justify-center gap-10">
        <span className="w-11" />
        <button
          onClick={capture}
          disabled={!ready}
          aria-label="Take photo"
          className="w-[72px] h-[72px] rounded-full border-4 border-white flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group"
        >
          <span className="w-14 h-14 rounded-full bg-white group-active:scale-90 transition-transform" />
        </button>
        {canFlip ? (
          <button
            onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
            aria-label="Switch camera"
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        ) : (
          <span className="w-11" />
        )}
      </div>
    </div>,
    document.body,
  );
};

export default CameraCapture;

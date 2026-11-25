import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Pause, Play } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const BAR_COUNT = 30;

// Playback speed, shared by every voice note and kept across reloads.
const RATES = [1, 1.5, 2];
const RATE_KEY = "nextalk:voice-rate";

const readRate = () => {
  try {
    const stored = Number(localStorage.getItem(RATE_KEY));
    return RATES.includes(stored) ? stored : 1;
  } catch {
    return 1;
  }
};

const saveRate = (rate) => {
  try {
    localStorage.setItem(RATE_KEY, String(rate));
  } catch {
    // Storage unavailable (private mode): the speed just won't persist.
  }
};

const formatTime = (value) => {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const total = Math.floor(value);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

/**
 * A stable pseudo-waveform. Real peak extraction would mean decoding the whole
 * file on every render; this is derived from the message id so a given message
 * always draws the same shape instead of flickering between renders.
 */
const waveformFor = (seed) => {
  const key = String(seed ?? "voice");
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;

  const bars = [];
  let state = Math.abs(hash) || 1;
  for (let i = 0; i < BAR_COUNT; i++) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    // Bias toward the middle so it reads as speech, not noise.
    const base = (state % 1000) / 1000;
    const shaped = 0.28 + base * 0.62;
    const envelope = Math.sin((i / (BAR_COUNT - 1)) * Math.PI) * 0.25 + 0.75;
    bars.push(Math.min(1, shaped * envelope));
  }
  return bars;
};

/**
 * Voice note player for a chat bubble.
 *
 * `mine` flips the palette to sit on the amber gradient of your own messages;
 * everything else renders against the neutral incoming bubble.
 */
const VoiceMessage = ({ src, mine = false, seed, durationHint = null }) => {
  const { t } = useTheme();
  const audioRef = useRef(null);
  // True while we seek to the end to make the browser measure the length.
  const probingRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(durationHint ?? 0);
  const [failed, setFailed] = useState(false);
  const [rate, setRate] = useState(readRate);

  const bars = useMemo(() => waveformFor(seed), [seed]);

  // Keep React in step with the element, which can also be driven by the OS
  // media keys or by another bubble starting playback.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onMeta = () => {
      if (Number.isFinite(el.duration) && el.duration > 0) {
        setDuration(el.duration);
        return;
      }
      // Browser recordings (MediaRecorder WebM) carry no length in their
      // header, so Chrome reports Infinity until it has read the whole file.
      // Seeking far past the end makes it scan once and report the real
      // length through `durationchange`.
      if (el.duration === Infinity && !probingRef.current) {
        probingRef.current = true;
        el.currentTime = 1e101;
      }
    };

    const onDurationChange = () => {
      if (!Number.isFinite(el.duration) || el.duration <= 0) return;
      setDuration(el.duration);
      if (probingRef.current) {
        probingRef.current = false;
        el.currentTime = 0;
        setCurrent(0);
      }
    };

    const onTime = () => {
      if (!probingRef.current) setCurrent(el.currentTime);
    };
    const onEnded = () => {
      setPlaying(false);
      setCurrent(0);
      el.currentTime = 0;
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => {
      probingRef.current = false;
      setFailed(true);
      setPlaying(false);
    };

    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("durationchange", onDurationChange);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnded);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("error", onError);

    // Metadata may already be in (cached file) before we started listening.
    if (el.readyState >= 1) onMeta();

    return () => {
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("durationchange", onDurationChange);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("error", onError);
    };
  }, [src]);

  const toggle = (e) => {
    e.stopPropagation();
    const el = audioRef.current;
    if (!el || failed) return;

    if (el.paused) {
      // Only one voice note at a time.
      document.querySelectorAll("audio[data-voice-note]").forEach((other) => {
        if (other !== el) other.pause();
      });
      if (probingRef.current) {
        probingRef.current = false;
        el.currentTime = 0;
      }
      // Pick up a speed chosen on another voice note since this one rendered.
      const preferred = readRate();
      el.playbackRate = preferred;
      setRate(preferred);
      el.play().catch(() => setFailed(true));
    } else {
      el.pause();
    }
  };

  const cycleRate = (e) => {
    e.stopPropagation();
    const next = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
    setRate(next);
    saveRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const seekTo = (ratio) => {
    const el = audioRef.current;
    if (!el || !Number.isFinite(el.duration)) return;
    el.currentTime = Math.min(Math.max(ratio, 0), 1) * el.duration;
    setCurrent(el.currentTime);
  };

  const onScrub = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    seekTo((e.clientX - rect.left) / rect.width);
  };

  const onKeyDown = (e) => {
    const el = audioRef.current;
    if (!el || !Number.isFinite(el.duration)) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      el.currentTime = Math.min(el.currentTime + 5, el.duration);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      el.currentTime = Math.max(el.currentTime - 5, 0);
    }
  };

  const progress = duration > 0 ? Math.min(current / duration, 1) : 0;
  const playedBars = Math.round(progress * BAR_COUNT);
  const started = playing || current > 0;

  // ── Palette: on the amber gradient (mine) vs the neutral bubble (theirs) ──
  const buttonClass = mine
    ? "bg-white text-amber-600 hover:bg-amber-50"
    : "bg-amber-500 text-white hover:bg-amber-600";
  const activeBar = mine ? "bg-white" : "bg-amber-500";
  const idleBar = mine ? "bg-white/40" : t("bg-stone-600", "bg-stone-300");
  const metaClass = mine ? "text-white/80" : t("text-stone-400", "text-stone-500");
  const micClass = mine ? "text-white" : "text-amber-500";
  const rateClass = mine
    ? "bg-white/25 text-white hover:bg-white/35"
    : t(
        "bg-white/10 text-stone-200 hover:bg-white/15",
        "bg-stone-200 text-stone-700 hover:bg-stone-300"
      );

  const timeLabel = failed
    ? "Couldn't load audio"
    : started
      ? formatTime(current)
      : duration > 0
        ? formatTime(duration)
        : "--:--";

  return (
    <div className="flex items-center gap-3 w-[220px] sm:w-[250px] py-0.5">
      <audio ref={audioRef} src={src} preload="metadata" data-voice-note />

      <button
        type="button"
        onClick={toggle}
        disabled={failed}
        aria-label={playing ? "Pause voice message" : "Play voice message"}
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${buttonClass}`}
      >
        {playing ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current translate-x-[1px]" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div
          role="slider"
          tabIndex={failed ? -1 : 0}
          aria-label="Seek voice message"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration) || 0}
          aria-valuenow={Math.round(current)}
          onClick={onScrub}
          onKeyDown={onKeyDown}
          className="flex items-center gap-[2px] h-8 cursor-pointer select-none outline-none rounded focus-visible:ring-2 focus-visible:ring-amber-400/60"
        >
          {bars.map((height, i) => (
            <span
              key={i}
              style={{ height: `${Math.round(height * 100)}%` }}
              className={`flex-1 min-w-[2px] rounded-full transition-colors duration-150 ${
                i < playedBars ? activeBar : idleBar
              }`}
            />
          ))}
        </div>

        <div className={`flex items-center justify-between mt-0.5 text-[11px] tabular-nums ${metaClass}`}>
          <span>{timeLabel}</span>
          {failed ? null : started ? (
            // Once playing, the mic gives way to a speed toggle, as in WhatsApp.
            <button
              type="button"
              onClick={cycleRate}
              aria-label={`Playback speed ${rate}×, tap to change`}
              className={`min-w-[34px] px-1.5 py-[1px] rounded-full text-[10px] font-semibold leading-4 transition-colors cursor-pointer ${rateClass}`}
            >
              {rate}×
            </button>
          ) : (
            <Mic className={`w-3.5 h-3.5 ${micClass}`} aria-hidden="true" />
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceMessage;

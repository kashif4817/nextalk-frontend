import { useCallback, useEffect, useRef, useState } from "react";

/** Hard stop — the backend's audio route rejects anything over 5 MB. */
export const MAX_SECONDS = 300;

// First container the browser actually supports. Chrome/Firefox give webm,
// Safari gives mp4. Every entry here is on the backend's allow-list
// (uploadMiddleware.js: webm, mpeg, mp4, ogg, wav).
const CANDIDATE_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg",
];

const pickMimeType = () => {
  if (typeof MediaRecorder === "undefined") return null;
  return (
    CANDIDATE_TYPES.find((type) => MediaRecorder.isTypeSupported?.(type)) ?? ""
  );
};

/**
 * Multer matches `file.mimetype` against an exact list, and a codec suffix
 * ("audio/webm;codecs=opus") is not on it — so the blob's own type can't be
 * used verbatim or the upload 400s. Strip the parameters.
 */
export const baseMimeType = (type) =>
  (type || "audio/webm").split(";")[0].trim();

const EXTENSIONS = {
  "audio/webm": "webm",
  "audio/mp4": "m4a",
  "audio/ogg": "ogg",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
};

export const isRecordingSupported = () =>
  typeof window !== "undefined" &&
  typeof MediaRecorder !== "undefined" &&
  Boolean(navigator.mediaDevices?.getUserMedia);

/**
 * Microphone capture for voice messages.
 *
 * start() begins a take, with a live `seconds` counter and a 0–1 `level` for
 * the meter. stop() resolves with { file, seconds, mimeType } ready to upload,
 * cancel() throws the take away. Either way the mic track is released so the
 * browser's recording indicator goes off.
 *
 * Reaching MAX_SECONDS ends the take on its own and hands it to `onAutoStop`,
 * so a capped recording is still delivered rather than silently dropped.
 */
export const useVoiceRecorder = ({ onAutoStop } = {}) => {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState("");

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const rafRef = useRef(null);
  const audioCtxRef = useRef(null);
  // Elapsed time read from inside the MediaRecorder callback, where the render
  // closure would be stale.
  const secondsRef = useRef(0);
  // Set by cancel() so the stop handler discards instead of delivering.
  const cancelledRef = useRef(false);
  // Resolver for an in-flight stop() call, if the caller asked first.
  const resolverRef = useRef(null);
  // A take that finished without anyone waiting on it (the cap was hit).
  const pendingResultRef = useRef(null);

  // Kept in a ref so a re-render can't leave the recorder calling a stale one.
  const autoStopRef = useRef(onAutoStop);
  useEffect(() => {
    autoStopRef.current = onAutoStop;
  }, [onAutoStop]);

  const releaseHardware = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;

    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
  }, []);

  // Release the mic if the thread unmounts mid-recording.
  useEffect(() => releaseHardware, [releaseHardware]);

  const start = useCallback(async () => {
    if (recorderRef.current?.state === "recording") return false;
    setError("");

    if (!isRecordingSupported()) {
      setError("Your browser can't record audio.");
      return false;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (e) {
      setError(
        e?.name === "NotAllowedError"
          ? "Microphone access was blocked. Allow it in your browser settings."
          : e?.name === "NotFoundError"
            ? "No microphone found."
            : "Could not start recording."
      );
      return false;
    }

    streamRef.current = stream;
    chunksRef.current = [];
    cancelledRef.current = false;
    resolverRef.current = null;
    pendingResultRef.current = null;
    secondsRef.current = 0;

    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType } : undefined
    );
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data?.size > 0) chunksRef.current.push(e.data);
    };

    // Attached once, here — whether the take ends from stop(), cancel() or the
    // duration cap, finalisation runs through this one path.
    recorder.onstop = () => {
      const type = baseMimeType(recorder.mimeType || chunksRef.current[0]?.type);
      const blob = new Blob(chunksRef.current, { type });
      chunksRef.current = [];

      releaseHardware();
      setRecording(false);
      setLevel(0);

      const discarded = cancelledRef.current || blob.size === 0;
      const result = discarded
        ? null
        : {
            file: new File(
              [blob],
              `voice-${Date.now()}.${EXTENSIONS[type] ?? "webm"}`,
              { type } // explicit clean type — see baseMimeType above
            ),
            seconds: Math.max(1, secondsRef.current),
            mimeType: type,
          };

      if (resolverRef.current) {
        const resolve = resolverRef.current;
        resolverRef.current = null;
        resolve(result);
      } else if (result) {
        // Nobody was waiting: the cap ended it. Hand it over, or hold it for
        // the stop() that is about to arrive.
        if (autoStopRef.current) autoStopRef.current(result);
        else pendingResultRef.current = result;
      }
    };

    // Timeslice means data lands periodically, so a crash still leaves usable
    // chunks rather than one all-or-nothing blob.
    recorder.start(250);

    setRecording(true);
    setSeconds(0);

    timerRef.current = setInterval(() => {
      secondsRef.current += 1;
      setSeconds(secondsRef.current);
      if (secondsRef.current >= MAX_SECONDS) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      }
    }, 1000);

    // Live input level for the meter. Purely cosmetic — if the audio graph
    // can't be built, recording still works.
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      const buffer = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(buffer);
        let peak = 0;
        for (let i = 0; i < buffer.length; i++) {
          peak = Math.max(peak, Math.abs(buffer[i] - 128) / 128);
        }
        setLevel(peak);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setLevel(0);
    }

    return true;
  }, [releaseHardware]);

  /** Resolves with { file, seconds, mimeType }, or null if there's nothing usable. */
  const stop = useCallback(
    () =>
      new Promise((resolve) => {
        // The cap already finalised this take.
        if (pendingResultRef.current) {
          const result = pendingResultRef.current;
          pendingResultRef.current = null;
          resolve(result);
          return;
        }

        const recorder = recorderRef.current;
        if (!recorder || recorder.state === "inactive") {
          releaseHardware();
          setRecording(false);
          resolve(null);
          return;
        }

        resolverRef.current = resolve;
        recorder.stop();
      }),
    [releaseHardware]
  );

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    pendingResultRef.current = null;

    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop(); // onstop sees the flag and discards
    } else {
      releaseHardware();
      setRecording(false);
    }

    chunksRef.current = [];
    secondsRef.current = 0;
    setSeconds(0);
    setLevel(0);
  }, [releaseHardware]);

  return { recording, seconds, level, error, start, stop, cancel, setError };
};

export default useVoiceRecorder;

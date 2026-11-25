// A short two-note chime for incoming messages, synthesised with Web Audio so
// there's no sound file to ship.
//
// Browsers only allow audio after the user has interacted with the page, so
// the context is created on the first click/keypress (unlockSound) and reused.
// Once running, it keeps playing while the tab is in the background.

let ctx = null;

export const unlockSound = () => {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  if (!ctx) ctx = new AudioCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
};

export const playMessageSound = () => {
  if (!ctx || ctx.state !== "running") return;

  const now = ctx.currentTime;
  const notes = [
    [880, 0], // A5
    [1318.5, 0.11], // E6
  ];

  for (const [freq, offset] of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;

    const start = now + offset;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.16, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);

    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.3);
  }
};

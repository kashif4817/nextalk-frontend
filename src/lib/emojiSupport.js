// Which emoji can this device actually draw?
//
// Emoji fonts lag behind Unicode, and Windows draws no country flags at all
// (just the two letters). Showing those in the picker would mean tofu boxes.
// A handful of canvas probes, run once per device and remembered, is enough:
// one sample per recent emoji version, one country flag, one subdivision
// flag. That replaces checking every glyph as it scrolls into view, which is
// what made the old picker stall.

const CACHE_KEY = "nextalk:emoji-support:v1";

/** The stack the picker renders with; the probes must measure the same fonts. */
export const EMOJI_FONT =
  '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", "Segoe UI Symbol", sans-serif';

const SIZE = 40;

const makeContext = () => {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.font = `28px ${EMOJI_FONT}`;
    ctx.textBaseline = "top";
    ctx.fillStyle = "#000";
    return ctx;
  } catch {
    return null;
  }
};

const pixels = (ctx, text) => {
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.fillText(text, 2, 2);
  return ctx.getImageData(0, 0, SIZE, SIZE).data;
};

/** Emoji art is coloured; a missing glyph (box, letters) is drawn in the black fill. */
const isColourful = (data) => {
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 50) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (Math.abs(r - g) > 24 || Math.abs(g - b) > 24 || Math.abs(r - b) > 24) return true;
  }
  return false;
};

const same = (a, b) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};

/**
 * @param samples { [version]: char } one emoji per version worth checking
 * @param persist  remember the answer in localStorage (off for temp chats,
 *                 which must leave nothing in storage)
 * @returns { versions: { [version]: boolean }, countryFlags, subdivisionFlags }
 *          Anything not probed counts as supported.
 */
export const probeEmojiSupport = (samples, { persist = true } = {}) => {
  const fingerprint = `${navigator.userAgent}|${Object.keys(samples).sort().join(",")}`;
  if (persist) {
    try {
      const saved = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (saved?.fingerprint === fingerprint) return saved.result;
    } catch {
      // Unreadable cache: probe again.
    }
  }

  const ctx = makeContext();
  // No canvas (or readback blocked): show everything rather than nothing.
  if (!ctx) return { versions: {}, countryFlags: true, subdivisionFlags: true };

  const reference = ctx.measureText("😀").width || 28;
  const draws = (char) =>
    // A sequence the font can't join falls apart into several glyphs, so it
    // comes out much wider than one emoji.
    ctx.measureText(char).width <= reference * 1.6 && isColourful(pixels(ctx, char));

  const versions = {};
  for (const [version, char] of Object.entries(samples)) versions[version] = draws(char);

  const result = {
    versions,
    countryFlags: draws("🇺🇸"),
    // Unsupported tag sequences render as the plain black flag they start with.
    subdivisionFlags: !same(pixels(ctx, "🏴󠁧󠁢󠁥󠁮󠁧󠁿"), pixels(ctx, "🏴")),
  };

  if (persist) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ fingerprint, result }));
    } catch {
      // Storage full or blocked: we'll just probe again next time.
    }
  }
  return result;
};

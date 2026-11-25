// The emoji list for the picker, filtered to what this device can draw, and a
// warm-up that makes the picker open instantly.
//
// Why a warm-up: the first time Chrome lays out a colour emoji at a given size
// it does expensive per-glyph work (≈1 ms each on Windows), and an emoji card
// shows hundreds at once. Chrome keeps that work for the rest of the page, so
// laying every emoji out once, invisibly and in idle slices, turns a ~1 s
// first open into ~40 ms (measured).

import data from "emoji-picker-react/data/emojis-en";
import { EMOJI_FONT, probeEmojiSupport } from "./emojiSupport";

/** Must match .nx-e in components/chat/emojiPanel.css, or the warm-up misses. */
export const EMOJI_CELL_FONT_SIZE = 30;

// WhatsApp's order and names.
export const EMOJI_SECTIONS = [
  { id: "smileys_people", label: "Smileys & People" },
  { id: "animals_nature", label: "Animals & Nature" },
  { id: "food_drink", label: "Food & Drink" },
  { id: "activities", label: "Activity" },
  { id: "travel_places", label: "Travel & Places" },
  { id: "objects", label: "Objects" },
  { id: "symbols", label: "Symbols" },
  { id: "flags", label: "Flags" },
];

const toChar = (unified) =>
  unified
    .split("-")
    .map((hex) => String.fromCodePoint(parseInt(hex, 16)))
    .join("");

const isCountryFlag = (u) => /^1f1(e[6-9a-f]|f[0-9a-f])-/.test(u);
const isSubdivisionFlag = (u) => u.startsWith("1f3f4-e00");

// Emoji 1.0–5.0 (2015–2017) are on every current device; newer ones vary.
const PROBED_VERSIONS = ["11", "12", "12.1", "13", "13.1", "14", "15", "15.1", "16"];

let catalog = null;

/**
 * { sections: [{ id, label, items }], byChar, all }, built once per page.
 * Items are { c: char, n: name, k: search keywords, t?: skin-tone chars }.
 * `persist` lets the device probe cache its answer (off for temp chats).
 */
export const getEmojiCatalog = (persist = true) => {
  if (catalog) return catalog;

  // One sample per version, preferring a single code point (easiest to judge).
  const samples = {};
  for (const version of PROBED_VERSIONS) {
    const all = Object.values(data.emojis)
      .flat()
      .filter((e) => e.a === version);
    const pick = all.find((e) => !e.u.includes("-")) ?? all[0];
    if (pick) samples[version] = toChar(pick.u);
  }
  const support = probeEmojiSupport(samples, { persist });
  const drawable = (e) =>
    support.versions[e.a] !== false &&
    (support.countryFlags || !isCountryFlag(e.u)) &&
    (support.subdivisionFlags || !isSubdivisionFlag(e.u));

  const byChar = new Map();
  const sections = EMOJI_SECTIONS.map((s) => ({
    ...s,
    items: (data.emojis[s.id] || []).filter(drawable).map((e) => {
      const item = {
        c: toChar(e.u),
        // The last name is the full one ("waving hand"); the rest are keywords.
        n: e.n[e.n.length - 1],
        k: e.n.join(" ").toLowerCase(),
        t: e.v?.map(toChar),
      };
      byChar.set(item.c, item);
      item.t?.forEach((c) => byChar.set(c, { ...item, c }));
      return item;
    }),
  })).filter((s) => s.items.length);

  catalog = { sections, byChar, all: sections.flatMap((s) => s.items) };
  return catalog;
};

// ── Warm-up ─────────────────────────────────────────────────────────────────

let warming = false;

const whenIdle = (fn) =>
  window.requestIdleCallback ? window.requestIdleCallback(fn) : setTimeout(() => fn({ timeRemaining: () => 8 }), 50);

/**
 * Lay out every emoji once, off screen, a few at a time while the browser is
 * idle, so opening the picker and switching its tabs never waits on glyphs.
 * Safe to call repeatedly; does the work once per page.
 * `extra` (e.g. recents) goes first, then the tabs in order.
 */
export const warmEmojiGlyphs = ({ persist = true, extra = [] } = {}) => {
  if (warming || typeof document === "undefined") return;
  warming = true;

  whenIdle(() => {
    const { sections } = getEmojiCatalog(persist);
    const chars = [...extra, ...sections.flatMap((s) => s.items.map((it) => it.c))];

    const box = document.createElement("div");
    box.setAttribute("aria-hidden", "true");
    Object.assign(box.style, {
      position: "fixed",
      left: "-10000px",
      top: "0",
      width: "560px",
      visibility: "hidden",
      pointerEvents: "none",
      fontFamily: EMOJI_FONT,
      fontSize: `${EMOJI_CELL_FONT_SIZE}px`,
      lineHeight: "1",
    });
    document.body.appendChild(box);

    let i = 0;
    const CHUNK = 24;
    const step = (deadline) => {
      do {
        // One chunk at a time (Chrome keeps the glyph work after it's gone),
        // so each forced layout only covers the new chunk.
        const chunk = document.createElement("div");
        chunk.textContent = chars.slice(i, i + CHUNK).join(" ");
        box.replaceChildren(chunk);
        // Lay it out now, inside the idle slice, not in the next frame.
        void box.offsetHeight;
        i += CHUNK;
      } while (i < chars.length && deadline.timeRemaining() > 6);

      if (i < chars.length) whenIdle(step);
      else box.remove();
    };
    whenIdle(step);
  });
};

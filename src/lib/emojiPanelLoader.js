// Gets the emoji card ready ahead of time, so the first tap on 😀 opens it at
// once: its code is downloaded at idle (it isn't in the main bundle), then
// every emoji glyph is laid out off screen in idle slices (see
// lib/emojiCatalog.js for why that matters: ~1 s first open -> ~40 ms).

import { useEffect, useState } from "react";

let promise = null;
let loaded = null;

/** Start (or reuse) the download. Resolves to the EmojiPanel component. */
export const loadEmojiPanel = () =>
  (promise ??= import("../components/chat/EmojiPanel")
    .then((m) => (loaded = m.default))
    .catch((err) => {
      promise = null; // let a later attempt retry
      throw err;
    }));

/** Lay every emoji out once at idle (no-op after the first call). */
const warm = (persist) =>
  import("./emojiCatalog")
    .then((m) => m.warmEmojiGlyphs({ persist }))
    .catch(() => {});

/**
 * The EmojiPanel component, or null until its code has arrived. Preloads it
 * (and warms its glyphs) once the browser is idle, and right away when
 * `wanted` (the card is open). Pass `persist: false` for temp chats, which
 * must leave nothing in storage.
 */
export const useEmojiPanel = (wanted, { persist = true } = {}) => {
  const [Panel, setPanel] = useState(() => loaded);

  useEffect(() => {
    if (Panel) return;
    let live = true;
    const load = () =>
      loadEmojiPanel()
        .then((C) => {
          if (live) setPanel(() => C);
          warm(persist);
        })
        .catch(() => {});

    if (wanted) {
      load();
      return () => {
        live = false;
      };
    }
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(load, { timeout: 4000 })
      : setTimeout(load, 2000);
    return () => {
      live = false;
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else clearTimeout(idle);
    };
  }, [Panel, wanted, persist]);

  return Panel;
};

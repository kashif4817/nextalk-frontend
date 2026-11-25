// Loads the emoji card's code ahead of time, so the first tap on 😀 opens it
// at once instead of waiting on a download (it isn't in the main bundle).

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

/**
 * The EmojiPanel component, or null until its code has arrived. Preloads it
 * once the browser is idle, and right away when `wanted` (the card is open).
 */
export const useEmojiPanel = (wanted) => {
  const [Panel, setPanel] = useState(() => loaded);

  useEffect(() => {
    if (Panel) return;
    let live = true;
    const load = () =>
      loadEmojiPanel()
        .then((C) => live && setPanel(() => C))
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
  }, [Panel, wanted]);

  return Panel;
};

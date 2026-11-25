// TEMPORARY: measures how fast the emoji card opens and switches tabs.
// Deleted after measuring.
import { Suspense, lazy, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { ThemeProvider } from "./context/ThemeContext.jsx";

const EmojiPanel = lazy(() => import("./components/chat/EmojiPanel.jsx"));

const marks = (window.__marks = {});
new MutationObserver(() => {
  const now = performance.now();
  if (!marks.panel && document.querySelector(".nx-emoji")) marks.panel = now;
  if (!marks.firstEmoji && document.querySelector('[data-epr-part="emoji"]')) marks.firstEmoji = now;
}).observe(document.body, { subtree: true, childList: true });

const scroller = () => {
  const root = document.querySelector(".nx-emoji");
  return [...root.querySelectorAll("*")].find(
    (el) => el.scrollHeight > el.clientHeight + 20 && getComputedStyle(el).overflowY !== "visible",
  );
};

const visibleEmoji = (vp) => {
  const r = vp.getBoundingClientRect();
  return [...vp.querySelectorAll('[data-epr-part="emoji"]')].filter((e) => {
    const b = e.getBoundingClientRect();
    return b.bottom > r.top + 4 && b.top < r.bottom - 4;
  });
};

// Click tab i and time: scroll jump, then a screenful of emoji cells in place.
window.__tab = async (i) => {
  const tabs = document.querySelectorAll('[data-epr-part="category-tab"]');
  const vp = scroller();
  const before = vp.scrollTop;
  const t0 = performance.now();
  tabs[i].click();
  let scrolled = null;
  let filled = null;
  let worstFrame = 0;
  let last = t0;
  for (let f = 0; f < 240; f++) {
    await new Promise((r) => requestAnimationFrame(r));
    const now = performance.now();
    worstFrame = Math.max(worstFrame, now - last);
    last = now;
    if (scrolled === null && vp.scrollTop !== before) scrolled = now - t0;
    if (scrolled !== null && visibleEmoji(vp).length >= 40) {
      filled = now - t0;
      break;
    }
  }
  return {
    tab: tabs[i].getAttribute("aria-label") || i,
    scrolledMs: Math.round(scrolled ?? -1),
    filledMs: Math.round(filled ?? -1),
    worstFrameMs: Math.round(worstFrame),
  };
};

const App = () => {
  const [open, setOpen] = useState(false);
  window.__open = () => {
    marks.click = performance.now();
    setOpen(true);
  };
  return (
    <div className="h-screen relative bg-stone-100">
      {open && (
        <div className="absolute bottom-16 left-2 w-[560px] rounded-2xl border bg-white shadow-2xl overflow-hidden">
          <Suspense fallback={<div id="fallback" style={{ height: 420 }} />}>
            <EmojiPanel onPick={() => {}} height={420} />
          </Suspense>
        </div>
      )}
    </div>
  );
};

localStorage.setItem("nextalk:theme-mode", "light");
createRoot(document.getElementById("root")).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>,
);

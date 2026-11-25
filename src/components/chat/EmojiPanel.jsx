import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Car,
  Cat,
  Clock,
  Coffee,
  Flag,
  Lightbulb,
  Search,
  Shapes,
  Smile,
  Volleyball,
  X,
} from "lucide-react";
import data from "emoji-picker-react/data/emojis-en";
import { useTheme } from "../../context/ThemeContext";
import { isTouchFirst } from "../../lib/attachments";
import { EMOJI_FONT, probeEmojiSupport } from "../../lib/emojiSupport";
import "./emojiPanel.css";

// A plain, fast emoji grid in WhatsApp Web's layout. Only the emoji list
// comes from emoji-picker-react; its picker checked every glyph on a canvas as
// it scrolled into view, which stalled each tab switch for ~0.4s. Here the
// device is probed once (lib/emojiSupport.js) and off-screen sections are
// skipped by the browser until they're near (content-visibility).

const CELL = 44; // px, one grid cell (see emojiPanel.css)
const RECENTS_KEY = "nextalk:emoji-recent";
const MAX_RECENTS = 24;
const HOLD_MS = 450;

const SECTIONS = [
  { id: "smileys_people", label: "Smileys & People", icon: Smile },
  { id: "animals_nature", label: "Animals & Nature", icon: Cat },
  { id: "food_drink", label: "Food & Drink", icon: Coffee },
  { id: "activities", label: "Activity", icon: Volleyball },
  { id: "travel_places", label: "Travel & Places", icon: Car },
  { id: "objects", label: "Objects", icon: Lightbulb },
  { id: "symbols", label: "Symbols", icon: Shapes },
  { id: "flags", label: "Flags", icon: Flag },
];
const RECENT = { id: "recent", label: "Recent", icon: Clock };

// ── The catalogue (built once per page) ─────────────────────────────────────

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

const buildCatalog = (persist) => {
  if (catalog) return catalog;

  // One sample per version, preferring a single code point (easiest to judge).
  const samples = {};
  for (const version of PROBED_VERSIONS) {
    const all = Object.values(data.emojis).flat().filter((e) => e.a === version);
    const pick = all.find((e) => !e.u.includes("-")) ?? all[0];
    if (pick) samples[version] = toChar(pick.u);
  }
  const support = probeEmojiSupport(samples, { persist });
  const drawable = (e) =>
    support.versions[e.a] !== false &&
    (support.countryFlags || !isCountryFlag(e.u)) &&
    (support.subdivisionFlags || !isSubdivisionFlag(e.u));

  const byChar = new Map();
  const sections = SECTIONS.map((s) => ({
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

// ── Recents (never touched in a temp chat) ──────────────────────────────────

const readRecents = () => {
  try {
    const list = JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
    return Array.isArray(list) ? list.filter((c) => typeof c === "string") : [];
  } catch {
    return [];
  }
};

const rememberRecent = (char) => {
  try {
    const next = [char, ...readRecents().filter((c) => c !== char)].slice(0, MAX_RECENTS);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable: recents just won't update.
  }
};

// ── Component ───────────────────────────────────────────────────────────────

const Cell = ({ item }) => (
  <button
    type="button"
    className={item.t ? "nx-e nx-e--tones" : "nx-e"}
    data-e={item.c}
    aria-label={item.n}
    title={item.n}
  >
    {item.c}
  </button>
);

/**
 * WhatsApp Web's emoji card: category tabs across the top, a search pill
 * under them, then "Recent" and the full set. Press and hold (or right-click)
 * an emoji with skin tones to choose one. Stays open while you pick several.
 *
 * `ephemeral` (temp chat): no Recent row, and nothing is read from or written
 * to storage at all.
 */
const EmojiPanel = ({ onPick, height = 420, ephemeral = false }) => {
  const { t, dark } = useTheme();
  const { sections: base, byChar, all } = useMemo(() => buildCatalog(!ephemeral), [ephemeral]);

  // Recents as they were when the card opened, so the grid doesn't shift
  // under the pointer while you pick several in a row (saved for next time).
  const [recents] = useState(() =>
    ephemeral
      ? []
      : readRecents()
          .map((c) => byChar.get(c))
          .filter(Boolean),
  );
  const sections = useMemo(
    () => (recents.length ? [{ ...RECENT, items: recents }, ...base] : base),
    [recents, base],
  );

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(sections[0]?.id);
  const [tones, setTones] = useState(null); // { item, x, y }
  const [cols, setCols] = useState(12);

  const rootRef = useRef(null);
  const scrollRef = useRef(null);
  const sectionRefs = useRef({});
  const pendingJump = useRef(null);
  const hold = useRef({ timer: 0, fired: false });
  const spyFrame = useRef(0);

  // Column count drives each section's reserved height while it's skipped.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setCols(Math.max(1, Math.floor((el.clientWidth - 24) / CELL)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const results = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return null;
    return all.filter((it) => words.every((w) => it.k.includes(w))).slice(0, 200);
  }, [query, all]);

  // A tab clicked while searching jumps once the sections are back.
  useLayoutEffect(() => {
    if (results || !pendingJump.current) return;
    const id = pendingJump.current;
    pendingJump.current = null;
    const el = sectionRefs.current[id];
    if (el && scrollRef.current) scrollRef.current.scrollTop = el.offsetTop;
  }, [results]);

  useEffect(() => () => cancelAnimationFrame(spyFrame.current), []);

  const pick = (char) => {
    onPick(char);
    if (!ephemeral) rememberRecent(char);
  };

  const jump = (id) => {
    setActive(id);
    setTones(null);
    if (results) {
      pendingJump.current = id;
      setQuery("");
      return;
    }
    const el = sectionRefs.current[id];
    if (el && scrollRef.current) scrollRef.current.scrollTop = el.offsetTop;
  };

  // Highlight the tab of the section you've scrolled to.
  const onScroll = () => {
    if (tones) setTones(null);
    if (results || spyFrame.current) return;
    spyFrame.current = requestAnimationFrame(() => {
      spyFrame.current = 0;
      const top = (scrollRef.current?.scrollTop ?? 0) + 12;
      let current = sections[0]?.id;
      for (const s of sections) {
        const el = sectionRefs.current[s.id];
        if (el && el.offsetTop <= top) current = s.id;
      }
      setActive((a) => (a === current ? a : current));
    });
  };

  // ── One set of handlers for every cell (event delegation) ──
  const cellOf = (e) => e.target.closest?.("[data-e]");

  const openTones = (el) => {
    const item = byChar.get(el.dataset.e);
    if (!item?.t || !rootRef.current) return;
    const root = rootRef.current.getBoundingClientRect();
    const cell = el.getBoundingClientRect();
    setTones({ item, x: cell.left - root.left + cell.width / 2, y: cell.top - root.top });
  };

  const handlers = {
    onClick: (e) => {
      const el = cellOf(e);
      if (!el) return;
      if (hold.current.fired) {
        hold.current.fired = false; // the hold opened tones; this is its click
        return;
      }
      pick(el.dataset.e);
    },
    onContextMenu: (e) => {
      const el = cellOf(e);
      if (!el?.classList.contains("nx-e--tones")) return;
      e.preventDefault();
      openTones(el);
    },
    onPointerDown: (e) => {
      const el = cellOf(e);
      hold.current.fired = false;
      if (!el?.classList.contains("nx-e--tones") || e.button !== 0) return;
      clearTimeout(hold.current.timer);
      hold.current.timer = setTimeout(() => {
        hold.current.fired = true;
        openTones(el);
      }, HOLD_MS);
    },
    onPointerUp: () => clearTimeout(hold.current.timer),
    onPointerLeave: () => clearTimeout(hold.current.timer),
    onPointerCancel: () => clearTimeout(hold.current.timer),
  };

  const muted = t("text-stone-400", "text-stone-500");

  return (
    <div
      ref={rootRef}
      className="nx-emoji relative flex flex-col"
      style={{
        height,
        "--nx-emoji-font": EMOJI_FONT,
        "--nx-hover": dark ? "#292524" : "#f5f5f4",
        "--nx-tone-mark": dark ? "#57534e" : "#d6d3d1",
      }}
    >
      {/* Tabs */}
      <div role="tablist" aria-label="Emoji categories" className="shrink-0 flex px-2 pt-2">
        {sections.map(({ id, label, icon: Icon }) => {
          const on = !results && active === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={on}
              aria-label={label}
              title={label}
              onClick={() => jump(id)}
              className={`relative flex-1 flex justify-center py-2.5 rounded-lg cursor-pointer transition-colors ${
                on
                  ? "text-amber-500"
                  : t("text-stone-500 hover:text-stone-300", "text-stone-400 hover:text-stone-600")
              }`}
            >
              <Icon className="w-5 h-5" />
              <span
                className={`absolute bottom-0 h-[3px] w-6 rounded-full transition-colors ${
                  on ? "bg-amber-500" : "bg-transparent"
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="shrink-0 px-3.5 pt-3 pb-1.5">
        <label
          className={`flex items-center gap-2.5 h-10 px-4 rounded-full border-2 transition-colors focus-within:border-amber-500 ${t(
            "border-stone-700 bg-stone-900",
            "border-stone-200 bg-white",
          )}`}
        >
          <Search className={`w-4 h-4 shrink-0 ${muted}`} />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setTones(null);
              if (scrollRef.current) scrollRef.current.scrollTop = 0;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results?.[0]) {
                e.preventDefault();
                pick(results[0].c);
              }
            }}
            placeholder="Search emoji"
            aria-label="Search emoji"
            // Desktop: type to search straight away, like WhatsApp Web. On a
            // phone that would throw up the keyboard over the card.
            autoFocus={!isTouchFirst()}
            className={`flex-1 min-w-0 bg-transparent outline-none text-sm ${t(
              "text-stone-100 placeholder-stone-500",
              "text-stone-900 placeholder-stone-400",
            )}`}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className={`shrink-0 cursor-pointer ${muted}`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </label>
      </div>

      {/* Grid */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        {...handlers}
        className="nx-scroll relative flex-1 min-h-0 overflow-y-auto px-3 pb-3"
      >
        {results ? (
          results.length ? (
            <div className="nx-grid pt-1">
              {results.map((it) => (
                <Cell key={it.c} item={it} />
              ))}
            </div>
          ) : (
            <p className={`py-10 text-center text-sm ${muted}`}>No emoji found</p>
          )
        ) : (
          sections.map((s) => (
            <section
              key={s.id}
              ref={(el) => {
                sectionRefs.current[s.id] = el;
              }}
              aria-label={s.label}
            >
              <h3 className={`px-1 pt-3 pb-1.5 text-sm font-medium ${muted}`}>{s.label}</h3>
              <div
                className="nx-grid nx-grid--lazy"
                // Reserve the section's real height while the browser skips it,
                // so tab jumps land exactly.
                style={{ containIntrinsicSize: `auto ${Math.ceil(s.items.length / cols) * CELL}px` }}
              >
                {s.items.map((it) => (
                  <Cell key={it.c} item={it} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Skin tones (press and hold / right-click) */}
      {tones && (
        <>
          <div className="absolute inset-0 z-10" onPointerDown={() => setTones(null)} />
          <div
            role="dialog"
            aria-label={`${tones.item.n}: choose a skin tone`}
            className={`absolute z-20 flex gap-0.5 p-1.5 rounded-2xl border shadow-xl -translate-x-1/2 -translate-y-full animate-modal-pop ${t(
              "bg-stone-800 border-white/10",
              "bg-white border-stone-200",
            )}`}
            style={{
              left: Math.min(Math.max(tones.x, 150), (rootRef.current?.clientWidth ?? 300) - 150),
              top: Math.max(tones.y - 6, 60),
            }}
          >
            {[tones.item.c, ...tones.item.t].map((c) => (
              <button
                key={c}
                type="button"
                className="nx-e w-11"
                aria-label={c}
                onClick={() => {
                  pick(c);
                  setTones(null);
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default EmojiPanel;

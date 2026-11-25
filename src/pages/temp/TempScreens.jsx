import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Copy,
  EyeOff,
  Flame,
  Ghost,
  Link2,
  Loader2,
  ServerOff,
  Share2,
  Timer,
  UserX,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import NexTalkLogo from "../../components/NexTalkLogo";

// The temp-chat screens around the conversation (start, waiting, joining,
// ended), laid out as full pages: two columns on wide screens, stacked on
// phones.

const useStyles = () => {
  const { t } = useTheme();
  return {
    t,
    muted: t("text-stone-400", "text-stone-500"),
    body: t("text-stone-300", "text-stone-600"),
    primary:
      "inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-base font-semibold shadow-xl shadow-amber-500/25 hover:from-amber-600 hover:to-orange-600 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100",
    ghostBtn: `inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-base font-semibold border transition-colors ${t(
      "border-white/10 text-stone-300 hover:bg-white/5",
      "border-stone-200 text-stone-600 hover:bg-white"
    )}`,
    tile: `rounded-2xl border ${t(
      "bg-white/[0.03] border-white/10",
      "bg-white/70 border-stone-200/80 shadow-sm"
    )}`,
    chip: t("bg-amber-500/15 text-amber-400", "bg-amber-100 text-amber-600"),
  };
};

/** Page frame: logo header, soft amber glow, content centred in the rest. */
export const TempShell = ({ children }) => {
  const { t } = useTheme();
  return (
    <div
      className={`relative min-h-dvh flex flex-col overflow-hidden ${t(
        "bg-stone-950 text-stone-100",
        "bg-stone-50 text-stone-900"
      )}`}
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -top-64 -left-40 w-[52rem] h-[52rem] rounded-full blur-3xl ${t(
          "bg-amber-500/10",
          "bg-amber-300/30"
        )}`}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -bottom-72 -right-48 w-[40rem] h-[40rem] rounded-full blur-3xl ${t(
          "bg-orange-500/10",
          "bg-orange-200/40"
        )}`}
      />

      <header className="relative z-10 flex items-center justify-between px-5 sm:px-10 py-5">
        <Link to="/" className="flex items-center gap-2.5" aria-label="NexTalk home">
          <NexTalkLogo className="w-8 h-8" />
          <span className="text-lg font-bold tracking-tight">
            Nex<span className="text-amber-500">Talk</span>
          </span>
        </Link>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${t(
            "bg-amber-500/10 border-amber-500/20 text-amber-300",
            "bg-white border-amber-200 text-amber-700"
          )}`}
        >
          <Ghost className="w-3.5 h-3.5" />
          Temp chat
        </span>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-5 sm:px-10 pt-4 pb-14">
        {children}
      </main>
    </div>
  );
};

const IconBadge = ({ icon: Icon, tilt = false }) => (
  <div className="relative inline-block">
    <div className="absolute inset-0 rounded-3xl bg-amber-500/30 blur-xl" />
    <div
      className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30 ${
        tilt ? "-rotate-6" : ""
      }`}
    >
      <Icon className="w-8 h-8 sm:w-10 sm:h-10" />
    </div>
  </div>
);

const Eyebrow = ({ children }) => {
  const { t } = useTheme();
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${t(
        "bg-amber-500/10 text-amber-300",
        "bg-amber-100/80 text-amber-700"
      )}`}
    >
      {children}
    </span>
  );
};

// ── Start ─────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: UserX, title: "No sign-up", text: "Nobody needs an account. You both show up as Anonymous." },
  { icon: ServerOff, title: "Nothing saved", text: "Not on our server and not in your browser. Messages only pass through." },
  { icon: Flame, title: "Self-destructs", text: "Ends when either of you ends it, or 10 minutes after someone leaves. Then it's gone for good." },
  { icon: EyeOff, title: "Screen shield", text: "The chat blurs whenever the window isn't in front of you." },
];

export const TempLanding = ({ onStart, starting }) => {
  const { muted, body, primary, ghostBtn, tile, chip } = useStyles();
  return (
    <div className="w-full max-w-6xl grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-20 items-center">
      <div className="text-center lg:text-left">
        <IconBadge icon={Ghost} tilt />
        <div className="mt-8">
          <Eyebrow>Anonymous · Temporary</Eyebrow>
        </div>
        <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
          Start a{" "}
          <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
            temp chat
          </span>
        </h1>
        <p className={`mt-5 max-w-xl mx-auto lg:mx-0 text-base sm:text-lg leading-relaxed ${body}`}>
          Get a private link, send it to anyone, and talk. When the chat ends, every message is
          gone for good.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
          <button onClick={onStart} disabled={starting} className={primary}>
            {starting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating your chat…
              </>
            ) : (
              <>
                Start temp chat
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          <Link to="/" className={ghostBtn}>
            Back to NexTalk
          </Link>
        </div>

        <p className={`mt-6 text-xs ${muted}`}>
          No website can fully block screenshots, so only share what you're comfortable with.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FEATURES.map(({ icon: Icon, title, text }, i) => (
          <div
            key={title}
            className={`${tile} p-5 sm:p-6 ${i % 2 === 1 ? "sm:translate-y-6" : ""}`}
          >
            <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${chip}`}>
              <Icon className="w-5 h-5" />
            </span>
            <p className="mt-4 text-base font-semibold">{title}</p>
            <p className={`mt-1.5 text-sm leading-relaxed ${muted}`}>{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── The two seats: you, and the other person ──────────────────────────────
/**
 * `state`:
 *   "waiting"   nobody has joined yet      You  ···  (?)  Waiting…
 *   "away"      they dropped, may return   You  ···  (?)  Reconnecting…
 *   "connected" you're both here           You  ─✓─  Anonymous
 */
export const PeerSeats = ({ state = "waiting", compact = false }) => {
  const { t } = useTheme();
  const size = compact ? "w-12 h-12" : "w-16 h-16";
  const icon = compact ? "w-5 h-5" : "w-7 h-7";
  const label = `text-xs font-semibold ${t("text-stone-400", "text-stone-500")}`;

  const you = (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`${size} rounded-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30`}
      >
        <Ghost className={icon} />
      </div>
      <span className="text-xs font-semibold">You</span>
    </div>
  );

  if (state === "connected") {
    return (
      <div className="flex items-center justify-center gap-3">
        {you}
        <div className="flex items-center pb-6" aria-hidden="true">
          <span className="w-6 h-0.5 rounded-full bg-emerald-500/60" />
          <span className="w-6 h-6 rounded-full flex items-center justify-center bg-emerald-500 text-white">
            <Check className="w-3.5 h-3.5" />
          </span>
          <span className="w-6 h-0.5 rounded-full bg-emerald-500/60" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <div
              className={`${size} rounded-full flex items-center justify-center bg-gradient-to-br from-stone-500 to-stone-700 text-white shadow-lg`}
            >
              <Ghost className={icon} />
            </div>
            <span
              className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ${t(
                "ring-stone-950",
                "ring-stone-50"
              )}`}
            />
          </div>
          <span className={label}>Anonymous</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-4">
      {you}
      <div className="flex items-center gap-1.5 pb-6" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-amber-500 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className={`relative ${size}`}>
          <span className="absolute inset-0 rounded-full bg-amber-400/30 animate-ping" />
          <div
            className={`relative ${size} rounded-full flex items-center justify-center border-2 border-dashed font-bold ${
              compact ? "text-base" : "text-xl"
            } ${t("border-amber-500/50 bg-stone-900 text-amber-400", "border-amber-300 bg-white text-amber-500")}`}
          >
            ?
          </div>
        </div>
        <span className={label}>{state === "away" ? "Left the chat" : "Waiting…"}</span>
      </div>
    </div>
  );
};

// ── Inside the chat, until the other person joins ─────────────────────────
/** Shown in the conversation area while you wait: the link, and how to share it. */
export const WaitingPanel = ({ shareUrl }) => {
  const { t, muted, tile } = useStyles();
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator.share === "function";

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      // The link is still selectable in the box, and in the address bar.
    }
  };

  const share = () =>
    navigator
      .share({ title: "NexTalk temp chat", text: "Join my temporary chat:", url: shareUrl })
      .catch(() => {});

  const secondary = `flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${t(
    "bg-white/5 hover:bg-white/10 text-stone-200",
    "bg-stone-100 hover:bg-stone-200 text-stone-700"
  )}`;

  return (
    <div className="w-full max-w-lg flex flex-col items-center text-center">
      <PeerSeats state="waiting" />
      <h2 className="mt-6 text-2xl sm:text-3xl font-bold tracking-tight">
        Waiting for someone to join
      </h2>
      <p className={`mt-2 text-sm sm:text-base leading-relaxed ${muted}`}>
        You're in the chat. Share this link, and you can talk as soon as they open it.
      </p>

      <div className={`mt-6 w-full p-2 text-left ${tile}`}>
        <div className="flex items-center gap-2.5 px-3 py-3">
          <Link2 className={`w-4.5 h-4.5 shrink-0 ${muted}`} />
          <input
            readOnly
            value={shareUrl}
            onFocus={(e) => e.target.select()}
            aria-label="Temp chat link"
            className="flex-1 min-w-0 bg-transparent outline-none text-sm font-medium truncate"
          />
        </div>
        <div className={`grid gap-2 ${canShare ? "grid-cols-2" : "grid-cols-1"}`}>
          <button
            onClick={copy}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md shadow-amber-500/20 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Link copied" : "Copy link"}
          </button>
          {canShare && (
            <button onClick={share} className={secondary}>
              <Share2 className="w-4 h-4" />
              Share
            </button>
          )}
        </div>
      </div>

      <p className={`mt-5 flex items-center gap-2 text-xs ${muted}`}>
        <Timer className="w-3.5 h-3.5 shrink-0" />
        Closed this tab by mistake? Open the link again within 10 minutes.
      </p>
    </div>
  );
};

// ── The other person left; their seat is held ─────────────────────────────
/**
 * `clock` is the live "9:42" until the chat ends. `banner` is the slim version
 * pinned over a conversation; otherwise it's the large centred one for an
 * empty chat.
 */
export const AwayNotice = ({ clock, shareUrl, banner = false }) => {
  const { t, muted } = useStyles();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      // Clipboard blocked; the link is in the address bar.
    }
  };

  const copyButton = (
    <button
      onClick={copy}
      className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${t(
        "bg-white/10 hover:bg-white/15 text-stone-100",
        "bg-white hover:bg-stone-50 text-stone-700 border border-stone-200"
      )}`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied" : "Copy link"}
    </button>
  );

  if (banner) {
    return (
      <div
        role="status"
        className={`flex items-center gap-3 pl-4 pr-2 py-2 rounded-2xl border shadow-lg backdrop-blur ${t(
          "bg-stone-900/90 border-amber-500/30",
          "bg-amber-50/95 border-amber-200"
        )}`}
      >
        <Timer className="w-4.5 h-4.5 shrink-0 text-amber-500" />
        <p className="text-sm leading-snug">
          <span className="font-semibold">They left the chat.</span>{" "}
          <span className={muted}>It ends in </span>
          <span className="font-bold tabular-nums text-amber-500">{clock}</span>
          <span className={muted}> unless they come back.</span>
        </p>
        {copyButton}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center" role="status">
      <PeerSeats state="away" />
      <p className="mt-6 text-xl font-semibold">They left the chat</p>
      <p className={`mt-1.5 max-w-sm text-sm leading-relaxed ${muted}`}>
        They can come back by opening the same link. If they don't return in time, the chat
        ends and every message is deleted.
      </p>
      <p className={`mt-5 text-xs font-semibold uppercase tracking-[0.14em] ${muted}`}>
        Chat ends in
      </p>
      <p className="mt-1 text-4xl font-bold tabular-nums text-amber-500">{clock}</p>
      <div className="mt-5">{copyButton}</div>
    </div>
  );
};

// ── This tab handed the chat to another tab of the browser ────────────────
export const TempMoved = ({ onUseHere }) => {
  const { body, primary, ghostBtn } = useStyles();
  return (
    <div className="max-w-2xl flex flex-col items-center text-center">
      <IconBadge icon={Ghost} />
      <h1 className="mt-8 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
        Chat open in another tab
      </h1>
      <p className={`mt-4 max-w-lg text-base sm:text-lg leading-relaxed ${body}`}>
        You opened this temp chat in another tab, so it moved there with your messages. A chat
        can only be open in one tab at a time.
      </p>
      <div className="mt-9 flex flex-col sm:flex-row gap-3">
        <button onClick={onUseHere} className={primary}>
          Use here
          <ArrowRight className="w-5 h-5" />
        </button>
        <Link to="/" className={ghostBtn}>
          Go to NexTalk
        </Link>
      </div>
    </div>
  );
};

// ── Guest connecting ──────────────────────────────────────────────────────
export const TempJoining = () => {
  const { muted } = useStyles();
  return (
    <div className="flex flex-col items-center text-center">
      <IconBadge icon={Ghost} />
      <div className="mt-8 flex items-center gap-2.5 text-xl font-semibold">
        <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
        Joining temp chat…
      </div>
      <p className={`mt-2 text-sm ${muted}`}>Connecting you anonymously</p>
    </div>
  );
};

// ── Ended / couldn't join ─────────────────────────────────────────────────
const END_COPY = {
  you_left: { title: "You ended the chat", body: "Every message is gone, on both sides." },
  cancelled: { title: "Chat cancelled", body: "That link no longer works. Start a new one whenever you're ready." },
  left: { title: "Chat ended", body: "The other person ended the chat, so it and all its messages are gone." },
  timed_out: { title: "Chat ended", body: "The other person didn't come back within 10 minutes, so the chat and its messages were deleted." },
  expired: { title: "Chat expired", body: "It was quiet for 30 minutes, so it closed and the messages were deleted." },
  not_found: { title: "This chat has ended", body: "The link is no longer active. A temp chat ends when someone presses End chat, or 10 minutes after someone leaves and doesn't come back." },
  full: { title: "This chat is full", body: "Temp chats are for two people, and two are already in this one." },
  rate_limited: { title: "Too many chats", body: "You've started a lot of temp chats. Wait a few minutes and try again." },
  connection: { title: "Couldn't connect", body: "Check your connection and try again." },
};

export const TempEnded = ({ reason, onNew }) => {
  const { body, primary, ghostBtn } = useStyles();
  const copy = END_COPY[reason] ?? END_COPY.left;
  return (
    <div className="max-w-2xl flex flex-col items-center text-center">
      <IconBadge icon={reason === "full" ? UserX : Ghost} />
      <h1 className="mt-8 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">{copy.title}</h1>
      <p className={`mt-4 max-w-lg text-base sm:text-lg leading-relaxed ${body}`}>{copy.body}</p>
      <div className="mt-9 flex flex-col sm:flex-row gap-3">
        <button onClick={onNew} className={primary}>
          Start a new temp chat
          <ArrowRight className="w-5 h-5" />
        </button>
        <Link to="/" className={ghostBtn}>
          Go to NexTalk
        </Link>
      </div>
    </div>
  );
};

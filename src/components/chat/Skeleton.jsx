import { useTheme } from "../../context/ThemeContext";
import { useWallpaper } from "../../context/WallpaperContext";

/*
 * Shared loading skeletons. Every page that waits on data renders one of
 * these instead of a spinner, so loading looks the same across the app.
 * Each composite mirrors the real layout it stands in for (row heights,
 * avatar sizes, paddings) so nothing jumps when the content arrives.
 */

const AVATAR = {
  xs: "w-7 h-7",
  sm: "w-9 h-9",
  md: "w-11 h-11",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

// Varied widths so stacked rows read as text, not a barcode.
const TITLE_W = ["w-1/3", "w-2/5", "w-1/4", "w-1/2", "w-2/5", "w-1/3"];
const LINE_W = ["w-2/3", "w-1/2", "w-3/4", "w-3/5", "w-4/5", "w-1/2"];
const pick = (arr, i) => arr[i % arr.length];

/** The basic shimmering block. Size and shape come from `className`. */
export const Bone = ({ className = "", style }) => {
  const { t } = useTheme();
  return (
    <div
      aria-hidden="true"
      style={style}
      className={`skeleton rounded-md ${t("skeleton-dark bg-white/[0.06]", "bg-stone-200/80")} ${className}`}
    />
  );
};

export const AvatarBone = ({ size = "md", className = "" }) => (
  <Bone className={`${AVATAR[size]} rounded-full shrink-0 ${className}`} />
);

/** Announces loading once to screen readers; the bones themselves are hidden. */
export const SkeletonGroup = ({ label = "Loading", className = "", children }) => (
  <div role="status" aria-busy="true" aria-live="polite" className={className}>
    <span className="sr-only">{label}…</span>
    {children}
  </div>
);

/* ─────────────────────────── Lists ─────────────────────────── */

/** Avatar + name + subtitle, like a chat/contact row. */
export const RowSkeleton = ({ index = 0, avatar = "md", trailing = false, action = false }) => (
  <div className="flex items-center gap-3 px-4 py-3">
    <AvatarBone size={avatar} />
    <div className="flex-1 min-w-0 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Bone className={`h-3 ${pick(TITLE_W, index)}`} />
        {trailing && <Bone className="h-2.5 w-8 shrink-0" />}
      </div>
      <Bone className={`h-2.5 ${pick(LINE_W, index)}`} />
    </div>
    {action && <Bone className="h-3 w-12 shrink-0" />}
  </div>
);

export const ListSkeleton = ({
  count = 6,
  avatar = "md",
  trailing = false,
  action = false,
  surface = false,
  label = "Loading",
  className = "",
}) => {
  const { t } = useTheme();
  return (
    <SkeletonGroup
      label={label}
      className={`divide-y ${t("divide-white/5", "divide-stone-100")} ${
        surface ? t("bg-stone-900/40", "bg-white") : ""
      } ${className}`}
    >
      {Array.from({ length: count }, (_, i) => (
        <RowSkeleton key={i} index={i} avatar={avatar} trailing={trailing} action={action} />
      ))}
    </SkeletonGroup>
  );
};

/** Sender + time, message text, conversation name, as on the Starred page. */
export const StarredSkeleton = ({ count = 5 }) => {
  const { t } = useTheme();
  return (
    <SkeletonGroup label="Loading starred messages">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`px-4 py-3 space-y-2 border-b ${t("border-white/5", "border-stone-100")}`}>
          <div className="flex items-center justify-between">
            <Bone className={`h-2.5 ${pick(TITLE_W, i)}`} />
            <Bone className="h-2.5 w-10" />
          </div>
          <Bone className={`h-3 ${pick(LINE_W, i + 1)}`} />
          <Bone className="h-2.5 w-24" />
        </div>
      ))}
    </SkeletonGroup>
  );
};

/* ─────────────────────────── Cards ─────────────────────────── */

export const PersonCardSkeleton = () => {
  const { t } = useTheme();
  return (
    <div
      className={`rounded-2xl p-4 flex flex-col items-center ${t(
        "bg-white/5 border border-white/5",
        "bg-white border border-stone-200"
      )}`}
    >
      <AvatarBone size="lg" />
      <Bone className="mt-3 h-3 w-2/3" />
      <Bone className="mt-2 h-2.5 w-1/2" />
      <Bone className="mt-2 h-2 w-3/4" />
      <Bone className="mt-4 h-8 w-full rounded-lg" />
    </div>
  );
};

/** Section heading + a grid of person cards, as on Explore. */
export const CardGridSkeleton = ({ count = 8, gridClassName = "" }) => (
  <SkeletonGroup label="Loading people" className="mt-7">
    <Bone className="h-3 w-32 mb-4" />
    <div className={gridClassName}>
      {Array.from({ length: count }, (_, i) => (
        <PersonCardSkeleton key={i} />
      ))}
    </div>
  </SkeletonGroup>
);

/* ───────────────────────── Profiles ───────────────────────── */

/** Avatar + two lines, as on the Settings profile card. */
export const ProfileCardSkeleton = () => (
  <SkeletonGroup label="Loading profile" className="flex-1 flex items-center gap-3 min-w-0">
    <AvatarBone size="lg" />
    <div className="flex-1 space-y-2.5">
      <Bone className="h-3.5 w-2/5" />
      <Bone className="h-2.5 w-1/3" />
    </div>
  </SkeletonGroup>
);

/** Hero + quick actions + detail rows, as on a user's profile page. */
export const ProfileSkeleton = () => {
  const { t } = useTheme();
  return (
    <SkeletonGroup label="Loading profile">
      <div className={`flex flex-col items-center pt-6 pb-5 px-4 ${t("bg-stone-900/40", "bg-white")}`}>
        <AvatarBone size="xl" />
        <Bone className="mt-4 h-4 w-40" />
        <Bone className="mt-2.5 h-3 w-28" />
        <Bone className="mt-2 h-2.5 w-20" />
        <div className="mt-5 grid grid-cols-3 gap-3 w-full max-w-xs">
          {[0, 1, 2].map((i) => (
            <Bone key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
      <div className={`mt-2 divide-y ${t("bg-stone-900/40 divide-white/5", "bg-white divide-stone-100")}`}>
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Bone className="w-5 h-5 rounded-md shrink-0" />
            <div className="flex-1 space-y-2">
              <Bone className="h-2.5 w-16" />
              <Bone className={`h-3 ${pick(LINE_W, i)}`} />
            </div>
          </div>
        ))}
      </div>
    </SkeletonGroup>
  );
};

/** Avatar hero + labelled inputs, as on Edit profile. */
export const FormSkeleton = ({ fields = 3 }) => {
  const { t } = useTheme();
  return (
    <SkeletonGroup label="Loading profile">
      <div
        className={`flex flex-col items-center gap-3 px-4 py-7 border-b ${t(
          "border-white/5",
          "border-stone-200"
        )}`}
      >
        <AvatarBone size="xl" />
        <Bone className="h-4 w-36" />
        <Bone className="h-3 w-24" />
      </div>
      <div className="px-4 py-6 max-w-xl mx-auto w-full space-y-6">
        {Array.from({ length: fields }, (_, i) => (
          <div key={i} className="space-y-2">
            <Bone className="h-2.5 w-24" />
            <Bone className={`${i === 1 ? "h-20" : "h-11"} w-full rounded-xl`} />
            <Bone className="h-2 w-1/2" />
          </div>
        ))}
      </div>
    </SkeletonGroup>
  );
};

/* ───────────────────────── Chat thread ───────────────────────── */

// [side, width] — alternating runs so it reads like a conversation.
const BUBBLES = [
  ["in", "w-40"],
  ["in", "w-56"],
  ["out", "w-48"],
  ["in", "w-32"],
  ["out", "w-60"],
  ["out", "w-36"],
  ["in", "w-52"],
  ["out", "w-44"],
];

export const MessagesSkeleton = () => (
  <SkeletonGroup label="Loading messages" className="flex flex-col justify-end gap-2 min-h-full py-2">
    {BUBBLES.map(([side, w], i) => (
      <div key={i} className={`flex ${side === "out" ? "justify-end" : "justify-start"}`}>
        <Bone
          className={`h-9 max-w-[78%] ${w} rounded-2xl ${
            side === "out" ? "rounded-br-md" : "rounded-bl-md"
          }`}
        />
      </div>
    ))}
  </SkeletonGroup>
);

/** Whole thread while the conversation itself loads: header, messages, composer. */
export const ThreadSkeleton = () => {
  const { t, dark } = useTheme();
  const { wallpaper } = useWallpaper();
  return (
    <div className={`h-full flex flex-col ${t("bg-stone-950", "bg-stone-100")}`}>
      <div
        className={`shrink-0 h-14 px-4 flex items-center gap-3 border-b ${t(
          "bg-stone-950/80 border-white/5",
          "bg-white/85 border-stone-200"
        )}`}
      >
        <AvatarBone size="sm" />
        <div className="flex-1 space-y-2">
          <Bone className="h-3 w-32" />
          <Bone className="h-2.5 w-20" />
        </div>
      </div>
      <div style={wallpaper.style(dark)} className="flex-1 overflow-hidden px-3 sm:px-6 py-3">
        <MessagesSkeleton />
      </div>
      <div
        className={`shrink-0 px-3 py-2.5 flex items-center gap-2 border-t ${t(
          "bg-stone-950/80 border-white/5",
          "bg-white/85 border-stone-200"
        )}`}
      >
        <Bone className="flex-1 h-10 rounded-full" />
        <Bone className="w-10 h-10 rounded-full shrink-0" />
      </div>
    </div>
  );
};

/** Search field + emoji grid, while the emoji panel's code loads. */
export const EmojiGridSkeleton = ({ height }) => (
  <SkeletonGroup label="Loading emoji" className="px-3 py-2.5 overflow-hidden" >
    <div style={{ height }} className="flex flex-col gap-3">
      <Bone className="h-8 w-full rounded-lg shrink-0" />
      <div className="grid grid-cols-8 sm:grid-cols-10 gap-2.5">
        {Array.from({ length: 40 }, (_, i) => (
          <Bone key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    </div>
  </SkeletonGroup>
);

/* ───────────────────────── App shell ───────────────────────── */

/** Rail + chat list column + empty pane, shown while the session resolves. */
export const AppShellSkeleton = () => {
  const { t } = useTheme();
  const border = t("border-white/5", "border-stone-200");
  return (
    <div className={`min-h-screen md:h-screen md:flex ${t("bg-stone-950", "bg-stone-50")}`}>
      <div className={`hidden md:flex fixed inset-y-0 left-0 w-16 flex-col items-center gap-5 py-5 border-r ${border}`}>
        {[0, 1, 2, 3].map((i) => (
          <Bone key={i} className="w-6 h-6 rounded-lg" />
        ))}
        <div className="flex-1" />
        <Bone className="w-6 h-6 rounded-lg" />
        <AvatarBone size="sm" />
      </div>
      <div className={`md:ml-16 md:w-[360px] md:shrink-0 md:border-r ${border}`}>
        <div className={`h-14 px-4 flex items-center justify-between border-b ${border}`}>
          <Bone className="h-4 w-24" />
          <Bone className="h-6 w-6 rounded-lg" />
        </div>
        <div className="px-3 py-2">
          <Bone className="h-9 w-full rounded-xl" />
        </div>
        <ListSkeleton count={8} trailing label="Loading NexTalk" />
      </div>
      <div className={`hidden md:block flex-1 ${t("bg-stone-900/30", "bg-stone-100")}`} />
    </div>
  );
};

export default Bone;

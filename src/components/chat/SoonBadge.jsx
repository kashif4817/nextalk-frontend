import { useTheme } from "../../context/ThemeContext";

/** Small pill marking a settings row whose feature isn't built yet. */
const SoonBadge = () => {
  const { t } = useTheme();
  return (
    <span
      className={`shrink-0 px-1.5 py-[1px] rounded-full text-[9px] font-semibold uppercase tracking-wider ${t(
        "bg-amber-500/15 text-amber-400",
        "bg-amber-100 text-amber-700"
      )}`}
    >
      Soon
    </span>
  );
};

export default SoonBadge;

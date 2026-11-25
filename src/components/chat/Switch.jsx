import { useTheme } from "../../context/ThemeContext";

/** Accessible on/off switch. Label it with `aria-labelledby` or `aria-label`. */
const Switch = ({ checked, onChange, disabled = false, ...aria }) => {
  const { t } = useTheme();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? "bg-amber-500" : t("bg-stone-700", "bg-stone-300")
      }`}
      {...aria}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
};

export default Switch;

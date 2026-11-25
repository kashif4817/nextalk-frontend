import { useTheme } from "../../context/ThemeContext";
import Switch from "./Switch";

// Building blocks for the settings sub-pages, matching Settings.jsx.

export const SettingsSection = ({ children }) => {
  const { t } = useTheme();
  return (
    <div className={`${t("bg-stone-900/40", "bg-white")} divide-y ${t("divide-white/5", "divide-stone-100")}`}>
      {children}
    </div>
  );
};

export const SettingsLabel = ({ children }) => {
  const { t } = useTheme();
  return (
    <p className={`px-4 pt-5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${t("text-stone-500", "text-stone-400")}`}>
      {children}
    </p>
  );
};

/** A setting with an on/off switch; the whole row is labelled for screen readers. */
export const ToggleRow = ({ id, icon: Icon, label, hint, checked, onChange, disabled }) => {
  const { t } = useTheme();
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {Icon && <Icon className={`w-5 h-5 shrink-0 ${t("text-stone-400", "text-stone-500")}`} />}
      <div className="flex-1 min-w-0">
        <p id={`${id}-label`} className={`text-sm ${t("text-stone-100", "text-stone-900")}`}>
          {label}
        </p>
        {hint && (
          <p id={`${id}-hint`} className={`text-xs ${t("text-stone-400", "text-stone-500")}`}>
            {hint}
          </p>
        )}
      </div>
      <Switch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-labelledby={`${id}-label`}
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
    </div>
  );
};

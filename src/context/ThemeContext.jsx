import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

// New key on purpose: the old "nextalk-theme" was written on every page load,
// so it can't tell a real choice from an automatic one. Ignoring it makes
// System the default for everyone until they pick Light or Dark themselves.
const STORAGE_KEY = "nextalk:theme-mode";
const LEGACY_KEY = "nextalk-theme";
const MODES = ["light", "dark", "system"];
const systemQuery = () => window.matchMedia("(prefers-color-scheme: dark)");

const readMode = () => {
  localStorage.removeItem(LEGACY_KEY);
  const saved = localStorage.getItem(STORAGE_KEY);
  return MODES.includes(saved) ? saved : "system";
};

/**
 * `mode` is what the user picked (light / dark / system); `dark` is what's
 * actually on screen, which for "system" follows the OS live.
 */
export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(readMode);
  const [systemDark, setSystemDark] = useState(() => systemQuery().matches);

  useEffect(() => {
    const query = systemQuery();
    const onChange = (e) => setSystemDark(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const dark = mode === "system" ? systemDark : mode === "dark";

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // The quick moon/sun buttons pin the opposite of what's showing.
  const toggle = () => setMode(dark ? "light" : "dark");
  const t = (darkVal, lightVal) => (dark ? darkVal : lightVal);

  return (
    <ThemeContext.Provider value={{ dark, mode, setMode, toggle, t }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
};

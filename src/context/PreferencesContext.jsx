import { createContext, useCallback, useContext, useEffect, useState } from "react";

// Per-device chat preferences. They describe this browser (its keyboard,
// screen and notification permission), so they live in localStorage rather
// than on the profile.

const STORAGE_KEY = "nextalk:preferences";

const DEFAULTS = {
  enterToSend: true,
  textSize: "medium", // small | medium | large — see `.chat-text` in index.css
  // Desktop popups need the browser's permission, so they start off and are
  // switched on from Settings → Notifications.
  notifyDesktop: false,
  notifySound: true,
};

const readPrefs = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return { ...DEFAULTS, ...saved };
  } catch {
    return { ...DEFAULTS };
  }
};

const PreferencesContext = createContext(null);

export const PreferencesProvider = ({ children }) => {
  const [prefs, setPrefs] = useState(readPrefs);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Storage unavailable (private mode): prefs last for this visit only.
    }
  }, [prefs]);

  // Message text size is applied through CSS (see `.chat-text` in index.css),
  // so bubbles don't each need to read this context.
  useEffect(() => {
    document.documentElement.dataset.chatText = prefs.textSize;
  }, [prefs.textSize]);

  // Keep other open tabs in step.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setPrefs(readPrefs());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setPref = useCallback((key, value) => {
    setPrefs((p) => (p[key] === value ? p : { ...p, [key]: value }));
  }, []);

  return (
    <PreferencesContext.Provider value={{ prefs, setPref }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used inside PreferencesProvider");
  return ctx;
};

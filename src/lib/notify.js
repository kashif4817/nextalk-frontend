// Desktop notification helpers (the browser Notification API).

export const notificationsSupported = () =>
  typeof window !== "undefined" && "Notification" in window;

/** "granted" | "denied" | "default" | "unsupported" */
export const notificationPermission = () =>
  notificationsSupported() ? Notification.permission : "unsupported";

/** Ask once; resolves to the resulting permission. */
export const requestNotificationPermission = async () => {
  if (!notificationsSupported()) return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
};

/**
 * Show a desktop notification. Returns it, or null when not allowed.
 * `tag` makes later messages from the same chat replace the earlier popup.
 */
export const showNotification = ({ title, body, tag, onClick }) => {
  if (notificationPermission() !== "granted") return null;
  try {
    const n = new Notification(title, {
      body,
      tag,
      renotify: Boolean(tag),
      icon: "/logo.png",
      badge: "/logo.png",
    });
    n.onclick = () => {
      window.focus();
      onClick?.();
      n.close();
    };
    return n;
  } catch {
    // Some mobile browsers only allow notifications from a service worker.
    return null;
  }
};

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { usePreferences } from "../../context/PreferencesContext";
import { getConversation } from "../../services/conversations";
import { previewText } from "../../lib/adapters";
import { onSocket } from "../../lib/socket";
import { playMessageSound, unlockSound } from "../../lib/notifySound";
import { showNotification } from "../../lib/notify";

/** NexTalk isn't what the user is looking at right now. */
const inBackground = () =>
  document.visibilityState !== "visible" || !document.hasFocus();

/**
 * App-wide: plays a sound and/or shows a desktop notification for messages
 * that arrive while NexTalk is in the background (Settings → Notifications).
 * Renders nothing.
 */
const MessageNotifier = () => {
  const { user } = useUser();
  const { prefs } = usePreferences();
  const navigate = useNavigate();
  const meId = user?.id;

  // Read inside the socket handler without re-subscribing on every change.
  const prefsRef = useRef(prefs);
  useEffect(() => {
    prefsRef.current = prefs;
  }, [prefs]);

  // Audio may only start after a user gesture; arm it on the first one.
  useEffect(() => {
    const unlock = () => unlockSound();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    if (!meId) return;

    return onSocket("message:new", async (msg) => {
      const { notifyDesktop, notifySound } = prefsRef.current;
      if (msg.sender_id === meId || !inBackground()) return;
      if (!notifyDesktop && !notifySound) return;

      // Mute state and the group name live on the conversation.
      let conv = null;
      try {
        conv = await getConversation(msg.conversation_id);
      } catch {
        // Still notify; we just can't name the group.
      }
      const mine = conv?.members?.find((m) => m.profile?.id === meId);
      if (mine?.muted_until && new Date(mine.muted_until) > new Date()) return;

      if (notifySound) playMessageSound();

      if (notifyDesktop) {
        const sender =
          msg.sender?.display_name || msg.sender?.username || "New message";
        showNotification({
          title: conv?.is_group ? `${sender} · ${conv.group_name || "Group"}` : sender,
          body: previewText(msg) || "Sent you a message",
          tag: msg.conversation_id,
          onClick: () => navigate(`/chat/${msg.conversation_id}`),
        });
      }
    });
  }, [meId, navigate]);

  return null;
};

export default MessageNotifier;

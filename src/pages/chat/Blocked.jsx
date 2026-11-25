import { useState } from "react";
import { ShieldOff, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "../../context/ThemeContext";
import { useBlocked } from "../../hooks/useBlocked";
import { usePeople } from "../../hooks/usePeople";
import * as blocksApi from "../../services/blocks";
import Avatar from "../../components/chat/Avatar";
import ChatTopBar from "../../components/chat/ChatTopBar";
import ChatShell from "../../components/chat/ChatShell";
import { ListSkeleton } from "../../components/chat/Skeleton";
import BottomSheet, { SheetItem } from "../../components/chat/BottomSheet";

const Blocked = () => {
  const { t } = useTheme();
  const { blocked: blockedUsers, loading, error, reload, remove } = useBlocked();
  // /users/all already filters out anyone blocked in either direction, so
  // everyone it returns is a valid candidate.
  const { people: candidates } = usePeople();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const block = async (id) => {
    if (busy) return;
    setBusy(true);
    setPickerOpen(false);
    try {
      await blocksApi.blockUser(id);
      reload();
    } catch (e) {
      toast.error(e.message || "Could not block user");
    } finally {
      setBusy(false);
    }
  };

  const unblock = async (user) => {
    remove(user.block_row_id);
    try {
      await blocksApi.unblockUser(user.block_row_id);
    } catch (e) {
      toast.error(e.message || "Could not unblock user");
      reload();
    }
  };

  return (
    <ChatShell active="settings">
    <div className={`min-h-screen ${t("bg-stone-950 text-stone-100", "bg-stone-50 text-stone-900")}`}>
      <ChatTopBar
        title="Blocked contacts"
        subtitle={`${blockedUsers.length} blocked`}
        right={
          <button
            onClick={() => setPickerOpen(true)}
            className={`p-2 rounded-lg cursor-pointer ${t(
              "text-stone-400 hover:bg-white/5",
              "text-stone-500 hover:bg-stone-100"
            )}`}
          >
            <UserPlus className="w-5 h-5" />
          </button>
        }
      />

      <p className={`px-4 pt-3 text-xs ${t("text-stone-400", "text-stone-500")}`}>
        Blocked users can't message you or see your last seen and online status.
      </p>

      {loading ? (
        <ListSkeleton count={3} action surface className="mt-3" />
      ) : error ? (
        <div className="px-6 py-16 text-center">
          <p className={`text-sm ${t("text-stone-400", "text-stone-500")}`}>{error}</p>
          <button onClick={reload} className="mt-3 text-sm font-medium text-amber-500 cursor-pointer">
            Try again
          </button>
        </div>
      ) : blockedUsers.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <ShieldOff className={`w-10 h-10 mx-auto mb-3 ${t("text-stone-500", "text-stone-400")}`} />
          <p className={`text-sm ${t("text-stone-400", "text-stone-500")}`}>
            You haven't blocked anyone.
          </p>
        </div>
      ) : (
        <div className={`mt-3 ${t("bg-stone-900/40", "bg-white")} divide-y ${t("divide-white/5", "divide-stone-100")}`}>
          {blockedUsers.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar initials={u.initials} color={u.color} size="md" />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${t("text-stone-100", "text-stone-900")}`}>
                  {u.display_name}
                </p>
                <p className={`text-xs truncate ${t("text-stone-400", "text-stone-500")}`}>
                  @{u.username}
                </p>
              </div>
              <button
                onClick={() => unblock(u)}
                className="text-xs font-medium text-amber-500 hover:underline cursor-pointer"
              >
                Unblock
              </button>
            </div>
          ))}
        </div>
      )}

      <BottomSheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="Block contact">
        {candidates.slice(0, 8).map((u) => (
          <SheetItem
            key={u.id}
            label={u.display_name}
            hint={`@${u.username}`}
            onClick={() => block(u.id)}
          />
        ))}
      </BottomSheet>
    </div>
    </ChatShell>
  );
};

export default Blocked;

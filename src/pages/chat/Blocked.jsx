import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldOff } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { getBlockedUsers, unblockUser } from "../../api/blocks/block";
import { normalizeBlockedUser } from "../../utils/formatters";
import Avatar from "../../components/chat/Avatar";
import ChatTopBar from "../../components/chat/ChatTopBar";
import ChatShell from "../../components/chat/ChatShell";

const Blocked = () => {
  const { t } = useTheme();
  const queryClient = useQueryClient();
  const { data: blocked = [] } = useQuery({
    queryKey: ["blocks"],
    queryFn: async () => {
      const res = await getBlockedUsers();
      return (res.data.data || []).map(normalizeBlockedUser).filter(Boolean);
    },
  });

  const handleUnblock = (u) => {
    unblockUser(u.block_row_id)
      .then(() =>
        queryClient.setQueryData(["blocks"], (prev = []) => prev.filter(x => x.id !== u.id))
      )
      .catch(console.error);
  };

  return (
    <ChatShell active="settings">
    <div className={`min-h-screen ${t("bg-stone-950 text-stone-100", "bg-stone-50 text-stone-900")}`}>
      <ChatTopBar
        title="Blocked contacts"
        subtitle={`${blocked.length} blocked`}
      />

      <p className={`px-4 pt-3 text-xs ${t("text-stone-400", "text-stone-500")}`}>
        Blocked users can't message you or see your last seen and online status.
      </p>

      {blocked.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <ShieldOff className={`w-10 h-10 mx-auto mb-3 ${t("text-stone-500", "text-stone-400")}`} />
          <p className={`text-sm ${t("text-stone-400", "text-stone-500")}`}>
            You haven't blocked anyone.
          </p>
          <p className={`text-xs mt-1 ${t("text-stone-500", "text-stone-400")}`}>
            To block someone, visit their profile.
          </p>
        </div>
      ) : (
        <div className={`mt-3 ${t("bg-stone-900/40", "bg-white")} divide-y ${t("divide-white/5", "divide-stone-100")}`}>
          {blocked.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar src={u.avatar_url} initials={u.initials} color={u.color} size="md" />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${t("text-stone-100", "text-stone-900")}`}>
                  {u.display_name}
                </p>
                <p className={`text-xs truncate ${t("text-stone-400", "text-stone-500")}`}>
                  @{u.username}
                </p>
              </div>
              <button
                onClick={() => handleUnblock(u)}
                className="text-xs font-medium text-amber-500 hover:underline cursor-pointer"
              >
                Unblock
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
    </ChatShell>
  );
};

export default Blocked;

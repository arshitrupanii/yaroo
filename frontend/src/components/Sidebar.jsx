import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatstore";
import { useAuthStore } from "../store/useAuhstore.js";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();

  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    getUsers();
  }, [onlineUsers]);

  const filteredUsers = showOnlineOnly ? users.filter((user) => onlineUsers.includes(user._id)) : users;

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-full lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      {/* Header */}
      <div className="border-b border-base-300 w-full p-3 sm:p-4 md:p-5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Users className="size-5 sm:size-6" />
          <span className="font-medium text-sm sm:text-base">Contacts</span>
        </div>
        {/* Online filter toggle */}
        <div className="mt-3 flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-xs sm:text-sm">Show online only</span>
          </label>
          <span className="text-[10px] sm:text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
        </div>
      </div>

      {/* Users list */}
      <div className="overflow-y-auto w-full py-2 sm:py-3 flex-1">
        {filteredUsers.map((user) => (
          <button
            key={user._id}
            onClick={() => setSelectedUser(user)}
            className={`
              w-full p-2 sm:p-2.5 md:p-3 flex items-center gap-2 sm:gap-3
              hover:bg-base-300 transition-colors
              ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
            `}
          >
            <div className="relative flex-shrink-0">
              <img
                src={user.profilePicture || "avatar.png"}
                alt={user.firstname}
                className="size-10 sm:size-11 md:size-12 object-cover rounded-full"
              />
              {onlineUsers.includes(user._id) && (
                <span
                  className="absolute bottom-0 right-0 size-2.5 sm:size-3 bg-green-500 
                  rounded-full ring-2 ring-base-100"
                />
              )}
            </div>

            {/* User info - always visible */}
            <div className="text-left min-w-0 flex-1">
              <div className="font-medium truncate text-xs sm:text-sm md:text-base">{user.firstname}</div>
              <div className="text-[10px] sm:text-xs md:text-sm text-zinc-400 flex items-center gap-1.5">
                <span className={`size-1.5 sm:size-2 rounded-full ${onlineUsers.includes(user._id) ? 'bg-green-500' : 'bg-zinc-500'}`} />
                {onlineUsers.includes(user._id) ? "Online" : "Offline"}
              </div>
            </div>
          </button>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4 text-xs sm:text-sm px-2">
            No online users
          </div>
        )}
      </div>
    </aside>
  );
};
export default Sidebar;
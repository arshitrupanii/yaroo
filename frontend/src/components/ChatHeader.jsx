import { X, ArrowLeft } from "lucide-react";
import { useAuthStore } from "../store/useAuhstore";
import { useChatStore } from "../store/useChatstore";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser, typingUsers } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const isTyping = typingUsers[selectedUser._id];

  return (
    <div className="px-3 py-2.5 border-b border-base-300 flex-shrink-0 bg-base-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0 flex-1">
          {/* Back button - visible on mobile only */}
          <button
            onClick={() => setSelectedUser(null)}
            className="btn btn-ghost btn-sm btn-circle lg:hidden flex-shrink-0"
            aria-label="Back to contacts"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Avatar */}
          <div className="avatar flex-shrink-0">
            <div className="size-10 rounded-full relative">
              <img src={selectedUser.profilePicture || "/avatar.png"} alt={selectedUser.firstname} className="w-full h-full object-cover rounded-full" />
            </div>
          </div>

          {/* User info */}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm sm:text-base truncate leading-tight">{selectedUser.firstname}</h3>
            <p className="text-xs text-base-content/60">
              {isTyping ? "Typing..." : onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
            {selectedUser.username && (
              <p className="text-[11px] text-base-content/40 truncate">@{selectedUser.username}</p>
            )}
          </div>
        </div>

        {/* Close button - hidden on mobile, visible on desktop */}
        <button
          onClick={() => setSelectedUser(null)}
          className="hidden lg:flex btn btn-ghost btn-sm btn-circle flex-shrink-0"
          aria-label="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
export default ChatHeader;

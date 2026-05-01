import { X, ArrowLeft } from "lucide-react";
import { useAuthStore } from "../store/useAuhstore";
import { useChatStore } from "../store/useChatstore";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  return (
    <div className="p-2 sm:p-2.5 md:p-3 border-b border-base-300 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0 flex-1">
          {/* Back button - visible on mobile only */}
          <button
            onClick={() => setSelectedUser(null)}
            className="lg:hidden p-1 sm:p-1.5 hover:bg-base-200 rounded-full transition-colors flex-shrink-0"
            aria-label="Back to contacts"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Avatar */}
          <div className="avatar flex-shrink-0">
            <div className="size-7 sm:size-8 md:size-9 lg:size-10 rounded-full relative">
              <img src={selectedUser.profilePicture || "/avatar.png"} alt={selectedUser.firstname} className="w-full h-full object-cover rounded-full" />
            </div>
          </div>

          {/* User info */}
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-sm sm:text-base truncate">{selectedUser.firstname}</h3>
            <p className="text-xs sm:text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Close button - hidden on mobile, visible on desktop */}
        <button
          onClick={() => setSelectedUser(null)}
          className="hidden lg:block p-1.5 hover:bg-base-200 rounded-full transition-colors flex-shrink-0"
          aria-label="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
export default ChatHeader;
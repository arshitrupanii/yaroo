import { ArrowLeft, X } from "lucide-react";
import { useAuthStore } from "../store/useAuhstore";
import { useChatStore } from "../store/useChatstore";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser, typingUsers } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const isTyping = typingUsers[selectedUser._id];

  return (
    <div className="flex-shrink-0 border-b border-base-300/70 bg-base-100 px-3 py-2">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            onClick={() => setSelectedUser(null)}
            className="btn btn-ghost btn-sm btn-square flex-shrink-0 rounded-xl lg:hidden"
            aria-label="Back to contacts"
          >
            <ArrowLeft className="size-4" />
          </button>

          <div className="avatar flex-shrink-0">
            <div className="relative size-9 rounded-full">
              <img src={selectedUser.profilePicture || "/avatar.png"} alt={selectedUser.firstname} className="h-full w-full rounded-full object-cover" />
              <span
                className={`absolute bottom-0 right-0 size-2.5 rounded-full ring-2 ring-base-100 ${
                  onlineUsers.includes(selectedUser._id) ? "bg-emerald-500" : "bg-base-content/25"
                }`}
              />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold leading-tight">{selectedUser.firstname}</h3>
            <p className="text-xs text-base-content/60 truncate">
              {isTyping ? "Typing..." : onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
              {selectedUser.username ? ` • @${selectedUser.username}` : ""}
            </p>
          </div>
        </div>

        <button
          onClick={() => setSelectedUser(null)}
          className="hidden lg:flex btn btn-ghost btn-sm btn-square flex-shrink-0 rounded-xl"
          aria-label="Close chat"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
};
export default ChatHeader;

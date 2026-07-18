import { ArrowLeft, Pin, PinOff, X } from "lucide-react";
import { useAuthStore } from "../store/useAuhstore";
import { useChatStore } from "../store/useChatstore";
import AvatarInitials from "./AvatarInitials";

const ChatHeader = () => {
  const { pinnedUserIds, selectedUser, setSelectedUser, togglePinnedUser, typingUsers } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const isTyping = typingUsers[selectedUser._id];
  const isPinned = pinnedUserIds.includes(selectedUser._id);

  return (
    <div className="flex-shrink-0 border-b border-base-300/70 bg-base-100/95 px-3 py-2">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            onClick={() => setSelectedUser(null)}
            className="btn btn-ghost btn-sm btn-square flex-shrink-0 rounded-xl lg:hidden"
            aria-label="Back to contacts"
          >
            <ArrowLeft className="size-4" />
          </button>

          <AvatarInitials
            user={selectedUser}
            alt={selectedUser.firstname}
            className="size-9"
            textClassName="text-sm"
            showStatus
            isOnline={onlineUsers.includes(selectedUser._id)}
          />

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold leading-tight">{selectedUser.firstname}</h3>
            <p className="text-xs text-base-content/60 truncate">
              {isTyping ? "Typing..." : onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
              {selectedUser.username ? ` • @${selectedUser.username}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => togglePinnedUser(selectedUser._id)}
            className={`btn btn-ghost btn-sm btn-square flex-shrink-0 rounded-xl ${isPinned ? "text-primary" : ""}`}
            aria-label={isPinned ? "Unpin chat" : "Pin chat"}
            title={isPinned ? "Unpin chat" : "Pin chat"}
          >
            {isPinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
          </button>

          <button
            onClick={() => setSelectedUser(null)}
            className="hidden lg:flex btn btn-ghost btn-sm btn-square flex-shrink-0 rounded-xl"
            aria-label="Close chat"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ChatHeader;

import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatstore";
import { useAuthStore } from "../store/useAuhstore.js";
import { Check, Inbox, Pin, PinOff, Plus, UserPlus, UsersRound, X } from "lucide-react";
import PropTypes from "prop-types";
import AvatarInitials from "./AvatarInitials";
import { formatMessageTime } from "../lib/utils";

const GroupAvatar = ({ name, className = "size-10" }) => (
  <div className={`${className} flex flex-shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-content`}>
    <UsersRound className="size-5" />
    <span className="sr-only">{name}</span>
  </div>
);

GroupAvatar.propTypes = {
  className: PropTypes.string,
  name: PropTypes.string.isRequired,
};

const Sidebar = () => {
  const {
    acceptFriendRequest,
    createGroup,
    friendRequests,
    getFriendRequests,
    getGroups,
    getUsers,
    groups,
    isUsersLoading,
    pinnedUserIds,
    rejectFriendRequest,
    searchUsers,
    selectedUser,
    sendFriendRequest,
    setSelectedUser,
    setUserSearchText,
    togglePinnedUser,
    typingUsers,
    userSearchText,
    users,
  } = useChatStore();

  const { onlineUsers } = useAuthStore();
  const [filterMode, setFilterMode] = useState("all");
  const [showGroupComposer, setShowGroupComposer] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMemberIds, setGroupMemberIds] = useState([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const hasSearchedRef = useRef(false);
  const isSearching = userSearchText.trim().length > 0;

  useEffect(() => {
    getUsers();
    getGroups();
    getFriendRequests();
  }, [getFriendRequests, getGroups, getUsers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextSearch = userSearchText.trim();

      if (nextSearch) {
        hasSearchedRef.current = true;
        searchUsers(nextSearch);
      } else if (hasSearchedRef.current) {
        hasSearchedRef.current = false;
        getUsers();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [getUsers, searchUsers, userSearchText]);

  const filteredUsers = users
    .filter((user) => {
      if (isSearching) return true;
      if (filterMode === "online") return onlineUsers.includes(user._id);
      if (filterMode === "pinned") return pinnedUserIds.includes(user._id);
      if (filterMode === "groups") return false;
      return true;
    })
    .sort((a, b) => {
      const aPinnedIndex = pinnedUserIds.indexOf(a._id);
      const bPinnedIndex = pinnedUserIds.indexOf(b._id);
      const aPinned = aPinnedIndex !== -1;
      const bPinned = bPinnedIndex !== -1;

      if (aPinned && bPinned) return aPinnedIndex - bPinnedIndex;
      if (aPinned) return -1;
      if (bPinned) return 1;
      if ((a.unreadCount || 0) !== (b.unreadCount || 0)) return (b.unreadCount || 0) - (a.unreadCount || 0);

      const aLastMessageTime = new Date(a.lastMessage?.createdAt || 0).getTime();
      const bLastMessageTime = new Date(b.lastMessage?.createdAt || 0).getTime();
      if (aLastMessageTime !== bLastMessageTime) return bLastMessageTime - aLastMessageTime;
      return a.firstname.localeCompare(b.firstname);
    });

  const filteredGroups = isSearching || filterMode === "online" || filterMode === "pinned"
    ? []
    : groups.sort((a, b) => {
      if ((a.unreadCount || 0) !== (b.unreadCount || 0)) return (b.unreadCount || 0) - (a.unreadCount || 0);
      const aTime = new Date(a.lastMessage?.createdAt || a.updatedAt || 0).getTime();
      const bTime = new Date(b.lastMessage?.createdAt || b.updatedAt || 0).getTime();
      return bTime - aTime;
    });

  const skeletonRows = Array(7).fill(null);

  const getLastMessagePreview = (conversation) => {
    if (conversation.type === "group") {
      if (conversation.lastMessage?.text?.trim()) return conversation.lastMessage.text.trim();
      if (conversation.lastMessage?.image) return "Image";
      return `${conversation.members?.length || 0} members`;
    }

    if (typingUsers[conversation._id]) return "typing...";
    if (conversation.lastMessage?.text?.trim()) return conversation.lastMessage.text.trim();
    if (conversation.lastMessage?.image) return "Image";
    return `@${conversation.username || "not-set"}`;
  };

  const renderUserAction = (user) => {
    if (!isSearching || user.friendshipStatus === "friends") return null;
    if (user.friendshipStatus === "sent") return <span className="text-xs text-base-content/50">Sent</span>;

    if (user.friendshipStatus === "received") {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            acceptFriendRequest(user._id);
          }}
          className="btn btn-xs btn-primary min-w-12"
        >
          Accept
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          sendFriendRequest(user._id);
        }}
        className="btn btn-xs btn-primary min-w-12"
        aria-label={`Add ${user.firstname}`}
      >
        <UserPlus className="size-3" />
        Add
      </button>
    );
  };

  const openUserChat = (user, canOpenChat) => {
    if (!canOpenChat) return;
    setSelectedUser(user);
    if (isSearching && user.friendshipStatus === "friends") setUserSearchText("");
  };

  const toggleGroupMember = (userId) => {
    setGroupMemberIds((memberIds) => (
      memberIds.includes(userId)
        ? memberIds.filter((id) => id !== userId)
        : [...memberIds, userId]
    ));
  };

  const resetGroupComposer = () => {
    setShowGroupComposer(false);
    setGroupName("");
    setGroupMemberIds([]);
  };

  const submitGroup = async (event) => {
    event.preventDefault();
    if (!groupName.trim() || groupMemberIds.length === 0) return;

    try {
      setIsCreatingGroup(true);
      await createGroup({ name: groupName.trim(), memberIds: groupMemberIds });
      resetGroupComposer();
    } finally {
      setIsCreatingGroup(false);
    }
  };

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-r border-base-300/70 bg-base-100 lg:w-72">
      <div className="w-full flex-shrink-0 border-b border-base-300/70 bg-base-100/95 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 truncate text-sm font-semibold leading-tight">
              <UsersRound className="size-4 text-base-content/50" />
              Chats
            </h2>
          </div>
          <div className="flex items-center gap-1">
            {friendRequests.received.length > 0 && (
              <span className="badge badge-primary badge-sm rounded-full">{friendRequests.received.length}</span>
            )}
            {!isSearching && (
              <button
                type="button"
                onClick={() => setShowGroupComposer(true)}
                className="btn btn-ghost btn-xs btn-square rounded-lg"
                aria-label="Create group"
                title="Create group"
              >
                <Plus className="size-4" />
              </button>
            )}
          </div>
        </div>

        {isSearching ? (
          <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-base-200/70 px-3 py-2 text-xs text-base-content/60">
            <span className="min-w-0 truncate">
              Results for <span className="font-medium text-base-content">{userSearchText.trim()}</span>
            </span>
            <button
              type="button"
              onClick={() => setUserSearchText("")}
              className="btn btn-ghost btn-xs btn-square h-6 min-h-6 rounded-md"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto text-xs">
            {["all", "groups", "pinned", "online"].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilterMode(mode)}
                className={`btn btn-xs h-7 min-h-7 rounded-full px-3 capitalize ${filterMode === mode ? "btn-primary" : "btn-ghost text-base-content/70"}`}
              >
                {mode === "pinned" && <Pin className="size-3" />}
                {mode}
              </button>
            ))}
          </div>
        )}
      </div>

      {showGroupComposer && (
        <form onSubmit={submitGroup} className="space-y-3 border-b border-base-300/70 bg-base-200/35 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-base-content/60">New group</div>
            <button type="button" onClick={resetGroupComposer} className="btn btn-ghost btn-xs btn-square rounded-md" aria-label="Close group form">
              <X className="size-3.5" />
            </button>
          </div>
          <input
            type="text"
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
            className="input input-bordered h-9 min-h-9 w-full rounded-lg text-sm"
            placeholder="Group name"
            maxLength={40}
          />
          <div className="max-h-36 space-y-1 overflow-y-auto">
            {friendRequests.friends.map((friend) => (
              <label key={friend._id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-base-200">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary checkbox-xs"
                  checked={groupMemberIds.includes(friend._id)}
                  onChange={() => toggleGroupMember(friend._id)}
                />
                <AvatarInitials user={friend} alt={friend.firstname} className="size-7" textClassName="text-[10px]" />
                <span className="min-w-0 flex-1 truncate text-sm">{friend.firstname}</span>
              </label>
            ))}
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-sm h-9 min-h-9 w-full rounded-lg"
            disabled={isCreatingGroup || !groupName.trim() || groupMemberIds.length === 0}
          >
            Create group
          </button>
        </form>
      )}

      {!isSearching && friendRequests.received.length > 0 && (
        <div className="space-y-2 border-b border-base-300/70 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-base-content/60">
            <Inbox className="size-3.5" />
            Friend requests
          </div>
          {friendRequests.received.map((user) => (
            <div key={user._id} className="flex items-center gap-2">
              <AvatarInitials user={user} alt={user.firstname} className="size-9" textClassName="text-xs" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{user.firstname}</div>
                <div className="truncate text-xs text-base-content/50">@{user.username}</div>
              </div>
              <div className="flex flex-shrink-0 items-center gap-1">
                <button onClick={() => acceptFriendRequest(user._id)} className="btn btn-xs btn-primary btn-square rounded-lg" aria-label="Accept request">
                  <Check className="size-3" />
                </button>
                <button onClick={() => rejectFriendRequest(user._id)} className="btn btn-xs btn-ghost btn-square rounded-lg" aria-label="Reject request">
                  <X className="size-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="min-h-0 w-full flex-1 overflow-y-auto py-1">
        {isUsersLoading && skeletonRows.map((_, index) => (
          <div key={index} className="flex w-full items-center gap-3 p-3">
            <div className="skeleton size-10 flex-shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <div className="skeleton mb-2 h-4 w-28" />
              <div className="skeleton h-3 w-16" />
            </div>
          </div>
        ))}

        {!isSearching && filteredGroups.map((group) => {
          const unreadCount = group.unreadCount || 0;
          const isSelected = selectedUser?.type === "group" && selectedUser._id === group._id;

          return (
            <button
              key={group._id}
              type="button"
              onClick={() => setSelectedUser(group)}
              className={`mx-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 ${
                isSelected ? "bg-primary/15 text-primary shadow-sm" : "hover:bg-base-200/70"
              }`}
            >
              <GroupAvatar name={group.name} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <div className="truncate text-sm font-medium leading-tight text-base-content">{group.name}</div>
                  {group.lastMessage?.createdAt && (
                    <time className="ml-auto flex-shrink-0 text-[10px] text-base-content/35">
                      {formatMessageTime(group.lastMessage.createdAt)}
                    </time>
                  )}
                </div>
                <div className={`truncate text-xs ${unreadCount > 0 ? "font-medium text-base-content/70" : "text-base-content/50"}`}>
                  {getLastMessagePreview(group)}
                </div>
              </div>
              {unreadCount > 0 && !isSelected && (
                <span className="badge badge-primary badge-sm min-w-5 rounded-full px-1.5 text-[11px]">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          );
        })}

        {!isUsersLoading && filteredUsers.map((user) => {
          const isPinned = pinnedUserIds.includes(user._id);
          const canOpenChat = user.friendshipStatus === "friends" || !isSearching;
          const unreadCount = user.unreadCount || 0;
          const showUnreadBadge = !isSearching && unreadCount > 0 && selectedUser?._id !== user._id;
          const isTyping = typingUsers[user._id];

          return (
            <div
              key={user._id}
              className={`group mx-2 flex w-[calc(100%-1rem)] items-center gap-2 rounded-xl transition-all duration-150 ${
                selectedUser?.type !== "group" && selectedUser?._id === user._id
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "hover:bg-base-200/70"
              }`}
            >
              <button
                type="button"
                onClick={() => openUserChat(user, canOpenChat)}
                className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left"
              >
                <AvatarInitials
                  user={user}
                  alt={user.firstname}
                  className="size-10"
                  showStatus
                  isOnline={onlineUsers.includes(user._id)}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <div className="truncate text-sm font-medium leading-tight text-base-content">{user.firstname}</div>
                    {isPinned && <Pin className="size-3 flex-shrink-0 fill-current text-primary" />}
                    {user.lastMessage?.createdAt && !isTyping && (
                      <time className="ml-auto flex-shrink-0 text-[10px] text-base-content/35">
                        {formatMessageTime(user.lastMessage.createdAt)}
                      </time>
                    )}
                  </div>
                  <div className={`truncate text-xs ${isTyping ? "font-medium text-primary" : unreadCount > 0 ? "font-medium text-base-content/70" : "text-base-content/50"}`}>
                    {getLastMessagePreview(user)}
                  </div>
                </div>
              </button>

              {showUnreadBadge && (
                <span
                  className="badge badge-primary badge-sm mr-1 min-w-5 rounded-full px-1.5 text-[11px]"
                  aria-label={`${unreadCount} unread messages`}
                  title={`${unreadCount} unread messages`}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}

              {user.friendshipStatus === "friends" && !isSearching ? (
                <button
                  type="button"
                  onClick={() => togglePinnedUser(user._id)}
                  className={`btn btn-ghost btn-xs btn-square mr-2 rounded-lg ${isPinned ? "text-primary" : "text-base-content/35 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"}`}
                  aria-label={isPinned ? `Unpin ${user.firstname}` : `Pin ${user.firstname}`}
                  title={isPinned ? "Unpin chat" : "Pin chat"}
                >
                  {isPinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
                </button>
              ) : renderUserAction(user)}
            </div>
          );
        })}

        {!isUsersLoading && filteredUsers.length === 0 && filteredGroups.length === 0 && (
          <div className="p-6 text-center text-sm text-base-content/60">
            <UserPlus className="mx-auto mb-3 size-8 text-base-content/30" />
            <div className="font-medium text-base-content">
              {isSearching ? "No users found" : filterMode === "pinned" ? "No pinned chats" : filterMode === "groups" ? "No groups yet" : "No friends yet"}
            </div>
            <p className="mt-1">
              {isSearching
                ? "Try another username or name."
                : filterMode === "pinned"
                  ? "Pin your important chats from the list."
                  : filterMode === "groups"
                    ? "Create a group with friends from the plus button."
                    : "Search a username above and send a friend request."}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

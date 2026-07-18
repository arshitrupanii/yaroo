import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatstore";
import { useAuthStore } from "../store/useAuhstore.js";
import { Check, Inbox, Pin, PinOff, UserPlus, UsersRound, X } from "lucide-react";
import AvatarInitials from "./AvatarInitials";

const Sidebar = () => {
  const {
    acceptFriendRequest,
    friendRequests,
    getFriendRequests,
    getUsers,
    isUsersLoading,
    pinnedUserIds,
    rejectFriendRequest,
    searchUsers,
    selectedUser,
    sendFriendRequest,
    setSelectedUser,
    setUserSearchText,
    togglePinnedUser,
    userSearchText,
    users,
  } = useChatStore();

  const { onlineUsers, socket } = useAuthStore();
  const [filterMode, setFilterMode] = useState("all");
  const hasSearchedRef = useRef(false);
  const isSearching = userSearchText.trim().length > 0;

  useEffect(() => {
    getUsers();
    getFriendRequests();
  }, [getFriendRequests, getUsers]);

  useEffect(() => {
    if (!socket) return;

    const refreshFriends = () => {
      getFriendRequests();
      const nextSearch = userSearchText.trim();
      if (nextSearch) {
        searchUsers(nextSearch);
      } else {
        getUsers();
      }
    };

    socket.on("friendUpdate", refreshFriends);

    return () => socket.off("friendUpdate", refreshFriends);
  }, [getFriendRequests, getUsers, searchUsers, socket, userSearchText]);

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
      return a.firstname.localeCompare(b.firstname);
    });
  const skeletonRows = Array(7).fill(null);

  const renderUserAction = (user) => {
    if (!isSearching || user.friendshipStatus === "friends") return null;

    if (user.friendshipStatus === "sent") {
      return <span className="text-xs text-base-content/50">Sent</span>;
    }

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
    if (isSearching && user.friendshipStatus === "friends") {
      setUserSearchText("");
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
          {friendRequests.received.length > 0 && (
            <span className="badge badge-primary badge-sm rounded-full">{friendRequests.received.length}</span>
          )}
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
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`btn btn-xs h-7 min-h-7 rounded-full px-3 ${filterMode === "all" ? "btn-primary" : "btn-ghost text-base-content/70"}`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("pinned")}
              className={`btn btn-xs h-7 min-h-7 rounded-full px-3 ${filterMode === "pinned" ? "btn-primary" : "btn-ghost text-base-content/70"}`}
            >
              <Pin className="size-3" />
              Pinned
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("online")}
              className={`btn btn-xs h-7 min-h-7 rounded-full px-3 ${filterMode === "online" ? "btn-primary" : "btn-ghost text-base-content/70"}`}
            >
              Online
            </button>
          </div>
        )}
      </div>

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
                <div className="text-sm font-medium truncate">{user.firstname}</div>
                <div className="text-xs text-base-content/50 truncate">@{user.username}</div>
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

        {!isUsersLoading && filteredUsers.map((user) => {
          const isPinned = pinnedUserIds.includes(user._id);
          const canOpenChat = user.friendshipStatus === "friends" || !isSearching;

          return (
            <div
              key={user._id}
              className={`group mx-2 flex w-[calc(100%-1rem)] items-center gap-2 rounded-xl transition-all duration-150 ${
                selectedUser?._id === user._id
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
                  </div>
                  <div className="truncate text-xs text-base-content/50">@{user.username || "not-set"}</div>
                </div>
              </button>

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

        {!isUsersLoading && filteredUsers.length === 0 && (
          <div className="p-6 text-center text-sm text-base-content/60">
            <UserPlus className="size-8 mx-auto mb-3 text-base-content/30" />
            <div className="font-medium text-base-content">
              {isSearching ? "No users found" : filterMode === "pinned" ? "No pinned chats" : "No friends yet"}
            </div>
            <p className="mt-1">
              {isSearching
                ? "Try another username or name."
                : filterMode === "pinned"
                  ? "Pin your important chats from the list."
                  : "Search a username above and send a friend request."}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatstore";
import { useAuthStore } from "../store/useAuhstore.js";
import { Check, Inbox, Search, UserPlus, UsersRound, X } from "lucide-react";

const Sidebar = () => {
  const {
    acceptFriendRequest,
    friendRequests,
    getFriendRequests,
    getUsers,
    isUsersLoading,
    rejectFriendRequest,
    searchUsers,
    selectedUser,
    sendFriendRequest,
    setSelectedUser,
    users,
  } = useChatStore();

  const { onlineUsers, socket } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchText, setSearchText] = useState("");
  const hasSearchedRef = useRef(false);
  const isSearching = searchText.trim().length > 0;

  useEffect(() => {
    getUsers();
    getFriendRequests();
  }, [getFriendRequests, getUsers]);

  useEffect(() => {
    if (!socket) return;

    const refreshFriends = () => {
      getUsers();
      getFriendRequests();
    };

    socket.on("friendUpdate", refreshFriends);

    return () => socket.off("friendUpdate", refreshFriends);
  }, [getFriendRequests, getUsers, socket]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextSearch = searchText.trim();

      if (nextSearch) {
        hasSearchedRef.current = true;
        searchUsers(nextSearch);
      } else if (hasSearchedRef.current) {
        hasSearchedRef.current = false;
        getUsers();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText, getUsers, searchUsers]);

  const filteredUsers = showOnlineOnly && !isSearching
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;
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

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-r border-base-300/70 bg-base-100 lg:w-72">
      <div className="w-full flex-shrink-0 border-b border-base-300/70 bg-base-100 p-3">
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

        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-base-content/40" />
          <input
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search username"
            className="input input-bordered input-sm w-full rounded-lg pl-9 pr-9"
          />
          {searchText && (
            <button
              type="button"
              onClick={() => setSearchText("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-base-300"
              aria-label="Clear search"
            >
              <X className="size-4 text-base-content/50" />
            </button>
          )}
        </div>

        {!isSearching && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setShowOnlineOnly(false)}
              className={`btn btn-xs h-7 min-h-7 rounded-full px-3 ${!showOnlineOnly ? "btn-primary" : "btn-ghost text-base-content/70"}`}
            >
              All
            </button>
            <label className={`btn btn-xs h-7 min-h-7 rounded-full px-3 ${showOnlineOnly ? "btn-primary" : "btn-ghost text-base-content/70"}`}>
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="hidden"
              />
              Online
            </label>
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
              <img src={user.profilePicture || "/avatar.png"} alt={user.firstname} className="size-9 rounded-full object-cover" />
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

        {!isUsersLoading && filteredUsers.map((user) => (
          <button
            key={user._id}
            onClick={() => user.friendshipStatus === "friends" || !isSearching ? setSelectedUser(user) : null}
            className={`mx-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
              selectedUser?._id === user._id
                ? "bg-primary/10 text-primary"
                : "hover:bg-base-200/50"
            }`}
          >
            <div className="relative flex-shrink-0">
              <img
                src={user.profilePicture || "/avatar.png"}
                alt={user.firstname}
                className="size-10 rounded-full object-cover"
              />
              {onlineUsers.includes(user._id) && (
                <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-base-100" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium leading-tight text-base-content">{user.firstname}</div>
              <div className="text-xs text-base-content/50 truncate">@{user.username || "not-set"}</div>
            </div>

            {renderUserAction(user)}
          </button>
        ))}

        {!isUsersLoading && filteredUsers.length === 0 && (
          <div className="p-6 text-center text-sm text-base-content/60">
            <UserPlus className="size-8 mx-auto mb-3 text-base-content/30" />
            <div className="font-medium text-base-content">
              {isSearching ? "No users found" : "No friends yet"}
            </div>
            <p className="mt-1">
              {isSearching ? "Try another username or name." : "Search a username above and send a friend request."}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatstore";
import { useAuthStore } from "../store/useAuhstore.js";
import { Check, Search, UserPlus, X } from "lucide-react";

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
  const onlineCount = Math.max(onlineUsers.length - 1, 0);
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
    <aside className="h-full w-full lg:w-80 border-r border-base-300 flex flex-col bg-base-100">
      <div className="border-b border-base-300 w-full p-4 flex-shrink-0 bg-base-100">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-semibold leading-tight truncate">Chats</h2>
            <p className="text-xs text-base-content/50">Friends and requests</p>
          </div>
          {friendRequests.received.length > 0 && (
            <span className="badge badge-primary badge-sm">{friendRequests.received.length}</span>
          )}
        </div>

        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-base-content/40" />
          <input
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search username"
            className="input input-bordered input-sm w-full pl-9 pr-9 rounded-md"
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
          <div className="mt-3 flex items-center justify-between gap-2">
            <label className="cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="toggle toggle-sm"
              />
              <span className="text-sm">Online only</span>
            </label>
            <span className="text-xs text-zinc-500">{onlineCount} online</span>
          </div>
        )}
      </div>

      {!isSearching && friendRequests.received.length > 0 && (
        <div className="border-b border-base-300 p-3 space-y-2 bg-base-200/40">
          <div className="text-xs font-semibold text-base-content/60">Friend requests</div>
          {friendRequests.received.map((user) => (
            <div key={user._id} className="flex items-center gap-2">
              <img src={user.profilePicture || "/avatar.png"} alt={user.firstname} className="size-9 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{user.firstname}</div>
                <div className="text-xs text-base-content/50 truncate">@{user.username}</div>
              </div>
              <button onClick={() => acceptFriendRequest(user._id)} className="btn btn-xs btn-primary" aria-label="Accept request">
                <Check className="size-3" />
              </button>
              <button onClick={() => rejectFriendRequest(user._id)} className="btn btn-xs btn-ghost" aria-label="Reject request">
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-y-auto w-full p-3 flex-1 bg-base-200/25">
        {isUsersLoading && skeletonRows.map((_, index) => (
          <div key={index} className="w-full p-3 flex items-center gap-3 rounded-md bg-base-100 border border-base-300 mb-2">
            <div className="skeleton size-12 rounded-full flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="skeleton h-4 w-28 mb-2" />
              <div className="skeleton h-3 w-16" />
            </div>
          </div>
        ))}

        {!isUsersLoading && filteredUsers.map((user) => (
          <button
            key={user._id}
            onClick={() => user.friendshipStatus === "friends" || !isSearching ? setSelectedUser(user) : null}
            className={`w-full p-3 mb-2 flex items-center gap-3 rounded-md border text-left transition-colors ${
              selectedUser?._id === user._id
                ? "bg-primary/10 border-primary/40"
                : "bg-base-100 border-base-300 hover:border-primary/30 hover:bg-base-100"
            }`}
          >
            <div className="relative flex-shrink-0">
              <img
                src={user.profilePicture || "/avatar.png"}
                alt={user.firstname}
                className="size-12 object-cover rounded-full"
              />
              {onlineUsers.includes(user._id) && (
                <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-base-100" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="font-medium truncate leading-tight">{user.firstname}</div>
              <div className="text-xs text-base-content/50 truncate">@{user.username || "not-set"}</div>
              {!isSearching && (
                <div className="text-xs text-base-content/40">{onlineUsers.includes(user._id) ? "Online" : "Offline"}</div>
              )}
            </div>

            {renderUserAction(user)}
          </button>
        ))}

        {!isUsersLoading && filteredUsers.length === 0 && (
          <div className="rounded-md border border-dashed border-base-300 bg-base-100 p-6 text-center text-sm text-base-content/60">
            <UserPlus className="size-8 mx-auto mb-3 text-primary" />
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

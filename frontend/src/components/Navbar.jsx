import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuhstore";
import { useChatStore } from "../store/useChatstore";
import { Bell, CheckCheck, LogOut, MessageCircleMore, Search, Settings2, Trash2, UserRound, X } from "lucide-react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const {
    clearNotifications,
    markNotificationsRead,
    notifications,
    setSelectedUser,
    setUserSearchText,
    unreadNotificationCount,
    userSearchText,
    users,
  } = useChatStore();
  const location = useLocation();
  const navigate = useNavigate();

  const showSearch = Boolean(authUser);

  const openSearchContext = (forceSidebar = false) => {
    if (location.pathname !== "/") navigate("/");
    if (forceSidebar || window.innerWidth < 1024) setSelectedUser(null);
  };

  const handleSearchFocus = () => {
    if (userSearchText.trim()) openSearchContext(true);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter" && userSearchText.trim()) {
      event.preventDefault();
      openSearchContext(true);
    }

    if (event.key === "Escape") {
      setUserSearchText("");
      event.currentTarget.blur();
    }
  };

  const handleSearchChange = (event) => {
    const nextSearch = event.target.value;
    setUserSearchText(nextSearch);
    if (nextSearch.trim()) openSearchContext(true);
  };

  const clearSearch = () => {
    setUserSearchText("");
  };

  const openNotification = (notification) => {
    markNotificationsRead();

    if (notification.type === "message" && notification.userId) {
      const user = users.find((item) => item._id === notification.userId);
      if (user) {
        setSelectedUser(user);
        setUserSearchText("");
        if (location.pathname !== "/") navigate("/");
      }
    }
  };

  const handleLogout = () => {
    setUserSearchText("");
    setSelectedUser(null);
    clearNotifications();
    logout();
  };

  return (
    <header className="grid h-14 min-h-14 grid-cols-[auto_minmax(8rem,1fr)_auto] items-center gap-2 border-b border-base-300/70 bg-base-100/90 px-2 backdrop-blur supports-[backdrop-filter]:bg-base-100/75 sm:gap-3 sm:px-4">
      <div className="min-w-0">
        <Link to="/" className="group flex min-w-0 items-center gap-2" aria-label="Yaroo home">
          <span className="relative flex size-9 flex-shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary text-primary-content shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5">
            <MessageCircleMore className="size-4.5" strokeWidth={2.3} />
            <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-accent ring-2 ring-base-100" />
          </span>
          <span className="hidden truncate text-[15px] font-bold tracking-normal text-base-content sm:block">Yaroo</span>
        </Link>
      </div>

      <div className="flex min-w-0 justify-center">
        {showSearch && (
          <label className="input input-bordered input-sm flex h-9 min-h-9 w-full max-w-xl items-center gap-2 rounded-lg bg-base-100/80 px-3 shadow-sm transition-colors focus-within:border-primary">
            <Search className="size-4 flex-shrink-0 text-base-content/45" />
            <input
              type="text"
              autoComplete="off"
              value={userSearchText}
              onFocus={handleSearchFocus}
              onKeyDown={handleSearchKeyDown}
              onChange={handleSearchChange}
              placeholder="Search username"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-base-content/45"
              aria-label="Search friends by username"
            />
            {userSearchText && (
              <button
                type="button"
                onClick={clearSearch}
                className="rounded-md p-0.5 text-base-content/45 hover:bg-base-200 hover:text-base-content"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </label>
        )}
      </div>

      <nav className="flex flex-shrink-0 justify-end gap-1">
        {authUser && (
          <div className="dropdown dropdown-end">
            <button
              type="button"
              tabIndex={0}
              className="btn btn-ghost btn-sm btn-square rounded-xl"
              onClick={markNotificationsRead}
              aria-label="Notifications"
              title="Notifications"
            >
              <span className="indicator">
                {unreadNotificationCount > 0 && (
                  <span className="badge badge-primary badge-xs indicator-item px-1 text-[10px]">
                    {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                  </span>
                )}
                <Bell className="size-4" strokeWidth={2.2} />
              </span>
            </button>

            <div
              tabIndex={0}
              className="dropdown-content z-50 mt-2 w-80 rounded-lg border border-base-300 bg-base-100 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-base-300 px-3 py-2">
                <div className="text-sm font-semibold">Notifications</div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs btn-square rounded-md"
                    onClick={markNotificationsRead}
                    aria-label="Mark all as read"
                    title="Mark all as read"
                  >
                    <CheckCheck className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs btn-square rounded-md"
                    onClick={clearNotifications}
                    aria-label="Clear notifications"
                    title="Clear notifications"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto py-1">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-base-content/55">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <button
                      type="button"
                      key={notification.id}
                      onClick={() => openNotification(notification)}
                      className="flex w-full gap-2 px-3 py-2 text-left hover:bg-base-200/70"
                    >
                      <span className={`mt-1 size-2 flex-shrink-0 rounded-full ${notification.read ? "bg-base-300" : "bg-primary"}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{notification.title}</span>
                        <span className="block truncate text-xs text-base-content/60">{notification.body}</span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <Link to="/setting" className="btn btn-ghost btn-sm btn-square rounded-xl" aria-label="Settings" title="Settings">
          <Settings2 className="size-4" strokeWidth={2.2} />
        </Link>

        {authUser && (
          <>
            <Link to="/profile" className="btn btn-ghost btn-sm btn-square rounded-xl" aria-label="Profile" title="Profile">
              <UserRound className="size-4" strokeWidth={2.2} />
            </Link>

            <button className="btn btn-ghost btn-sm btn-square rounded-xl" onClick={handleLogout} aria-label="Logout" title="Logout">
              <LogOut className="size-4" strokeWidth={2.2} />
            </button>
          </>
        )}
      </nav>
    </header>
  );
};
export default Navbar;

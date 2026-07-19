import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuhstore";
import { useChatStore } from "../store/useChatstore";
import { Bell, CheckCheck, LogOut, Moon, Search, Settings2, SunMedium, Trash2, UserRound, X } from "lucide-react";
import { Usethemes } from "../store/useTheme";
import AvatarInitials from "./AvatarInitials";
import BrandLogo from "./BrandLogo";

const darkThemes = new Set(["dark", "night", "black", "dracula", "business", "dim", "sunset", "halloween", "forest", "luxury", "coffee"]);

const Navbar = () => {
  const { logout, authUser, onlineUsers } = useAuthStore();
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
  const { theme, setTheme } = Usethemes();
  const location = useLocation();
  const navigate = useNavigate();

  const showSearch = Boolean(authUser);
  const isDarkTheme = darkThemes.has(theme);

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

  const toggleTheme = () => {
    setTheme(isDarkTheme ? "winter" : "night");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-base-300/60 bg-base-100/85 px-2 py-2 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-base-100/70 sm:px-4">
      <div className="grid h-12 min-h-12 grid-cols-[auto_minmax(7rem,1fr)_auto] items-center gap-2 sm:gap-3">
      <div className="min-w-0">
        <Link
          to="/"
          className="group inline-flex min-w-0 items-center rounded-xl px-1.5 py-1 transition-colors hover:bg-base-200/70"
          aria-label="Yaroo home"
        >
          <BrandLogo size="sm" className="transition-transform duration-200 group-hover:-translate-y-0.5 [&>span:last-child]:hidden md:[&>span:last-child]:block" />
        </Link>
      </div>

      <div className="flex min-w-0 justify-center">
        {showSearch && (
          <label className="flex h-10 min-h-10 w-full max-w-2xl items-center gap-2 rounded-xl border border-base-300/70 bg-base-200/55 px-3 shadow-inner transition-colors focus-within:border-primary focus-within:bg-base-100">
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

      <nav className="flex flex-shrink-0 items-center justify-end gap-1">
        {authUser && (
          <div className="hidden items-center gap-1 rounded-xl border border-base-300/60 bg-base-200/50 px-2.5 py-1.5 text-xs text-base-content/70 lg:flex">
            <span className="size-2 rounded-full bg-success shadow-[0_0_0_3px_hsl(var(--su)/0.14)]" />
            <span className="font-medium text-base-content">{onlineUsers.length}</span>
            online
          </div>
        )}

        <button
          type="button"
          className="btn btn-ghost btn-sm btn-square rounded-xl"
          onClick={toggleTheme}
          aria-label={isDarkTheme ? "Switch to light theme" : "Switch to dark theme"}
          title={isDarkTheme ? "Light theme" : "Dark theme"}
        >
          {isDarkTheme ? <SunMedium className="size-4" strokeWidth={2.2} /> : <Moon className="size-4" strokeWidth={2.2} />}
        </button>

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
            <Link to="/profile" className="btn btn-ghost btn-sm h-9 min-h-9 gap-2 rounded-xl px-2" aria-label="Profile" title="Profile">
              <AvatarInitials user={authUser} alt={authUser.firstname} className="size-6" textClassName="text-[10px]" />
              <UserRound className="hidden size-4 sm:block" strokeWidth={2.2} />
            </Link>

            <button className="btn btn-ghost btn-sm btn-square rounded-xl" onClick={handleLogout} aria-label="Logout" title="Logout">
              <LogOut className="size-4" strokeWidth={2.2} />
            </button>
          </>
        )}
      </nav>
      </div>
    </header>
  );
};
export default Navbar;

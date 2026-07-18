import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuhstore";
import { useChatStore } from "../store/useChatstore";
import { LogOut, MessageCircleMore, Search, Settings2, UserRound, X } from "lucide-react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const { setSelectedUser, setUserSearchText, userSearchText } = useChatStore();
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

  const handleLogout = () => {
    setUserSearchText("");
    setSelectedUser(null);
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

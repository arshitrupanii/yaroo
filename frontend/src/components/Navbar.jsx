import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuhstore";
import { LogOut, MessageCircle, Settings2, UserRound } from "lucide-react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();

  return (
    <header className="navbar h-14 min-h-14 border-b border-base-300/70 bg-base-100/95 px-3 backdrop-blur sm:px-4">
      <div className="navbar-start min-w-0">
        <Link to="/" className="group flex min-w-0 items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-content shadow-sm transition-transform group-hover:scale-105">
            <MessageCircle className="size-4" strokeWidth={2.4} />
          </span>
          <span className="truncate text-base font-semibold tracking-tight">Yaroo</span>
        </Link>
      </div>

      <nav className="navbar-end gap-1">
        <Link to="/setting" className="btn btn-ghost btn-sm btn-square rounded-xl" aria-label="Settings" title="Settings">
          <Settings2 className="size-4" strokeWidth={2.2} />
        </Link>

        {authUser && (
          <>
            <Link to="/profile" className="btn btn-ghost btn-sm btn-square rounded-xl" aria-label="Profile" title="Profile">
              <UserRound className="size-4" strokeWidth={2.2} />
            </Link>

            <button className="btn btn-ghost btn-sm btn-square rounded-xl" onClick={logout} aria-label="Logout" title="Logout">
              <LogOut className="size-4" strokeWidth={2.2} />
            </button>
          </>
        )}
      </nav>
    </header>
  );
};
export default Navbar;

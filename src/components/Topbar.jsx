import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Crown,
  Search,
  Bell,
  Menu,
  Calendar,
  ChevronDown,
  Eye,
  Settings,
  LogOut,
} from "lucide-react";
import toast from "react-hot-toast";
import { UserContext } from "../context/UserContext";
import api from "../utils/axiosInstance";

export default function Topbar({ onMenuClick }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await api.post("/logout");
      toast.success("Logout Successful");
      navigate("/");
    } catch (error) {
      toast.error("Logout failed. Please try again.");
    } finally {
      setIsLoggingOut(false);
      setProfileOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-stone-200/60 shrink-0">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-stone-600 hover:text-stone-900 p-2 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="lg:hidden flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
              <Crown className="w-4 h-4 text-stone-900" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold text-stone-800 tracking-widest">
              LUXE
            </span>
          </div>

          <div className="hidden sm:flex items-center flex-1 max-w-sm">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders, products..."
                className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 placeholder-stone-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
              />
              <kbd className="hidden md:inline-block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200 font-mono">
                Ctrl K
              </kbd>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button className="sm:hidden text-stone-500 hover:text-stone-700 p-2 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer">
            <Search className="w-4 h-4" />
          </button>

          <button className="hidden md:flex items-center gap-1.5 text-stone-500 hover:text-stone-700 px-3 py-2 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer text-sm">
            <Calendar className="w-4 h-4" />
            <span className="text-stone-600 font-medium text-xs">Today</span>
          </button>

          <button className="relative text-stone-500 hover:text-stone-700 p-2 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-amber-500 rounded-full ring-2 ring-white" />
          </button>

          <div className="w-px h-7 bg-stone-200 hidden sm:block" />

          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-900 font-bold text-[10px]">
                AD
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-stone-700 leading-none">
                  Admin
                </p>
                <p className="text-[9px] text-stone-400 mt-0.5">Owner</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 hidden sm:block" />
            </button>

            {profileOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-stone-200 py-2 z-50">
                  <div className="px-4 py-2.5 border-b border-stone-100">
                    <p className="text-sm font-semibold text-stone-800">
                      {user?.full_name || "Admin user"}
                    </p>
                    <p className="text-xs text-stone-500">
                      {user?.email || "admin@luxe.com"}
                    </p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        navigate("/dashboard/profile");
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Profile
                    </button>
                    <button
                      onClick={() => {
                        navigate("/dashboard/settings");
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Settings
                    </button>
                  </div>
                  <div className="border-t border-stone-100 pt-1">
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                        isLoggingOut
                          ? "text-red-300 cursor-not-allowed bg-red-50/50"
                          : "text-red-600 hover:bg-red-50 cursor-pointer"
                      }`}
                    >
                      <LogOut
                        className={`w-3.5 h-3.5 shrink-0 ${isLoggingOut ? "animate-spin" : ""}`}
                      />
                      {isLoggingOut ? "Signing out..." : "Sign Out"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
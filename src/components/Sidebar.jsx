import { useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Crown,
  Home,
  ShoppingBag,
  ShoppingCart,
  Users,
  BarChart3,
  CreditCard,
  Truck,
  Gift,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { UserContext } from "../context/UserContext";
import api from "../utils/axiosInstance";

const navItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard", badge: null },
  {
    icon: ShoppingBag,
    label: "Products",
    path: "/dashboard/products",
    badge: null,
  },
  {
    icon: ShoppingCart,
    label: "Orders",
    path: "/dashboard/orders",
    badge: "24",
  },
  {
    icon: Users,
    label: "Customers",
    path: "/dashboard/customers",
    badge: null,
  },
  {
    icon: BarChart3,
    label: "Analytics",
    path: "/dashboard/analytics",
    badge: null,
  },
  {
    icon: CreditCard,
    label: "Payments",
    path: "/dashboard/payments",
    badge: "3",
  },
  { icon: Truck, label: "Shipping", path: "/dashboard/shipping", badge: null },
  {
    icon: Gift,
    label: "Promotions",
    path: "/dashboard/promotions",
    badge: null,
  },
  {
    icon: Settings,
    label: "Settings",
    path: "/dashboard/settings",
    badge: null,
  },
];

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const active = (path) => location.pathname === path;

  const { user } = useContext(UserContext);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    }
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-50 lg:z-10 w-60 bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 flex flex-col transition-transform duration-300 ease-in-out shrink-0 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-5 py-5 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Crown className="w-5 h-5 text-stone-900" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-widest leading-none">
                LUXE
              </h1>
              <p className="text-amber-400/60 text-[7px] tracking-[0.3em] uppercase font-medium mt-0.5">
                Admin Panel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-stone-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="relative z-10 flex-1 py-4 px-3 space-y-0.5 overflow-y-auto sidebar-scroll">
          <p className="text-[9px] uppercase tracking-[0.2em] text-stone-500 font-semibold px-3 mb-2">
            Main Menu
          </p>

          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                navigate(item.path);
                onClose();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group cursor-pointer ${
                active(item.path)
                  ? "bg-gradient-to-r from-amber-500/15 to-amber-500/5 text-amber-400 border border-amber-500/20"
                  : "text-stone-400 hover:text-stone-200 hover:bg-white/5"
              }`}
            >
              <item.icon
                className={`w-4 h-4 shrink-0 ${
                  active(item.path)
                    ? "text-amber-400"
                    : "text-stone-500 group-hover:text-stone-300"
                }`}
              />
              <span className="flex-1 text-left text-[13px]">{item.label}</span>
              {item.badge && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    active(item.path)
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-white/10 text-stone-400"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="relative z-10 p-3 border-t border-white/5 shrink-0">
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 hover:bg-white/8 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-900 font-bold text-xs shrink-0">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {user?.full_name || "Admin user"}
              </p>
              <p className="text-[10px] text-stone-500 truncate">
                {user?.email || "admin@luxe.com"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`transition-colors p-1 shrink-0 ${
                isLoggingOut
                  ? "opacity-50 cursor-not-allowed text-stone-500"
                  : "text-stone-500 hover:text-red-400 cursor-pointer"
              }`}
              title={isLoggingOut ? "Logging out..." : "Logout"}
            >
              <LogOut
                className={`w-3.5 h-3.5 ${isLoggingOut ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        <style>{`
          .sidebar-scroll::-webkit-scrollbar { width: 3px; }
          .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
          .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(217,119,6,0.25); border-radius: 10px; }
          .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: rgba(217,119,6,0.5); }
          .sidebar-scroll { scrollbar-width: thin; scrollbar-color: rgba(217,119,6,0.25) transparent; }
        `}</style>
      </aside>
    </>
  );
}
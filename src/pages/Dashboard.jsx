import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Users, Settings, LogOut, Search, Bell, Plus } from "lucide-react";
import supabase from "../utils/supabaseClient";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      setUser(user);
    };
    getUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-stone-200/60 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/orignal_logo.png"
              alt="NexTalk"
              className="w-9 h-9 object-contain"
            />
            <span className="text-xl font-bold text-stone-900">
              Nex<span className="text-amber-500">Talk</span>
            </span>
          </div>

          {/* Search - hidden on small screens */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 bg-stone-100 border border-transparent rounded-lg text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-stone-200 focus:ring-1 focus:ring-amber-400/30 transition-all"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <button className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-stone-200 mx-1" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <span className="text-white text-sm font-semibold">{avatarLetter}</span>
              </div>
              <span className="hidden sm:block text-sm font-medium text-stone-700 max-w-[120px] truncate">
                {displayName}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">
            Welcome back, <span className="text-amber-500">{displayName}</span>
          </h1>
          <p className="mt-1 text-stone-500">Here's what's happening with your conversations.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-stone-200/60 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-900">0</p>
                <p className="text-sm text-stone-500">Conversations</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-stone-200/60 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-900">0</p>
                <p className="text-sm text-stone-500">Contacts</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-stone-200/60 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <Bell className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-900">0</p>
                <p className="text-sm text-stone-500">Notifications</p>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-xl border border-stone-200/60 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-stone-900">No conversations yet</h3>
          <p className="mt-2 text-stone-500 max-w-sm mx-auto">
            Start a new conversation to connect with your team and begin collaborating.
          </p>
          <button className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 cursor-pointer">
            <Plus className="w-5 h-5" />
            Start a conversation
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

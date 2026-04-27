import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AuthCallback from "./pages/AuthCallback";
import LoginPage from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import CompleteProfile from "./pages/auth/CompleteProfile";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";

// Chat module
import ChatHome from "./pages/chat/ChatHome";
import ChatThread from "./pages/chat/ChatThread";
import NewChat from "./pages/chat/NewChat";
import NewGroup from "./pages/chat/NewGroup";
import Explore from "./pages/chat/Explore";
import UserProfile from "./pages/chat/UserProfile";
import Contacts from "./pages/chat/Contacts";
import Settings from "./pages/chat/Settings";
import ChatWallpaper from "./pages/chat/ChatWallpaper";
import PrivacySettings from "./pages/chat/PrivacySettings";
import Archived from "./pages/chat/Archived";
import Starred from "./pages/chat/Starred";
import Blocked from "./pages/chat/Blocked";

// Product pages
import Features from "./pages/product/Features";
import Security from "./pages/product/Security";
import Integrations from "./pages/product/Integrations";
import Changelog from "./pages/product/Changelog";

// Company pages
import About from "./pages/company/About";
import Blog from "./pages/company/Blog";
import Careers from "./pages/company/Careers";
import Contact from "./pages/company/Contact";

// Legal pages
import Privacy from "./pages/legal/Privacy";
import Terms from "./pages/legal/Terms";
import Cookies from "./pages/legal/Cookies";
import Licenses from "./pages/legal/Licenses";

export default function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />

        {/* Chat module — specific routes first so they outrank /chat/:id */}
        <Route path="/chat/new" element={<NewChat />} />
        <Route path="/chat/new-group" element={<NewGroup />} />
        <Route path="/chat/explore" element={<Explore />} />
        <Route path="/chat/contacts" element={<Contacts />} />
        <Route path="/chat/archived" element={<Archived />}>
          <Route path=":id" element={<ChatThread />} />
        </Route>
        <Route path="/chat/starred" element={<Starred />} />
        <Route path="/chat/blocked" element={<Blocked />} />
        <Route path="/chat/settings" element={<Settings />} />
        <Route path="/chat/settings/privacy" element={<PrivacySettings />} />
        <Route path="/chat/settings/wallpaper" element={<ChatWallpaper />} />
        <Route path="/chat/profile/:id" element={<UserProfile />} />

        {/* Split view (chat list + thread) — handles /chat and /chat/:id */}
        <Route path="/chat" element={<ChatHome />} />
        <Route path="/chat/:id" element={<ChatHome />} />

        {/* Product */}
        <Route path="/features" element={<Features />} />
        <Route path="/security" element={<Security />} />
        <Route path="/integrations" element={<Integrations />} />
        <Route path="/changelog" element={<Changelog />} />

        {/* Company */}
        <Route path="/about" element={<About />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/contact" element={<Contact />} />

        {/* Legal */}
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route path="/licenses" element={<Licenses />} />

        <Route path="*" element={<NotFound />} />
      </Routes>

      <Toaster
        position="top-center"
        gutter={8}
        toastOptions={{
          duration: 2500,
          style: {
            borderRadius: "14px",
            padding: "10px 14px",
            fontSize: "13.5px",
            fontWeight: 500,
            maxWidth: "360px",
            boxShadow: "0 10px 30px -10px rgba(0,0,0,0.25)",
          },
        }}
      />
    </div>
  );
}

import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AuthCallback from "./pages/AuthCallback";
import LoginPage from "./pages/auth/Login";
import DashboardPage from "./pages/Dashboard";
import Signup from "./pages/auth/Signup";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";

export default function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Toaster />
    </div>
  );
}

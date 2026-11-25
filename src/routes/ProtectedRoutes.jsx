import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { AppShellSkeleton } from "../components/chat/Skeleton";
import { rememberRedirect } from "./redirectStore";

/** Gates everything that needs a signed-in user. */
const ProtectedRoutes = () => {
  const { isAuthenticated, loading } = useUser();
  const location = useLocation();

  if (loading) return <AppShellSkeleton />;

  if (!isAuthenticated) {
    rememberRedirect(location.pathname + location.search);
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoutes;

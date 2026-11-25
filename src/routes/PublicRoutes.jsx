import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "../context/UserContext";
import RouteLoader from "../components/RouteLoader";

/** Keeps already-signed-in users off the auth page. */
const PublicRoutes = () => {
  const { isAuthenticated, loading } = useUser();

  if (loading) return <RouteLoader />;
  if (isAuthenticated) return <Navigate to="/chat" replace />;

  return <Outlet />;
};

export default PublicRoutes;

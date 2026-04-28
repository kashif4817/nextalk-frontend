import { Navigate, Outlet } from 'react-router-dom'
import { useUser } from '../context/UserContext'

export default function PublicRoutes() {
  const { user, loading } = useUser()

  if (loading) return null

  return user ? <Navigate to="/chat" replace /> : <Outlet />
}

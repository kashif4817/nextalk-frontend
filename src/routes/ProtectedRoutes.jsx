import { Navigate, Outlet } from 'react-router-dom'
import { useUser } from '../context/UserContext'

export default function ProtectedRoutes() {
  const { user, loading } = useUser()

  if (loading) return <div className="h-screen bg-stone-50 dark:bg-stone-900" />

  return user ? <Outlet /> : <Navigate to="/login" replace />
}

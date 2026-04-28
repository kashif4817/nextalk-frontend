import { createContext, useContext, useEffect, useState } from 'react'
import supabase from '../utils/supabaseClient'
import { getMe } from '../api/users/user'
import { normalizeUser } from '../utils/formatters'
import { connectSocket, disconnectSocket } from '../lib/socket'

const UserContext = createContext(null)

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        connectSocket(session.access_token)
        if (event === 'TOKEN_REFRESHED') return
        setLoading(true)
        getMe()
          .then(res => setUser(normalizeUser(res.data.data)))
          .catch(() => setUser(null))
          .finally(() => setLoading(false))
      } else {
        disconnectSocket()
        setUser(null)
        setLoading(false)
      }
    })
    return () => {
      subscription.unsubscribe()
      disconnectSocket()
    }
  }, [])

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)

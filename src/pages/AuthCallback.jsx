import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../utils/supabaseClient'

const AuthCallback = () => {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate('/dashboard')  // change to whatever your main page is
      } else {
        navigate('/login')
      }
    })
  }, [])

  return <p>Logging you in, please wait...</p>
}

export default AuthCallback
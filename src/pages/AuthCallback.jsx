import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../utils/supabaseClient'
import NexTalkLogo from '../components/NexTalkLogo'

const AuthCallback = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const resolveDestination = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        navigate('/login')
        return
      }

      // Check if user already has a profile (returning OAuth user)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.session.user.id)
        .maybeSingle()

      navigate(profile ? '/chat' : '/complete-profile')
    }

    resolveDestination()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-amber-500/8 rounded-full blur-[120px] animate-float-slow" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-[100px] animate-float" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 text-center animate-fade-in-up">
        <div className="flex justify-center mb-8">
          <NexTalkLogo className="w-20 h-20" animated />
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">
          Nex<span className="text-amber-400">Talk</span>
        </h1>

        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-2 border-amber-500/20" />
            <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-transparent border-t-amber-400 animate-spin" />
          </div>
        </div>

        <p className="text-stone-400 text-sm font-medium">Signing you in...</p>
        <p className="text-stone-600 text-xs mt-2">Please wait while we verify your account</p>

        <div className="flex justify-center gap-1.5 mt-4">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0ms]" />
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:150ms]" />
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}

export default AuthCallback

import supabase from '../../utils/supabaseClient'

export const loginWithEmail = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export const signupWithEmail = async (name, email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: name } },
  })
  if (error) throw error
  return data
}

export const forgotPassword = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw error
} 

export const logout = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const loginWithGoogle = () => {
  console.log("login with google hit");
  window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`
}

export const loginWithGithub = () => {
  window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/github`
}

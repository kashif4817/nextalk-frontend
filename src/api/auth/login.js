import useOnlineGuard from '../../hooks/useOnlineGuard.js';
import supabase from '../../utils/supabaseClient'
import { withTimeout } from '../../utils/withTimeout.js';


const {checkOnline} =useOnlineGuard();


export const loginWithEmail = async (email, password) => {
  if (!checkOnline()) return;

  const { data, error } = await withTimeout(
    supabase.auth.signInWithPassword({ email, password })
  );
  if (error) throw new Error(error.message)
  return data
}

export const signupWithEmail = async (name, email, password) => {
  if (!checkOnline()) return;

  const { data, error } = await withTimeout(
    supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    })
  );
  if (error) throw new Error(error.message)
  return data
}

export const forgotPassword = async (email) => {
  if (!checkOnline()) return;

  const { error } = await withTimeout(
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
  );
  if (error) throw new Error(error.message)
}

export const logout = async () => {
  if (!checkOnline()) return;

  const { error } = await withTimeout(
    supabase.auth.signOut()
  );
  if (error) throw new Error(error.message)
}

export const loginWithGoogle = () => {
  if (!checkOnline()) return;
  window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`
}

export const loginWithGithub = () => {
  if (!checkOnline()) return;
  window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/github`
}
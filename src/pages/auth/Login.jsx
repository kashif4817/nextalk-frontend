import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Github,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import supabase from "../../utils/supabaseClient";
import NexTalkLogo from "../../components/NexTalkLogo";

const GoogleIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const Spinner = ({ className = "border-stone-300 border-t-stone-600" }) => (
  <div className={`w-5 h-5 border-2 rounded-full animate-spin ${className}`} />
);

// Three bouncing dots, reusing the typing-dot keyframe from index.css.
const TypingDots = () => (
  <span className="flex items-center gap-1 py-1">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-amber-300/70"
        style={{
          animation: "typing-dot 1.4s ease-in-out infinite",
          animationDelay: `${i * 160}ms`,
        }}
      />
    ))}
  </span>
);

const TRUST_POINTS = [
  { icon: ShieldCheck, label: "End-to-end encrypted" },
  { icon: Zap, label: "Realtime sync" },
  { icon: Users, label: "Free for small teams" },
];

const Login = () => {
  const location = useLocation();

  // Which provider is mid-redirect, or null. Drives the spinner and locks both buttons.
  const [pending, setPending] = useState(null);
  // Seeded with any failure handed over by /auth/callback.
  const [message, setMessage] = useState(location.state?.authError ?? "");

  const signInWith = async (provider) => {
    setPending(provider);
    setMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        // Derived from the current origin so this keeps working once deployed.
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    // On success the browser navigates away, so this only runs on failure.
    if (error) {
      setMessage(error.message);
      setPending(null);
    }
  };

  // Shared button chrome — the two providers only differ by icon and label.
  const providerButton =
    "group relative w-full flex items-center justify-center h-14 rounded-2xl border border-stone-200 bg-white text-stone-700 font-medium shadow-sm transition-all duration-200 cursor-pointer " +
    "hover:border-stone-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 " +
    "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-sm disabled:hover:border-stone-200";

  return (
    // Locked to the viewport — the page itself never scrolls.
    <div className="h-dvh overflow-hidden flex bg-white">
      {/* ─── Left Panel — branding ─── */}
      <div className="hidden lg:flex lg:w-1/2 h-full relative bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 flex-col justify-between p-8 xl:p-12 overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute -top-28 -left-24 w-[26rem] h-[26rem] rounded-full bg-amber-500/20 blur-[120px] animate-float-slow" />
        <div className="absolute -bottom-32 -right-24 w-[30rem] h-[30rem] rounded-full bg-orange-600/20 blur-[130px] animate-float" />

        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
          aria-hidden="true"
        />

        {/* Top — back to site */}
        <Link
          to="/"
          className="relative z-10 inline-flex items-center gap-2 text-sm text-stone-400 hover:text-amber-300 transition-colors w-fit animate-fade-in"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        {/* Middle — logo, headline, chat preview */}
        <div className="relative z-10 max-w-md mx-auto w-full text-center py-6">
          <div className="mb-6 flex justify-center animate-fade-in-up">
            <div className="relative inline-flex">
              <span
                className="absolute inset-0 rounded-full bg-amber-500/25 blur-2xl"
                aria-hidden="true"
              />
              <NexTalkLogo
                className="relative w-20 h-20 xl:w-24 xl:h-24"
                animated
              />
            </div>
          </div>

          <h1 className="text-3xl xl:text-4xl font-bold text-white mb-3 tracking-tight animate-fade-in-up delay-100">
            Welcome to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400">
              NexTalk
            </span>
          </h1>
          <p className="text-stone-400 text-base xl:text-lg leading-relaxed animate-fade-in-up delay-200">
            Connect, collaborate, and communicate seamlessly with your team in
            real time.
          </p>

          {/* Decorative chat preview */}
          <div className="mt-8 xl:mt-10 space-y-3 text-left">
            <div className="flex items-end gap-2.5 animate-slide-in-left delay-300">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 text-[11px] font-semibold text-stone-900 shadow-lg shadow-amber-900/30">
                AR
              </div>
              <div className="bg-white/[0.07] backdrop-blur-sm border border-white/10 rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[78%]">
                <p className="text-stone-200 text-sm">
                  Hey! Did you check the new updates?
                </p>
                <span className="block mt-1 text-[10px] text-stone-500">
                  9:41 AM
                </span>
              </div>
            </div>

            <div className="flex items-end gap-2.5 justify-end animate-slide-in-right delay-500">
              <div className="bg-amber-500/[0.14] backdrop-blur-sm border border-amber-400/25 rounded-2xl rounded-br-md px-4 py-2.5 max-w-[78%]">
                <p className="text-amber-100 text-sm">
                  Yes, the new features look amazing!
                </p>
                <span className="block mt-1 text-[10px] text-amber-200/50">
                  9:42 AM · Seen
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-stone-600 to-stone-700 flex items-center justify-center shrink-0 text-[10px] font-semibold text-stone-100 shadow-lg shadow-black/30">
                YOU
              </div>
            </div>

            <div className="flex items-end gap-2.5 animate-fade-in delay-700">
              <div className="w-8 h-8 shrink-0" aria-hidden="true" />
              <div className="bg-white/[0.05] border border-white/10 rounded-2xl rounded-bl-md px-4 py-2">
                <TypingDots />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom — trust strip */}
        <div className="relative z-10 flex items-center justify-center gap-6 animate-fade-in delay-700">
          {TRUST_POINTS.map((point) => {
            const Icon = point.icon;
            return (
              <div key={point.label} className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-amber-400/80" />
                <span className="text-[11px] text-stone-500">
                  {point.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Right Panel — auth ─── */}
      <div className="relative w-full lg:w-1/2 h-full overflow-hidden">
        {/* Soft amber wash behind the form */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 55% at 50% 0%, rgba(251,191,36,0.10), transparent 70%)",
          }}
          aria-hidden="true"
        />

        {/* Mobile back link */}
        <Link
          to="/"
          className="lg:hidden absolute top-6 left-6 z-10 inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-amber-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Home
        </Link>

        {/* my-auto centres the card and, unlike justify-center, keeps the top
            reachable if a very short viewport ever forces an inner scroll. */}
        <div className="relative h-full overflow-y-auto scrollbar-hide flex flex-col px-6 sm:px-10">
          <div className="w-full max-w-sm mx-auto my-auto py-10 animate-fade-in-up">
            {/* Mobile logo */}
            <div className="lg:hidden flex flex-col items-center gap-3 mb-8">
              <NexTalkLogo className="w-16 h-16" animated />
              <span className="text-xl font-bold text-stone-900 tracking-tight">
                Nex<span className="text-amber-500">Talk</span>
              </span>
            </div>

            <div className="mb-7 text-center lg:text-left">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-100 text-[11px] font-medium text-amber-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Passwordless sign-in
              </span>
              <h2 className="mt-4 text-3xl font-bold text-stone-900 tracking-tight">
                Get started
              </h2>
              <p className="text-stone-500 mt-2 text-sm leading-relaxed">
                Continue with Google or GitHub. We'll create your account
                automatically if you're new here.
              </p>
            </div>

            {/* Provider buttons */}
            <div className="space-y-3">
              <button
                onClick={() => signInWith("google")}
                disabled={pending !== null}
                className={providerButton}
              >
                <span className="absolute left-5 flex items-center">
                  {pending === "google" ? (
                    <Spinner />
                  ) : (
                    <GoogleIcon className="w-5 h-5" />
                  )}
                </span>
                <span>
                  {pending === "google" ? "Redirecting…" : "Continue with Google"}
                </span>
              </button>

              <button
                onClick={() => signInWith("github")}
                disabled={pending !== null}
                className={providerButton}
              >
                <span className="absolute left-5 flex items-center">
                  {pending === "github" ? (
                    <Spinner />
                  ) : (
                    <Github className="w-5 h-5" />
                  )}
                </span>
                <span>
                  {pending === "github" ? "Redirecting…" : "Continue with GitHub"}
                </span>
              </button>
            </div>

            {/* Error */}
            {message && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100 animate-fade-in"
              >
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600 leading-relaxed">{message}</p>
              </div>
            )}

            {/* Reassurance */}
            <div className="mt-6 flex items-start gap-2.5 p-4 rounded-2xl bg-stone-50/80 border border-stone-100">
              <ShieldCheck className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-stone-500 leading-relaxed">
                NexTalk never sees your password — sign-in is handled entirely by
                Google or GitHub.
              </p>
            </div>

            {/* Footer */}
            <p className="mt-6 text-center text-xs text-stone-400 leading-relaxed">
              By continuing, you agree to our{" "}
              <Link
                to="/terms"
                className="text-stone-600 underline-offset-2 hover:text-amber-600 hover:underline transition-colors"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy"
                className="text-stone-600 underline-offset-2 hover:text-amber-600 hover:underline transition-colors"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

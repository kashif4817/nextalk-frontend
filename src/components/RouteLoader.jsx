import NexTalkLogo from "./NexTalkLogo";

/** Shown while the session is being resolved, so guards never flash the wrong page. */
const RouteLoader = ({ label = "Loading..." }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950">
    <div className="text-center">
      <div className="flex justify-center mb-6">
        <NexTalkLogo className="w-16 h-16" animated />
      </div>
      <div className="flex justify-center mb-5">
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-2 border-amber-500/20" />
          <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-transparent border-t-amber-400 animate-spin" />
        </div>
      </div>
      <p className="text-stone-400 text-sm font-medium">{label}</p>
    </div>
  </div>
);

export default RouteLoader;

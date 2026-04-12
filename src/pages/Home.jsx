import { Link } from "react-router-dom";
import {
  MessageCircle,
  Shield,
  Zap,
  Users,
  ArrowRight,
  Menu,
  X,
  Globe,
  Lock,
  Smartphone,
  Star,
  ChevronDown,
  Github,
  Send,
  Video,
  Image,
  Paperclip,
  Search,
  Bell,
  Play,
} from "lucide-react";
import { useState } from "react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
];

const features = [
  {
    icon: Zap,
    title: "Real-Time Messaging",
    description: "Messages delivered instantly with zero lag across all devices.",
    color: "amber",
  },
  {
    icon: Shield,
    title: "End-to-End Encryption",
    description: "Military-grade encryption keeps your conversations private.",
    color: "blue",
  },
  {
    icon: Users,
    title: "Group Conversations",
    description: "Create channels and groups for seamless team collaboration.",
    color: "emerald",
  },
  {
    icon: Globe,
    title: "Cross-Platform",
    description: "Works on desktop, tablet, and mobile with perfect sync.",
    color: "purple",
  },
  {
    icon: Lock,
    title: "Privacy First",
    description: "Zero data selling. Minimal collection. Maximum privacy.",
    color: "rose",
  },
  {
    icon: Smartphone,
    title: "Smart Notifications",
    description: "AI-powered alerts so you never miss what matters.",
    color: "cyan",
  },
];

const featureColors = {
  amber: { bg: "bg-amber-500/10", icon: "text-amber-400", border: "border-amber-500/20" },
  blue: { bg: "bg-blue-500/10", icon: "text-blue-400", border: "border-blue-500/20" },
  emerald: { bg: "bg-emerald-500/10", icon: "text-emerald-400", border: "border-emerald-500/20" },
  purple: { bg: "bg-purple-500/10", icon: "text-purple-400", border: "border-purple-500/20" },
  rose: { bg: "bg-rose-500/10", icon: "text-rose-400", border: "border-rose-500/20" },
  cyan: { bg: "bg-cyan-500/10", icon: "text-cyan-400", border: "border-cyan-500/20" },
};

const stats = [
  { value: "10K+", label: "Active Users" },
  { value: "2M+", label: "Messages Sent" },
  { value: "99.9%", label: "Uptime" },
  { value: "150+", label: "Countries" },
];

const steps = [
  {
    step: "01",
    title: "Create your account",
    description: "Sign up in seconds with email, Google, or GitHub. No credit card needed.",
    icon: Users,
  },
  {
    step: "02",
    title: "Find your people",
    description: "Invite teammates, discover contacts, and build your network effortlessly.",
    icon: Search,
  },
  {
    step: "03",
    title: "Start chatting",
    description: "Send messages, share files, hop on calls — all in one beautiful interface.",
    icon: Send,
  },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Product Manager at Vercel",
    text: "NexTalk replaced three different tools for us. Real-time messaging, file sharing, and video calls — all in one place. Our team productivity jumped 40%.",
    avatar: "SC",
    color: "from-amber-400 to-orange-500",
  },
  {
    name: "Alex Rivera",
    role: "Staff Engineer at Stripe",
    text: "The encryption and privacy features are best-in-class. As engineers, we appreciate that NexTalk takes security seriously without making it complicated.",
    avatar: "AR",
    color: "from-blue-400 to-indigo-500",
  },
  {
    name: "Priya Sharma",
    role: "Design Lead at Figma",
    text: "Finally a chat app with a beautiful interface. The attention to detail is incredible — from smooth animations to thoughtful notification controls.",
    avatar: "PS",
    color: "from-emerald-400 to-teal-500",
  },
];

const faqs = [
  {
    q: "Is NexTalk free to use?",
    a: "Yes! NexTalk is completely free for individuals and small teams. We offer premium plans for larger organizations that need advanced features like admin controls, compliance tools, and priority support.",
  },
  {
    q: "How secure are my messages?",
    a: "All messages are protected with end-to-end encryption. This means only you and your intended recipients can read your messages — not even we can access them. We use the same encryption standards trusted by security professionals worldwide.",
  },
  {
    q: "Can I use NexTalk on multiple devices?",
    a: "Absolutely. NexTalk works seamlessly across web browsers, desktop apps (Windows, Mac, Linux), and mobile apps (iOS, Android). All your messages sync instantly across every device.",
  },
  {
    q: "How do I migrate from another chat platform?",
    a: "We offer one-click import tools for Slack, Discord, Teams, and other popular platforms. Your message history, files, and channel structure are preserved during migration.",
  },
  {
    q: "What happens to my data if I delete my account?",
    a: "When you delete your account, all your personal data is permanently removed from our servers within 30 days. We believe in giving you full control over your information.",
  },
];

const Home = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen bg-stone-950 text-white">
      {/* ─── Header ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-stone-950/80 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/orignal_logo.png" alt="NexTalk" className="w-9 h-9 object-contain" />
              <span className="text-xl font-bold text-white">
                Nex<span className="text-amber-400">Talk</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-stone-400 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-stone-300 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="px-5 py-2.5 text-sm font-semibold text-stone-900 bg-gradient-to-r from-amber-400 to-amber-500 rounded-lg hover:from-amber-300 hover:to-amber-400 transition-all duration-200 shadow-lg shadow-amber-500/20"
              >
                Get Started Free
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-stone-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-stone-950/95 backdrop-blur-2xl">
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-sm font-medium text-stone-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 mt-4 border-t border-white/5 grid grid-cols-2 gap-3">
                <Link
                  to="/login"
                  className="px-4 py-3 text-sm font-medium text-stone-300 border border-white/10 rounded-xl text-center hover:bg-white/5 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-3 text-sm font-semibold text-stone-900 bg-gradient-to-r from-amber-400 to-amber-500 rounded-xl text-center"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ─── Hero Section ─── */}
      <section className="relative pt-28 pb-12 sm:pt-36 sm:pb-20 overflow-hidden">
        {/* Animated background mesh */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-amber-500/8 rounded-full blur-[120px]" />
          <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] bg-amber-400/5 rounded-full blur-[80px]" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full mb-8">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-semibold text-amber-400 tracking-wide uppercase">
                Now in Public Beta
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
              The next generation{" "}
              <br className="hidden sm:block" />
              of{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400">
                team chat
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-stone-400 leading-relaxed max-w-2xl mx-auto">
              Blazing-fast, end-to-end encrypted messaging built for teams that
              move quickly and value their privacy.
            </p>

            {/* CTA */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base font-semibold text-stone-900 bg-gradient-to-r from-amber-400 to-amber-500 rounded-xl hover:from-amber-300 hover:to-amber-400 shadow-2xl shadow-amber-500/25 transition-all duration-300"
              >
                Start chatting — it's free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#features"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base font-semibold text-stone-300 border border-white/10 rounded-xl hover:bg-white/5 hover:border-white/20 transition-all duration-300"
              >
                <Play className="w-4 h-4" />
                See how it works
              </a>
            </div>

            {/* Social proof */}
            <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {[
                    { bg: "bg-gradient-to-br from-amber-400 to-orange-500", letter: "K" },
                    { bg: "bg-gradient-to-br from-blue-400 to-indigo-500", letter: "A" },
                    { bg: "bg-gradient-to-br from-emerald-400 to-teal-500", letter: "S" },
                    { bg: "bg-gradient-to-br from-rose-400 to-pink-500", letter: "R" },
                    { bg: "bg-gradient-to-br from-purple-400 to-violet-500", letter: "M" },
                  ].map((u, i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-full ${u.bg} border-2 border-stone-950 flex items-center justify-center`}
                    >
                      <span className="text-white text-[10px] font-bold">{u.letter}</span>
                    </div>
                  ))}
                </div>
                <span className="text-sm text-stone-400">
                  <span className="text-white font-semibold">10,000+</span> users
                </span>
              </div>
              <div className="hidden sm:block w-px h-5 bg-white/10" />
              <div className="flex items-center gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
                <span className="ml-1 text-sm text-stone-400">
                  <span className="text-white font-semibold">4.9</span>/5 rating
                </span>
              </div>
            </div>
          </div>

          {/* ─── Hero App Mockup ─── */}
          <div className="mt-16 sm:mt-20 max-w-5xl mx-auto">
            <div className="relative">
              {/* Glow behind the mockup */}
              <div className="absolute -inset-4 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent rounded-3xl blur-2xl" />

              <div className="relative rounded-2xl border border-white/10 bg-stone-900/80 backdrop-blur-xl shadow-2xl overflow-hidden">
                {/* Window bar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-stone-900/50">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-1 bg-white/5 rounded-lg border border-white/5">
                    <Lock className="w-3 h-3 text-green-400" />
                    <span className="text-xs text-stone-500">nextalk.app</span>
                  </div>
                  <div className="w-16" />
                </div>

                {/* App layout */}
                <div className="flex min-h-[400px] sm:min-h-[480px]">
                  {/* Sidebar */}
                  <div className="hidden sm:flex flex-col w-64 border-r border-white/5 bg-stone-900/40">
                    {/* Sidebar header */}
                    <div className="p-4 border-b border-white/5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <img src="/orignal_logo.png" alt="" className="w-6 h-6 object-contain" />
                          <span className="text-sm font-bold text-white">NexTalk</span>
                        </div>
                        <Bell className="w-4 h-4 text-stone-500" />
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg">
                        <Search className="w-3.5 h-3.5 text-stone-500" />
                        <span className="text-xs text-stone-600">Search messages...</span>
                      </div>
                    </div>
                    {/* Channel list */}
                    <div className="flex-1 p-2 space-y-0.5 overflow-hidden">
                      <p className="px-3 py-2 text-[10px] font-semibold text-stone-600 uppercase tracking-wider">Channels</p>
                      {[
                        { name: "general", unread: false, active: false },
                        { name: "design-team", unread: true, active: true },
                        { name: "engineering", unread: false, active: false },
                        { name: "random", unread: true, active: false },
                        { name: "announcements", unread: false, active: false },
                      ].map((ch) => (
                        <div
                          key={ch.name}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                            ch.active
                              ? "bg-amber-500/10 text-amber-400"
                              : "text-stone-500 hover:bg-white/5"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-stone-600">#</span>
                            {ch.name}
                          </span>
                          {ch.unread && (
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                          )}
                        </div>
                      ))}
                      <p className="px-3 py-2 mt-2 text-[10px] font-semibold text-stone-600 uppercase tracking-wider">Direct Messages</p>
                      {[
                        { name: "Sarah Chen", status: "online" },
                        { name: "Alex Rivera", status: "online" },
                        { name: "Priya Sharma", status: "away" },
                      ].map((dm) => (
                        <div
                          key={dm.name}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-stone-500 hover:bg-white/5"
                        >
                          <div className="relative">
                            <div className="w-5 h-5 rounded-full bg-stone-700 flex items-center justify-center">
                              <span className="text-[8px] text-stone-400 font-bold">{dm.name.split(" ").map(n => n[0]).join("")}</span>
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-stone-900 ${dm.status === "online" ? "bg-green-400" : "bg-amber-400"}`} />
                          </div>
                          {dm.name}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chat area */}
                  <div className="flex-1 flex flex-col">
                    {/* Chat header */}
                    <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-stone-600 font-medium">#</span>
                        <span className="text-sm font-semibold text-white">design-team</span>
                        <span className="hidden sm:inline text-xs text-stone-600 ml-2">4 members online</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md hover:bg-white/5 text-stone-500">
                          <Video className="w-4 h-4" />
                        </div>
                        <div className="p-1.5 rounded-md hover:bg-white/5 text-stone-500">
                          <Search className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4 sm:p-6 space-y-5 overflow-hidden">
                      {/* Message 1 */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shrink-0">
                          <span className="text-white text-[10px] font-bold">AR</span>
                        </div>
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-semibold text-white">Alex Rivera</span>
                            <span className="text-[10px] text-stone-600">10:24 AM</span>
                          </div>
                          <p className="mt-1 text-sm text-stone-300 leading-relaxed">
                            Hey team! The new landing page mockups are ready for review.
                          </p>
                          <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/5 max-w-xs">
                            <Image className="w-4 h-4 text-amber-400" />
                            <span className="text-xs text-stone-400">landing-v3.fig</span>
                            <span className="text-[10px] text-stone-600 ml-auto">2.4 MB</span>
                          </div>
                        </div>
                      </div>

                      {/* Message 2 */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
                          <span className="text-white text-[10px] font-bold">SC</span>
                        </div>
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-semibold text-white">Sarah Chen</span>
                            <span className="text-[10px] text-stone-600">10:26 AM</span>
                          </div>
                          <p className="mt-1 text-sm text-stone-300 leading-relaxed">
                            These look incredible! Love the hero section. Let's ship it
                          </p>
                          <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 rounded-full">
                            <span className="text-xs">🔥</span>
                            <span className="text-[10px] text-amber-400 font-medium">3</span>
                          </div>
                        </div>
                      </div>

                      {/* Message 3 */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
                          <span className="text-white text-[10px] font-bold">Y</span>
                        </div>
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-semibold text-amber-400">You</span>
                            <span className="text-[10px] text-stone-600">10:28 AM</span>
                          </div>
                          <p className="mt-1 text-sm text-stone-300 leading-relaxed">
                            Deploying to staging now. Should be live in 2 minutes!
                          </p>
                        </div>
                      </div>

                      {/* Typing indicator */}
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center shrink-0">
                          <span className="text-white text-[10px] font-bold">PS</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-stone-500 rounded-full animate-bounce [animation-delay:0ms]" />
                            <div className="w-1.5 h-1.5 bg-stone-500 rounded-full animate-bounce [animation-delay:150ms]" />
                            <div className="w-1.5 h-1.5 bg-stone-500 rounded-full animate-bounce [animation-delay:300ms]" />
                          </div>
                          <span className="text-[10px] text-stone-600">Priya is typing...</span>
                        </div>
                      </div>
                    </div>

                    {/* Message input */}
                    <div className="px-4 sm:px-6 pb-4">
                      <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/5 rounded-xl">
                        <Paperclip className="w-4 h-4 text-stone-600" />
                        <span className="flex-1 text-sm text-stone-600">Type a message...</span>
                        <div className="flex items-center gap-1.5">
                          <Image className="w-4 h-4 text-stone-600" />
                          <Send className="w-4 h-4 text-amber-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="py-12 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-stone-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features Section ─── */}
      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full mb-4">
              <span className="text-xs font-semibold text-amber-400 tracking-wide uppercase">Features</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Everything you need.{" "}
              <span className="text-stone-500">Nothing you don't.</span>
            </h2>
            <p className="mt-4 text-lg text-stone-400 max-w-xl mx-auto">
              Powerful features designed to make team communication feel effortless.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => {
              const colors = featureColors[feature.color];
              const isLarge = index === 0 || index === 3;
              return (
                <div
                  key={feature.title}
                  className={`group relative bg-stone-900/50 border border-white/5 rounded-2xl p-6 sm:p-8 hover:border-white/10 hover:bg-stone-900/80 transition-all duration-500 ${
                    isLarge ? "sm:col-span-2 lg:col-span-1" : ""
                  }`}
                >
                  {/* Hover glow */}
                  <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${colors.bg} blur-xl -z-10`} />

                  <div className={`w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center mb-5`}>
                    <feature.icon className={`w-6 h-6 ${colors.icon}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-stone-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-amber-500/[0.02] to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full mb-4">
              <span className="text-xs font-semibold text-amber-400 tracking-wide uppercase">How it works</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Up and running in{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">
                minutes
              </span>
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {steps.map((item, index) => (
                <div key={item.step} className="relative group">
                  {/* Connector */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-[calc(100%)] w-full h-px">
                      <div className="w-full h-px bg-gradient-to-r from-amber-500/30 to-transparent" />
                    </div>
                  )}

                  <div className="bg-stone-900/50 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all duration-300">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-900 font-bold text-sm shadow-lg shadow-amber-500/20">
                        {item.step}
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-stone-400" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-stone-400 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section id="testimonials" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full mb-4">
              <span className="text-xs font-semibold text-amber-400 tracking-wide uppercase">Testimonials</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Loved by{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">
                thousands
              </span>
            </h2>
            <p className="mt-4 text-lg text-stone-400">
              See why teams are switching to NexTalk.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="group bg-stone-900/50 border border-white/5 rounded-2xl p-6 sm:p-8 hover:border-white/10 transition-all duration-300"
              >
                <div className="flex items-center gap-1 mb-5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-stone-300 text-sm leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-5 border-t border-white/5">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center`}>
                    <span className="text-white text-sm font-bold">{t.avatar}</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{t.name}</p>
                    <p className="text-stone-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ Section ─── */}
      <section id="faq" className="py-20 sm:py-28 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full mb-4">
              <span className="text-xs font-semibold text-amber-400 tracking-wide uppercase">FAQ</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer"
                >
                  <span className="text-sm font-medium text-white pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-stone-500 shrink-0 transition-transform duration-300 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    openFaq === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-sm text-stone-400 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-amber-500 to-orange-500" />
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-orange-600 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            </div>
            {/* Grid overlay */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: "linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />

            <div className="relative px-8 py-16 sm:px-16 sm:py-20 text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                Ready to transform your{" "}
                <br className="hidden sm:block" />
                team communication?
              </h2>
              <p className="mt-4 text-lg text-amber-100/80 max-w-xl mx-auto">
                Join 10,000+ users already chatting on NexTalk. Free forever for small teams.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/signup"
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base font-bold text-amber-600 bg-white rounded-xl hover:bg-amber-50 shadow-2xl shadow-amber-900/30 transition-all duration-200"
                >
                  Get started for free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-all duration-200"
                >
                  Sign in to your account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/5 bg-stone-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="col-span-2">
              <Link to="/" className="flex items-center gap-2.5">
                <img src="/orignal_logo.png" alt="NexTalk" className="w-9 h-9 object-contain" />
                <span className="text-xl font-bold text-white">
                  Nex<span className="text-amber-400">Talk</span>
                </span>
              </Link>
              <p className="mt-4 text-sm text-stone-500 leading-relaxed max-w-xs">
                The next generation of team messaging. Fast, secure, and beautifully designed.
              </p>
              <div className="mt-5 flex items-center gap-2">
                <a
                  href="#"
                  className="w-9 h-9 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-stone-500 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all"
                >
                  <Github className="w-4 h-4" />
                </a>
                <a
                  href="#"
                  className="w-9 h-9 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-stone-500 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all"
                >
                  <Globe className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-3">
                {["Features", "Security", "Integrations", "Changelog"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-stone-500 hover:text-stone-300 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-3">
                {["About", "Blog", "Careers", "Contact"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-stone-500 hover:text-stone-300 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-3">
                {["Privacy", "Terms", "Cookies", "Licenses"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-stone-500 hover:text-stone-300 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-stone-600">
              &copy; {new Date().getFullYear()} NexTalk. All rights reserved.
            </p>
            <div className="flex items-center gap-1 text-sm text-stone-600">
              Built with <span className="text-amber-500 mx-1">&#9829;</span> for better communication
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

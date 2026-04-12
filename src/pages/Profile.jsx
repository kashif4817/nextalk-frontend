import { useContext } from "react";
import {
  BadgeCheck,
  CalendarDays,
  Crown,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { UserContext } from "../context/UserContext";

const formatLabel = (value) =>
  value
    ?.replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatDate = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getInitials = (name) => {
  if (!name) return "AD";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

export default function ProfilePage() {
  const { user } = useContext(UserContext);

  if (!user) {
    return (
      <div className="rounded-3xl border border-stone-200/70 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <UserRound className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-stone-900">Profile</h1>
        <p className="mt-2 text-sm text-stone-500">
          We are loading your account details from context.
        </p>
      </div>
    );
  }

  const accountFields = [
    {
      label: "Full name",
      value: user.full_name || user.name || "Not available",
      icon: UserRound,
      accent: "bg-amber-50 text-amber-600",
    },
    {
      label: "Email address",
      value: user.email || "Not available",
      icon: Mail,
      accent: "bg-blue-50 text-blue-600",
    },
    {
      label: "Phone number",
      value: user.phone || user.phone_number || "Not available",
      icon: Phone,
      accent: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Role",
      value: formatLabel(user.role) || "Administrator",
      icon: Crown,
      accent: "bg-rose-50 text-rose-600",
    },
  ];

  const extraFields = [
    {
      label: "Member since",
      value: formatDate(user.createdAt || user.created_at || user.joinedAt),
      icon: CalendarDays,
    },
    {
      label: "Location",
      value:
        user.address ||
        user.location ||
        user.city ||
        user.country ||
        "Not available",
      icon: MapPin,
    },
    {
      label: "Account status",
      value: user.status || "Active",
      icon: BadgeCheck,
    },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium uppercase tracking-wider text-amber-600">
              Account Overview
            </span>
          </div>
          <h1 className="text-2xl font-bold text-stone-800 sm:text-3xl">
            Profile
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-stone-500">
            A polished view of the admin account currently stored in your React
            context.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          <ShieldCheck className="h-3.5 w-3.5" />
          Context synced
        </div>
      </div>

      <section className="relative overflow-hidden rounded-[30px] border border-stone-200/70 bg-white shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.18),_transparent_30%)]" />

        <div className="relative grid gap-8 p-6 sm:p-8 xl:grid-cols-[1.15fr_0.85fr] xl:p-10">
          <div className="space-y-6 text-white">
            <div className="flex items-start gap-4">
              <div className="flex h-18 w-18 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 text-xl font-bold text-stone-900 shadow-lg shadow-amber-500/30">
                {getInitials(user.full_name || user.name)}
              </div>

              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-amber-300">
                  <Crown className="h-3.5 w-3.5" />
                  LUXE Admin
                </div>
                <h2 className="mt-4 text-3xl font-bold tracking-tight">
                  {user.full_name || user.name || "Admin User"}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-7 text-stone-300">
                  This profile highlights the identity and account information
                  currently available through your shared user context, keeping
                  the experience aligned with the dashboard theme.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {accountFields.map((field) => (
                <div
                  key={field.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${field.accent}`}
                    >
                      <field.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                        {field.label}
                      </p>
                      <p className="mt-1 truncate text-sm font-medium text-white">
                        {field.value}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 content-start">
            <div className="rounded-3xl border border-stone-200/70 bg-white/95 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
                Identity Summary
              </p>
              <div className="mt-4 space-y-4">
                {extraFields.map((field) => (
                  <div
                    key={field.label}
                    className="flex items-start gap-3 rounded-2xl border border-stone-200/70 bg-stone-50/80 p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-900 text-amber-400">
                      <field.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                        {field.label}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-stone-800">
                        {field.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-stone-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
                Context Data
              </p>
              <p className="mt-3 text-sm leading-7 text-stone-600">
                This page reads directly from `UserContext`, so whenever your
                context updates after login or refresh, these details will
                reflect the latest stored user information automatically.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, Banknote, Gauge, Sprout, Users, LogOut } from "lucide-react";

const NAV = [
  { href: "/admin",                   label: "Dashboard",      icon: Gauge },
  { href: "/admin/market-prices",     label: "Market prices",  icon: Banknote },
  { href: "/admin/district-capacity", label: "Capacity",       icon: Activity },
  { href: "/admin/intentions",        label: "Intentions",     icon: Users },
];

export default function AdminLayout({ children }) {
  const path = usePathname();
  const router = useRouter();
  const isLogin = path === "/admin/login";

  if (isLogin) return <div className="min-h-dvh bg-[#0d1612]">{children}</div>;

  async function signOut() {
    await fetch("/api/admin/login", { method: "DELETE" }).catch(() => {});
    router.replace("/admin/login");
  }

  return (
    <div className="min-h-dvh bg-[#0d1612] text-emerald-50/90">
      <header className="sticky top-0 z-40 bg-[#0d1612]/90 backdrop-blur-xl border-b border-white/[0.07]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between h-14">
          <Link href="/admin" className="flex items-center gap-2.5 no-underline">
            <div className="w-7 h-7 rounded-lg bg-emerald-400/15 border border-emerald-300/20 flex items-center justify-center">
              <Sprout size={14} className="text-emerald-300" />
            </div>
            <div className="leading-none">
              <span className="font-serif text-base text-white">AgriMart</span>
              <span className="ml-2 text-[10px] uppercase tracking-[0.2em] text-emerald-300/60">Ops console</span>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <nav className="flex gap-0.5 mr-2">
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = path === href;
                return (
                  <Link key={href} href={href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] transition-colors no-underline
                      ${active ? "bg-emerald-400/15 text-emerald-200 font-medium" : "text-white/45 hover:text-white/80 hover:bg-white/[0.04]"}`}>
                    <Icon size={13} />
                    <span className="hidden sm:inline">{label}</span>
                  </Link>
                );
              })}
            </nav>
            <button onClick={signOut} title="Sign out"
              className="p-2 rounded-lg text-white/35 hover:text-white/75 hover:bg-white/[0.05] transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">{children}</main>
    </div>
  );
}

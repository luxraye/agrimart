"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, Map, Sprout, ShieldAlert, UserCircle } from "lucide-react";

const TABS = [
  { href: "/",         label: "Supply",  icon: BarChart2  },
  { href: "/risk",     label: "Risk",    icon: ShieldAlert },
  { href: "/map",      label: "Map",     icon: Map        },
  { href: "/forecast", label: "My Farm", icon: Sprout     },
  { href: "/profile",  label: "Profile", icon: UserCircle },
];

export default function Nav() {
  const path = usePathname();
  if (path === "/login" || path.startsWith("/admin")) return null;

  return (
    <>
      {/* Desktop top bar */}
      <header className="hidden md:block sticky top-0 z-50 bg-paper/80 backdrop-blur-xl border-b border-ink/[0.06]">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 no-underline group">
            <div className="w-9 h-9 rounded-xl bg-brand-700 flex items-center justify-center shadow-card transition-transform group-hover:scale-105">
              <Sprout size={18} className="text-brand-100" />
            </div>
            <div className="leading-none">
              <div className="font-serif text-xl text-ink leading-tight">AgriMart</div>
              <div className="text-[10px] text-ink/40 uppercase tracking-[0.18em] mt-0.5">Botswana crop intelligence</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1 bg-white/70 border border-ink/[0.06] rounded-full p-1 shadow-card">
            {TABS.map(({ href, label }) => {
              const active = path === href;
              return (
                <Link key={href} href={href}
                  className={`px-4 py-1.5 rounded-full text-[13px] transition-all no-underline
                    ${active
                      ? "bg-brand-700 text-white font-medium shadow-sm"
                      : "text-ink/55 hover:text-ink hover:bg-ink/[0.04]"}`}>
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-50 flex items-center justify-between px-4 h-14 bg-paper/85 backdrop-blur-xl border-b border-ink/[0.06]">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-8 h-8 rounded-lg bg-brand-700 flex items-center justify-center">
            <Sprout size={15} className="text-brand-100" />
          </div>
          <span className="font-serif text-lg text-ink">AgriMart</span>
        </Link>
        <span className="text-[10px] uppercase tracking-[0.2em] text-ink/35">Botswana</span>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-ink/[0.07]
        flex items-stretch h-[68px] safe-area-bottom shadow-nav">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link key={href} href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 no-underline transition-colors relative
                ${active ? "text-brand-700" : "text-ink/35"}`}>
              {active && <span className="absolute top-0 w-8 h-0.5 rounded-full bg-brand-600" />}
              <Icon size={21} strokeWidth={active ? 2.2 : 1.7} />
              <span className={`text-[10px] leading-none ${active ? "font-semibold" : "font-medium"}`}>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="md:hidden h-[68px]" aria-hidden />
    </>
  );
}

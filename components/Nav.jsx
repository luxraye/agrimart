"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, Map, Sprout, Tractor, UserCircle } from "lucide-react";

const TABS = [
  { href: "/",        label: "Supply",   icon: BarChart2  },
  { href: "/risk",    label: "Risk",     icon: Tractor    },
  { href: "/map",     label: "Map",      icon: Map        },
  { href: "/forecast",label: "My Farm",  icon: Sprout     },
  { href: "/profile", label: "Profile",  icon: UserCircle },
];

export default function Nav() {
  const path = usePathname();
  const isLogin = path === "/login";
  if (isLogin) return null;

  return (
    <>
      {/* Top bar — desktop / wide screens */}
      <header className="hidden md:flex border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-14 w-full">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Sprout size={17} className="text-white" />
            </div>
            <div className="leading-none">
              <div className="font-serif text-lg font-normal text-gray-900 leading-tight">AgriMart</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">Botswana crop intelligence</div>
            </div>
          </Link>
          <nav className="flex gap-1">
            {TABS.map(({ href, label }) => {
              const active = path === href;
              return (
                <Link key={href} href={href}
                  className={`px-3.5 py-1.5 rounded-md text-sm transition-colors no-underline
                    ${active ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}>
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile top bar (logo only) */}
      <header className="md:hidden flex items-center justify-between px-4 h-12 bg-white border-b border-gray-100 sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <Sprout size={14} className="text-white" />
          </div>
          <span className="font-serif text-base text-gray-900">AgriMart</span>
        </Link>
        <span className="text-[10px] uppercase tracking-widest text-gray-400">Botswana</span>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100
        flex items-stretch h-16 safe-area-bottom">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link key={href} href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 no-underline transition-colors
                ${active ? "text-brand-600" : "text-gray-400"}`}>
              <Icon size={22} strokeWidth={active ? 2.2 : 1.7} />
              <span className={`text-[10px] leading-none ${active ? "font-medium" : ""}`}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile bottom padding so content doesn't sit under the tab bar */}
      <div className="md:hidden h-16" aria-hidden />
    </>
  );
}

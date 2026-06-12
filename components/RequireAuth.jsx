"use client";

import { Sprout } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/** Loading shell while the Postgres session is resolved (middleware handles redirects). */
export default function RequireAuth({ children }) {
  const { hydrated } = useAuth();

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-up">
          <div className="w-12 h-12 rounded-2xl bg-brand-700 flex items-center justify-center shadow-lift">
            <Sprout size={22} className="text-brand-100" />
          </div>
          <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

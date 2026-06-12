"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sprout, KeyRound } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Login failed");
      router.replace("/admin");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white/[0.04] border border-white/[0.08] rounded-2xl p-7 backdrop-blur animate-fade-up">
        <div className="w-11 h-11 rounded-xl bg-emerald-400/15 border border-emerald-300/20 flex items-center justify-center mb-5">
          <Sprout size={20} className="text-emerald-300" />
        </div>
        <h1 className="font-serif text-2xl text-white mb-1">Ops console</h1>
        <p className="text-xs text-white/40 mb-6">Restricted — data pipeline administration.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-[0.14em] text-white/40 font-medium mb-1.5">
              Admin secret
            </label>
            <div className="relative">
              <KeyRound size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                autoFocus
                className="w-full rounded-xl bg-white/[0.05] border border-white/10 pl-10 pr-4 py-3 text-sm text-white
                  placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={loading || !password}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
            {loading ? "Checking…" : "Enter console"}
          </button>
        </form>
      </div>
    </div>
  );
}

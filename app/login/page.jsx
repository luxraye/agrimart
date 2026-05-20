"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sprout, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { DISTRICTS } from "@/lib/data";

export default function LoginPage() {
  const router = useRouter();
  const { hydrated, isAuthenticated, login } = useAuth();

  const [name,     setName]     = useState("");
  const [district, setDistrict] = useState("central");
  const [location, setLocation] = useState("");
  const [phone,    setPhone]    = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (hydrated && isAuthenticated) router.replace("/");
  }, [hydrated, isAuthenticated, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Please enter your name."); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    login(name, district, location, phone);
    router.replace("/");
  }

  if (!hydrated) return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-dvh flex flex-col bg-gray-50">
      {/* Brand strip */}
      <div className="bg-brand-600 px-6 pt-12 pb-10 text-white">
        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
          <Sprout size={26} className="text-white" />
        </div>
        <h1 className="font-serif text-3xl font-normal mb-1">AgriMart</h1>
        <p className="text-brand-100 text-sm leading-relaxed max-w-xs">
          Pre-season crop intelligence for Botswana horticulture farmers, buyers, and cooperatives.
        </p>
      </div>

      {/* Form card */}
      <div className="flex-1 px-4 -mt-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-md mx-auto">
          <h2 className="text-base font-medium text-gray-800 mb-1">Create your profile</h2>
          <p className="text-xs text-gray-400 mb-5">Your info is saved on this device — no password needed.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Your name *
              </label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Keabetswe Mokoena"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800
                  focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Your district
              </label>
              <select
                value={district} onChange={e => setDistrict(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800
                  focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
              >
                {DISTRICTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Farm / village name <span className="normal-case text-gray-400">(optional)</span>
              </label>
              <input
                type="text" value={location} onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Mochudi North plot"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800
                  focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Phone number <span className="normal-case text-gray-400">(optional)</span>
              </label>
              <input
                type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+267 7X XXX XXXX"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800
                  focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-600 hover:bg-brand-800
                text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-60 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>Get started <ChevronRight size={16} /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5 pb-8">
          Your data is stored locally on this device only.
        </p>
      </div>
    </div>
  );
}

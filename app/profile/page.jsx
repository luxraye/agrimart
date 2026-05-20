"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Save, ChevronRight, Info, Sprout } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { DISTRICTS } from "@/lib/data";
import RequireAuth from "@/components/RequireAuth";

function ProfileContent() {
  const router = useRouter();
  const { profile, updateProfile, logout } = useAuth();

  const [name,     setName]     = useState(profile.displayName);
  const [district, setDistrict] = useState(profile.district);
  const [location, setLocation] = useState(profile.location);
  const [phone,    setPhone]    = useState(profile.phone || "");
  const [saved,    setSaved]    = useState(false);

  // Hidden roadmap tap counter
  const [tapCount, setTapCount] = useState(0);

  function handleSave(e) {
    e.preventDefault();
    updateProfile({ displayName: name, district, location, phone });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  function handleLogoTap() {
    setTapCount(n => {
      const next = n + 1;
      if (next >= 5) {
        router.push("/about");
        return 0;
      }
      return next;
    });
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-6 pb-8">
      {/* Avatar section */}
      <div className="flex flex-col items-center py-6 mb-4">
        <button onClick={handleLogoTap}
          className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center mb-3 active:scale-95 transition-transform">
          <Sprout size={30} className="text-white" />
        </button>
        <h1 className="font-serif text-xl text-gray-900">{profile.displayName || "Farmer"}</h1>
        <p className="text-sm text-gray-400">
          {DISTRICTS.find(d => d.value === profile.district)?.label || profile.district}
          {profile.location ? ` · ${profile.location}` : ""}
        </p>
        {tapCount > 1 && tapCount < 5 && (
          <p className="text-xs text-gray-300 mt-1">{5 - tapCount} more taps…</p>
        )}
      </div>

      {/* Edit form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Edit profile</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">District</label>
            <select value={district} onChange={e => setDistrict(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400">
              {DISTRICTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Farm / village</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <button type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 hover:bg-brand-800 text-white text-sm font-medium rounded-xl transition-colors">
            <Save size={14} />
            {saved ? "Saved!" : "Save changes"}
          </button>
        </form>
      </div>

      {/* App info */}
      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 mb-4">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Info size={16} className="text-gray-400" />
            App version
          </div>
          <span className="text-sm text-gray-400">v0.3.0</span>
        </div>
        <button onClick={() => router.push("/about")}
          className="w-full flex items-center justify-between px-5 py-4 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <span>About AgriMart</span>
          <ChevronRight size={16} className="text-gray-300" />
        </button>
      </div>

      {/* Sign out */}
      <button onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3.5 border border-red-200 text-red-600 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors">
        <LogOut size={15} />
        Sign out
      </button>

      <p className="text-center text-xs text-gray-300 mt-5">
        Data stored locally on this device.
      </p>
    </main>
  );
}

export default function ProfilePage() {
  return <RequireAuth><ProfileContent /></RequireAuth>;
}

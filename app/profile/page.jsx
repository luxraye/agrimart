"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Save, ChevronRight, Info, Sprout, MessageCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { DISTRICTS } from "@/lib/data";
import RequireAuth from "@/components/RequireAuth";

function WhatsAppCard() {
  const [status, setStatus] = useState(null);
  const [code, setCode] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadStatus() {
    try {
      const res = await fetch("/api/whatsapp/link-code", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) setStatus(json);
    } catch {
      // leave status null; card shows nothing actionable
    }
  }

  useEffect(() => { loadStatus(); }, []);

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/whatsapp/link-code", { method: "POST" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Could not generate a code");
      setCode(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const waNumber = code?.waNumber || status?.waNumber;

  return (
    <div className="card p-5 mb-4">
      <div className="flex items-center gap-2.5 mb-3">
        <MessageCircle size={16} className="text-brand-700" />
        <h2 className="text-sm font-semibold text-ink/80">Connect WhatsApp</h2>
      </div>

      {status?.linked ? (
        <div className="flex items-center gap-2 text-sm text-brand-800 bg-brand-50 rounded-lg px-3 py-2.5">
          <CheckCircle2 size={16} className="text-brand-700" />
          WhatsApp linked — message MENU to check supply and risk.
        </div>
      ) : (
        <>
          <p className="text-[13px] text-ink/50 leading-relaxed mb-3">
            Link your WhatsApp to check supply signals and crop risk from your phone.
            {status && !status.hasPhone && " Add a phone number above and save first."}
          </p>

          {code ? (
            <div className="bg-paper rounded-lg px-4 py-3.5 text-center">
              <p className="text-[11px] uppercase tracking-wide text-ink/40 mb-1">Your link code</p>
              <p className="font-serif text-3xl tracking-[0.3em] text-ink mb-2">{code.code}</p>
              <p className="text-[13px] text-ink/55 leading-relaxed">
                Send <span className="font-semibold text-ink">LINK {code.code}</span>
                {waNumber ? <> to <span className="font-semibold text-ink">{waNumber}</span></> : " to the AgriMart WhatsApp number"} within 15 minutes.
              </p>
            </div>
          ) : (
            <button
              onClick={generate}
              disabled={busy || (status && !status.hasPhone)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-brand-700 hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-card">
              <MessageCircle size={14} />
              {busy ? "Generating…" : "Generate link code"}
            </button>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-3">{error}</p>
          )}
        </>
      )}
    </div>
  );
}

function ProfileContent() {
  const router = useRouter();
  const { profile, updateProfile, logout } = useAuth();

  const [name,     setName]     = useState(profile.displayName);
  const [district, setDistrict] = useState(profile.district);
  const [location, setLocation] = useState(profile.farmName || profile.location || "");
  const [phone,    setPhone]    = useState(profile.phone || "");
  const [saved,    setSaved]    = useState(false);
  const [saveError,setSaveError]= useState("");

  // Hidden roadmap: tap the logo 5×
  const [tapCount, setTapCount] = useState(0);

  async function handleSave(e) {
    e.preventDefault();
    setSaveError("");
    try {
      await updateProfile({ displayName: name, district, farmName: location, phone });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err.message);
    }
  }

  async function handleLogout() {
    await logout();
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
    <main className="max-w-lg mx-auto px-4 py-6 pb-10">
      <div className="flex flex-col items-center py-7 mb-4 animate-fade-up">
        <button onClick={handleLogoTap}
          className="w-[68px] h-[68px] rounded-2xl bg-brand-700 flex items-center justify-center mb-3.5 active:scale-95 transition-transform shadow-lift">
          <Sprout size={30} className="text-brand-100" />
        </button>
        <h1 className="font-serif text-2xl text-ink">{profile.displayName || "Farmer"}</h1>
        <p className="text-[13px] text-ink/40 mt-0.5">
          {DISTRICTS.find(d => d.value === profile.district)?.label || profile.district}
          {(profile.farmName || profile.location) ? ` · ${profile.farmName || profile.location}` : ""}
        </p>
        {profile.email && (
          <p className="text-[12px] text-ink/30 mt-1">{profile.email}</p>
        )}
        {tapCount > 1 && tapCount < 5 && (
          <p className="text-xs text-ink/25 mt-1.5">{5 - tapCount} more taps…</p>
        )}
      </div>

      <div className="card p-5 mb-4">
        <h2 className="text-sm font-semibold text-ink/80 mb-4">Edit profile</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="field-label block mb-1.5">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="field-input" />
          </div>
          <div>
            <label className="field-label block mb-1.5">District</label>
            <select value={district} onChange={e => setDistrict(e.target.value)} className="field-input cursor-pointer">
              {DISTRICTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label block mb-1.5">Farm / village</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="field-input" />
          </div>
          <div>
            <label className="field-label block mb-1.5">Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="field-input" />
          </div>
          {saveError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{saveError}</p>
          )}
          <button type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold rounded-xl transition-all shadow-card">
            <Save size={14} />
            {saved ? "Saved to database!" : "Save changes"}
          </button>
        </form>
      </div>

      <WhatsAppCard />

      <div className="card divide-y divide-ink/[0.05] mb-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3 text-sm text-ink/60">
            <Info size={16} className="text-ink/30" />
            App version
          </div>
          <span className="text-sm text-ink/35">v4.0.0 · live pipeline</span>
        </div>
        <button onClick={() => router.push("/about")}
          className="w-full flex items-center justify-between px-5 py-4 text-sm text-ink/60 hover:bg-paper transition-colors">
          <span>About AgriMart</span>
          <ChevronRight size={16} className="text-ink/25" />
        </button>
      </div>

      <button onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3.5 border border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 transition-colors">
        <LogOut size={15} />
        Sign out
      </button>

      <p className="text-center text-xs text-ink/25 mt-5">
        Profile synced to PostgreSQL via Supabase.
      </p>
    </main>
  );
}

export default function ProfilePage() {
  return <RequireAuth><ProfileContent /></RequireAuth>;
}

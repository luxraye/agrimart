"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sprout, ArrowRight, CloudSun, Satellite, Users,
  Mail, Lock, User, MapPin, Phone, CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { DISTRICTS } from "@/lib/data";

const PILLARS = [
  { icon: CloudSun,  title: "Live weather",  desc: "Open-Meteo soil moisture & 14-day forecast per district" },
  { icon: Satellite, title: "Satellite NDVI", desc: "MODIS vegetation vigour with ET-based proxy fallback" },
  { icon: Users,     title: "Farmer network", desc: "Real declarations power district supply signals" },
];

export default function LoginPage() {
  const router = useRouter();
  const { hydrated, login, signup } = useAuth();

  const [mode, setMode] = useState("signin"); // signin | signup
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [name,     setName]     = useState("");
  const [district, setDistrict] = useState("central");
  const [farmName, setFarmName] = useState("");
  const [phone,    setPhone]    = useState("");
  const [error,    setError]    = useState("");
  const [info,     setInfo]     = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      if (mode === "signin") {
        await login(email, password);
        router.replace("/");
      } else {
        const result = await signup({
          email, password,
          displayName: name,
          district, farmName, phone,
        });
        if (result.needsConfirmation) {
          setInfo("Check your email to confirm your account, then sign in.");
          setMode("signin");
        } else {
          router.replace("/");
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!hydrated) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#0a1410]">
        <div className="w-9 h-9 border-2 border-emerald-800 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row bg-[#0a1410]">
      {/* ── Hero panel ─────────────────────────────────────────────────── */}
      <div className="relative lg:w-[52%] min-h-[38vh] lg:min-h-dvh overflow-hidden flex flex-col justify-between p-8 lg:p-14">
        {/* Atmospheric layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f2419] via-[#0a1410] to-[#14100a]" />
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 80% 60% at 70% 10%, rgba(53,136,92,0.35) 0%, transparent 60%),
              radial-gradient(ellipse 50% 40% at 10% 90%, rgba(223,174,79,0.12) 0%, transparent 55%)
            `,
          }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2.5 mb-10">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/25 flex items-center justify-center backdrop-blur-sm">
              <Sprout size={20} className="text-emerald-300" />
            </div>
            <div>
              <p className="font-serif text-xl text-white leading-none">AgriMart</p>
              <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-300/50 mt-0.5">Botswana · v4</p>
            </div>
          </div>

          <h1 className="font-serif text-[2.6rem] lg:text-[3.2rem] leading-[1.08] text-white mb-5 max-w-md">
            Crop intelligence,<br />
            <span className="text-emerald-300">before the season.</span>
          </h1>
          <p className="text-[15px] text-white/50 leading-relaxed max-w-sm mb-10">
            Live supply signals, risk monitoring, and farm viability — backed by PostgreSQL,
            Open-Meteo, FAOSTAT, and real farmer declarations.
          </p>
        </div>

        <div className="relative z-10 space-y-4 hidden lg:block">
          {PILLARS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4 group">
              <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/15 group-hover:border-emerald-400/20 transition-colors">
                <Icon size={16} className="text-emerald-300/80" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white/80">{title}</p>
                <p className="text-[12px] text-white/35 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Auth panel ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-5 py-10 lg:py-14 bg-[#f6f5f1] lg:rounded-tl-[2rem] lg:-ml-6 relative z-10">
        <div className="w-full max-w-[420px] animate-fade-up">
          {/* Mode tabs */}
          <div className="flex p-1 bg-ink/[0.05] rounded-xl mb-7">
            {[
              { id: "signin", label: "Sign in" },
              { id: "signup", label: "Create account" },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => { setMode(id); setError(""); setInfo(""); }}
                className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition-all
                  ${mode === id
                    ? "bg-white text-ink shadow-sm"
                    : "text-ink/40 hover:text-ink/65"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <h2 className="font-serif text-[1.75rem] text-ink mb-1">
              {mode === "signin" ? "Welcome back" : "Join the network"}
            </h2>
            <p className="text-[13px] text-ink/45">
              {mode === "signin"
                ? "Sign in with your email — profile and farm settings sync from the database."
                : "Create your farmer account. Your profile is stored securely in PostgreSQL."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "signup" && (
              <>
                <Field icon={User} label="Your name" required>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Keabetswe Mokoena" className="auth-input" required />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field icon={MapPin} label="District">
                    <select value={district} onChange={(e) => setDistrict(e.target.value)} className="auth-input">
                      {DISTRICTS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </Field>
                  <Field icon={Phone} label="Phone (optional)">
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                      placeholder="+267 7X XXX" className="auth-input" />
                  </Field>
                </div>
                <Field icon={MapPin} label="Farm / village (optional)">
                  <input type="text" value={farmName} onChange={(e) => setFarmName(e.target.value)}
                    placeholder="Mochudi North plot" className="auth-input" />
                </Field>
              </>
            )}

            <Field icon={Mail} label="Email address" required>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" className="auth-input" required autoComplete="email" />
            </Field>

            <Field icon={Lock} label="Password" required>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "Min 8 characters" : "••••••••"}
                className="auth-input" required minLength={8} autoComplete={mode === "signin" ? "current-password" : "new-password"} />
            </Field>

            {error && (
              <p className="text-[13px] text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
            )}
            {info && (
              <p className="text-[13px] text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-start gap-2">
                <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0" />{info}
              </p>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 mt-1
                bg-ink hover:bg-ink/90 text-white text-[14px] font-semibold rounded-xl
                transition-all disabled:opacity-50 shadow-[0_4px_20px_rgba(22,36,28,0.25)]">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === "signin" ? "Sign in" : "Create account"}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[11px] text-ink/30 mt-6 leading-relaxed">
            Secured by Supabase Auth · PostgreSQL · encrypted sessions
          </p>
        </div>
      </div>

    </div>
  );
}

function Field({ icon: Icon, label, required, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-ink/40 font-medium mb-1.5">
        <Icon size={11} className="text-ink/30" />
        {label}{required && <span className="text-brand-600">*</span>}
      </label>
      {children}
    </div>
  );
}

"use client";

import {
  createContext, useCallback, useContext,
  useEffect, useMemo, useState,
} from "react";

const KEY_SESSION = "agrimart_session_v2";
const KEY_PROFILE = "agrimart_profile_v2";
const KEY_FARM    = "agrimart_farm_v2";

const defaultProfile = () => ({
  displayName: "",
  farmName: "",
  district: "central",
  location: "",
  phone: "",
});

const defaultFarm = () => ({
  crop: "tomato",
  hectares: "2",
  waterSource: "borehole",
  investment: "medium",
  labor: "family",
  soilHealth: "average",
  marketTarget: "local",
});

function read(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function write(key, val) {
  try { localStorage.setItem(key, val); } catch {}
}
function remove(key) {
  try { localStorage.removeItem(key); } catch {}
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session,   setSession]   = useState(null);
  const [profile,   setProfile]   = useState(defaultProfile);
  const [farm,      setFarmState] = useState(defaultFarm);
  const [hydrated,  setHydrated]  = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const s = read(KEY_SESSION);
    const rawP = read(KEY_PROFILE);
    const rawF = read(KEY_FARM);
    if (s) setSession(s);
    if (rawP) {
      try { setProfile({ ...defaultProfile(), ...JSON.parse(rawP) }); } catch {}
    }
    if (rawF) {
      try { setFarmState({ ...defaultFarm(), ...JSON.parse(rawF) }); } catch {}
    }
    setHydrated(true);
  }, []);

  const login = useCallback((name, districtVal, locationVal, phone) => {
    const prof = {
      displayName: String(name || "Farmer").trim(),
      farmName:    "",
      district:    districtVal || "central",
      location:    String(locationVal || "").trim(),
      phone:       String(phone || "").trim(),
    };
    const token = `am_${Date.now()}`;
    setSession(token);
    setProfile(prof);
    write(KEY_SESSION, token);
    write(KEY_PROFILE, JSON.stringify(prof));
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    setProfile(defaultProfile());
    setFarmState(defaultFarm());
    remove(KEY_SESSION);
    remove(KEY_PROFILE);
    remove(KEY_FARM);
  }, []);

  const updateProfile = useCallback((partial) => {
    setProfile((prev) => {
      const next = { ...prev, ...partial };
      write(KEY_PROFILE, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateFarm = useCallback((partial) => {
    setFarmState((prev) => {
      const next = { ...prev, ...partial };
      write(KEY_FARM, JSON.stringify(next));
      return next;
    });
  }, []);

  const syncLocation = useCallback(async () => {
    setIsSyncing(true);
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
    setIsSyncing(false);
  }, []);

  const value = useMemo(() => ({
    hydrated,
    isAuthenticated: !!session,
    profile,
    farm,
    isSyncing,
    login,
    logout,
    updateProfile,
    updateFarm,
    syncLocation,
  }), [hydrated, session, profile, farm, isSyncing, login, logout, updateProfile, updateFarm, syncLocation]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

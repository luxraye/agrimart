"use client";

import {
  createContext, useCallback, useContext,
  useEffect, useMemo, useState,
} from "react";

const defaultProfile = () => ({
  id: null,
  displayName: "",
  farmName: "",
  district: "central",
  location: "",
  phone: "",
  email: "",
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

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,     setUser]     = useState(null);
  const [profile,  setProfile]  = useState(defaultProfile);
  const [farm,     setFarm]     = useState(defaultFarm);
  const [hydrated, setHydrated] = useState(false);

  const loadSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      const json = await res.json();
      if (json.ok && json.authenticated) {
        setUser(json.user);
        setProfile(json.profile ?? defaultProfile());
        setFarm(json.farm ?? defaultFarm());
      } else {
        setUser(null);
        setProfile(defaultProfile());
        setFarm(defaultFarm());
      }
    } catch {
      setUser(null);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const signup = useCallback(async ({ email, password, displayName, district, farmName, phone }) => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName, district, farmName, phone }),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || "Signup failed");
    if (json.needsConfirmation) {
      return { ok: true, needsConfirmation: true };
    }
    await loadSession();
    return { ok: true };
  }, [loadSession]);

  const login = useCallback(async (email, password) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || "Login failed");
    setUser(json.user);
    setProfile(json.profile ?? defaultProfile());
    setFarm(json.farm ?? defaultFarm());
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setProfile(defaultProfile());
    setFarm(defaultFarm());
  }, []);

  const updateProfile = useCallback(async (partial) => {
    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || "Could not save profile");
    setProfile(json.profile);
    return json.profile;
  }, []);

  const updateFarm = useCallback(async (partial) => {
    const res = await fetch("/api/auth/farm", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || "Could not save farm settings");
    setFarm(json.farm);
    return json.farm;
  }, []);

  const value = useMemo(() => ({
    hydrated,
    isAuthenticated: !!user,
    user,
    profile,
    farm,
    signup,
    login,
    logout,
    updateProfile,
    updateFarm,
    refreshSession: loadSession,
  }), [hydrated, user, profile, farm, signup, login, logout, updateProfile, updateFarm, loadSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

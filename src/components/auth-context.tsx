"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import {
  loginWithEmail,
  logout as fbLogout,
  registerCustomer,
  subscribeAuth,
  type UserProfile,
  type UserRole,
} from "@/lib/firebase/auth";
import { isFirebaseConfigured } from "@/lib/firebase";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  ready: boolean;
  usingFirebase: boolean;
  isAdmin: boolean;
  isRider: boolean;
  isCustomer: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (input: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<UserProfile>;
  logout: () => Promise<void>;
  requireRole: (role: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);
  const usingFirebase = isFirebaseConfigured();

  useEffect(() => {
    if (!usingFirebase) {
      setReady(true);
      return;
    }
    const unsub = subscribeAuth((u, p) => {
      setUser(u);
      setProfile(p);
      setReady(true);
    });
    return unsub;
  }, [usingFirebase]);

  const login = useCallback(async (email: string, password: string) => {
    const p = await loginWithEmail(email, password);
    setProfile(p);
    return p;
  }, []);

  const register = useCallback(
    async (input: {
      name: string;
      email: string;
      phone: string;
      password: string;
    }) => {
      const p = await registerCustomer(input);
      setProfile(p);
      return p;
    },
    [],
  );

  const logout = useCallback(async () => {
    await fbLogout();
    setUser(null);
    setProfile(null);
  }, []);

  const requireRole = useCallback(
    (role: UserRole | UserRole[]) => {
      if (!profile) return false;
      const roles = Array.isArray(role) ? role : [role];
      return roles.includes(profile.role);
    },
    [profile],
  );

  const value = useMemo(
    () => ({
      user,
      profile,
      ready,
      usingFirebase,
      isAdmin: profile?.role === "admin",
      isRider: profile?.role === "rider",
      isCustomer: profile?.role === "customer",
      login,
      register,
      logout,
      requireRole,
    }),
    [
      user,
      profile,
      ready,
      usingFirebase,
      login,
      register,
      logout,
      requireRole,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

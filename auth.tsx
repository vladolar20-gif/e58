import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { RANK_LEVELS, type StaffProfile, type StaffRank } from './types';

interface AuthContextValue {
  session: Session | null;
  profile: StaffProfile | null;
  loading: boolean;
  banned: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, meta?: { roblox_name?: string; roblox_id?: string; discord_name?: string; discord_id?: string }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string) => {
    const { data } = await supabase
      .from('staff_profiles')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();
    setProfile(data as StaffProfile | null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        loadProfile(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        loadProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (session) await loadProfile(session.user.id);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message === 'Invalid login credentials') {
        return { error: 'Email sau parola incorecta. Verifica si incearca din nou.' };
      }
      return { error: error.message };
    }
    return { error: null };
  };

  const signUp = async (email: string, password: string, meta?: { roblox_name?: string; roblox_id?: string; discord_name?: string; discord_id?: string }) => {
    const { error } = await supabase.auth.signUp({ email, password, options: { data: meta } });
    if (error) {
      if (error.message.includes('already')) {
        return { error: 'Acest email este deja folosit.' };
      }
      return { error: 'Nu am putut crea contul. Verifica datele si incearca din nou.' };
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  };

  const banned = false;


  return (
    <AuthContext.Provider
      value={{ session, profile, loading, banned, signIn, signUp, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function hasRank(profile: StaffProfile | null, required: StaffRank): boolean {
  if (!profile) return false;
  return RANK_LEVELS[profile.rank] >= RANK_LEVELS[required];
}

export function isManager(profile: StaffProfile | null): boolean {
  return hasRank(profile, 'manager_staff');
}

export function isSupervisorOrAbove(profile: StaffProfile | null): boolean {
  return hasRank(profile, 'supervisor');
}

export function canViewLogs(profile: StaffProfile | null): boolean {
  return hasRank(profile, 'supervisor');
}

export function canManageRanks(profile: StaffProfile | null): boolean {
  return hasRank(profile, 'manager staff');
}

export function canViewAllShifts(profile: StaffProfile | null): boolean {
  return hasRank(profile, 'manager_staff');
}

export function canManageAccounts(profile: StaffProfile | null): boolean {
  return hasRank(profile, 'high_staff_council');
}

export function canModifyRank(
  profile: StaffProfile | null,
  targetRank: StaffRank,
): boolean {
  if (!profile) return false;
  if (RANK_LEVELS[profile.rank] < RANK_LEVELS['manager_staff']) return false;
  return RANK_LEVELS[targetRank] < RANK_LEVELS[profile.rank];
}

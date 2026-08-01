import React, { createContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { setDemoMode } from '../lib/demoMode';
import { getCurrentApartmentId } from '../lib/auth';

// Demo mode has no Supabase session to persist, so it needs its own flag —
// without this, closing the app would drop back to the login screen every
// time even though real accounts stay signed in via Supabase's own
// AsyncStorage-backed session persistence.
const DEMO_MODE_STORAGE_KEY = 'parking-roommates:demo-mode';

// ---------------------------------------------------------------------------
// Hebrew error mapping — keeps all Supabase error strings out of UI components
// ---------------------------------------------------------------------------

function toHebrewError(error: AuthError | null): string | null {
  if (!error) return null;
  const msg = error.message.toLowerCase();

  if (
    msg.includes('invalid login credentials') ||
    msg.includes('invalid credentials') ||
    msg.includes('email not confirmed')
  ) {
    return 'אימייל או סיסמה שגויים';
  }
  if (msg.includes('user already registered') || msg.includes('already registered')) {
    return 'המשתמש כבר קיים. נסה להתחבר.';
  }
  if (msg.includes('password should be at least')) {
    return 'הסיסמה חייבת להכיל לפחות 6 תווים';
  }
  if (msg.includes('unable to validate email address') || msg.includes('invalid email')) {
    return 'כתובת האימייל אינה תקינה';
  }
  if (msg.includes('signup is disabled')) {
    return 'ההרשמה מושבתת כרגע';
  }
  if (msg.includes('rate limit') || msg.includes('too many')) {
    return 'יותר מדי ניסיונות, נסה שוב מאוחר יותר';
  }
  return 'אירעה שגיאה, נסה שוב';
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SignInResult = { hebrewError: string | null };
export type SignUpResult = { hebrewError: string | null; needsConfirmation: boolean };

export type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  /** True when the user chose "demo mode" — no real Supabase session exists */
  isDemoUser: boolean;
  /** The signed-in user's apartment id, or null if they haven't created/joined one yet. */
  apartmentId: string | null;
  /** True while apartmentId is being (re)resolved after a session or demo-mode change. */
  apartmentLoading: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    inviteCode?: string,
  ) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  demoSignIn: () => void;
  /** Re-checks apartment membership — call after creating/joining an apartment. */
  refreshApartmentId: () => Promise<void>;
};

// ---------------------------------------------------------------------------
// Context + Provider
// ---------------------------------------------------------------------------

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [apartmentId, setApartmentId] = useState<string | null>(null);
  const [apartmentLoading, setApartmentLoading] = useState(false);

  // Listen to real Supabase auth state. Fires immediately with the cached
  // session from AsyncStorage so loading is resolved on first emission.
  // Also restores demo mode from its own AsyncStorage flag, since it has no
  // real Supabase session to persist it for us.
  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(DEMO_MODE_STORAGE_KEY).then((stored) => {
      if (mounted && stored === 'true') {
        setDemoMode(true);
        setIsDemoUser(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshApartmentId = useCallback(async () => {
    if (!session && !isDemoUser) {
      setApartmentId(null);
      return;
    }
    setApartmentLoading(true);
    const id = await getCurrentApartmentId();
    setApartmentId(id);
    setApartmentLoading(false);
  }, [session, isDemoUser]);

  // Re-check apartment membership whenever the signed-in identity changes.
  useEffect(() => {
    refreshApartmentId();
  }, [refreshApartmentId]);

  async function signIn(email: string, password: string): Promise<SignInResult> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { hebrewError: toHebrewError(error) };
  }

  async function signUp(
    email: string,
    password: string,
    fullName: string,
    inviteCode?: string,
  ): Promise<SignUpResult> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          ...(inviteCode ? { invite_code: inviteCode } : {}),
        },
      },
    });
    return {
      hebrewError: toHebrewError(error),
      // needsConfirmation = sign-up succeeded but email verification is required
      needsConfirmation: !error && !data.session,
    };
  }

  async function signOut(): Promise<void> {
    if (isDemoUser) {
      // Demo mode has no real Supabase session — just clear the flag
      setDemoMode(false);
      setIsDemoUser(false);
      await AsyncStorage.removeItem(DEMO_MODE_STORAGE_KEY);
      return;
    }
    await supabase.auth.signOut();
  }

  function demoSignIn(): void {
    setDemoMode(true);
    setIsDemoUser(true);
    AsyncStorage.setItem(DEMO_MODE_STORAGE_KEY, 'true');
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        isDemoUser,
        apartmentId,
        apartmentLoading,
        signIn,
        signUp,
        signOut,
        demoSignIn,
        refreshApartmentId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

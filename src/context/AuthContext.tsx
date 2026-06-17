import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

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
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (email: string, password: string, fullName: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  demoSignIn: () => void;
};

// ---------------------------------------------------------------------------
// Context + Provider
// ---------------------------------------------------------------------------

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState(false);

  // Listen to real Supabase auth state. Fires immediately with the cached
  // session from AsyncStorage so loading is resolved on first emission.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string): Promise<SignInResult> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { hebrewError: toHebrewError(error) };
  }

  async function signUp(
    email: string,
    password: string,
    fullName: string,
  ): Promise<SignUpResult> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
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
      setIsDemoUser(false);
      return;
    }
    await supabase.auth.signOut();
  }

  function demoSignIn(): void {
    setIsDemoUser(true);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        isDemoUser,
        signIn,
        signUp,
        signOut,
        demoSignIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

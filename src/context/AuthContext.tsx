import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type SignInResult = { error: AuthError | null };
type SignUpResult = { error: AuthError | null; needsConfirmation: boolean };

export type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (email: string, password: string, fullName: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  demoSignIn: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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
    return { error };
  }

  async function signUp(
    email: string,
    password: string,
    fullName: string
  ): Promise<SignUpResult> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return { error, needsConfirmation: !error && !data.session };
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut();
    setSession(null);
  }

  async function demoSignIn(): Promise<void> {
    const demoUser = {
      id: 'demo-user',
      email: 'bendben13@gmail.com',
      app_metadata: {},
      user_metadata: { full_name: 'בן דוד' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as User;

    const demoSession = {
      access_token: 'demo-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'demo-refresh',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      provider_token: null,
      provider_refresh_token: null,
      user: demoUser,
    } as Session;

    setSession(demoSession);
    setLoading(false);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
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

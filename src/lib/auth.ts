/**
 * Why this file exists:
 * Every service needs the current user's ID before writing data.
 * Centralising the session read here means one place to change if the auth
 * strategy ever changes (e.g. switching from getSession to getUser).
 */

import { supabase } from './supabase';
import { isDemoMode, DEMO_USER_ID } from './demoMode';

/**
 * Reads the current user ID from the locally cached session.
 * Does NOT make a network call — AsyncStorage is read synchronously via the
 * supabase-js storage adapter.
 * Returns null when no session exists (user is signed out).
 * In demo mode there is no real Supabase session, so the fixed demo user ID
 * is returned instead of reading from Supabase.
 */
export async function getCurrentUserId(): Promise<string | null> {
  if (isDemoMode()) return DEMO_USER_ID;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user.id ?? null;
}

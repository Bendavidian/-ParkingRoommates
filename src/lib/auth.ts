/**
 * Why this file exists:
 * Every service needs the current user's ID before writing data.
 * Centralising the session read here means one place to change if the auth
 * strategy ever changes (e.g. switching from getSession to getUser).
 */

import { supabase } from './supabase';

/**
 * Reads the current user ID from the locally cached session.
 * Does NOT make a network call — AsyncStorage is read synchronously via the
 * supabase-js storage adapter.
 * Returns null when no session exists (user is signed out).
 */
export async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user.id ?? null;
}

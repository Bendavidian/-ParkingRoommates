/**
 * Why this file exists:
 * Every service needs the current user's ID before writing data.
 * Centralising the session read here means one place to change if the auth
 * strategy ever changes (e.g. switching from getSession to getUser).
 */

import { supabase } from './supabase';
import { isDemoMode, DEMO_USER_ID } from './demoMode';
import { MOCK_APARTMENT_ID } from '../repositories/mock/mockData';

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

/**
 * Reads the current user's apartment_id — every write (session, queue,
 * request, notification) needs this to tag the row with the right
 * household. Returns null if signed out or if the user hasn't created/
 * joined an apartment yet (RootNavigator gates on that before showing
 * MainNavigator, so services should rarely see null here in practice).
 */
export async function getCurrentApartmentId(): Promise<string | null> {
  if (isDemoMode()) return MOCK_APARTMENT_ID;

  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('apartment_id')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data.apartment_id;
}

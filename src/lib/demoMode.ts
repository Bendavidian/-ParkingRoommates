/**
 * Why this file exists:
 * Demo mode (AuthContext.demoSignIn) has no real Supabase session, but
 * services are plain modules outside React that need to know, per call,
 * whether to talk to Supabase or to the in-memory mock repositories.
 * This is the shared flag both sides read/write.
 */

export const DEMO_USER_ID = 'demo-user';

let demoModeActive = false;

export function setDemoMode(active: boolean): void {
  demoModeActive = active;
}

export function isDemoMode(): boolean {
  return demoModeActive;
}

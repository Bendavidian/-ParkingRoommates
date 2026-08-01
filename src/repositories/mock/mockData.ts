/**
 * Why this file exists:
 * In-memory seed data + mutable stores backing the Mock*Repository files.
 * Lets the app run a full demo session (park / finish / queue) with no
 * Supabase connection at all.
 */

import { DEMO_USER_ID } from '../../lib/demoMode';
import type { Profile, ParkingSession, ParkingQueueItem } from '../../types/database';

export const DANI_ID = 'demo-roommate-dani';
export const URI_ID = 'demo-roommate-uri';

const EPOCH = new Date(0).toISOString();

export const mockProfiles: Record<string, Profile> = {
  [DEMO_USER_ID]: { id: DEMO_USER_ID, full_name: 'משתמש הדגמה', email: 'demo@example.com', created_at: EPOCH },
  [DANI_ID]: { id: DANI_ID, full_name: 'דני', email: 'dani@example.com', created_at: EPOCH },
  [URI_ID]: { id: URI_ID, full_name: 'אורי', email: 'uri@example.com', created_at: EPOCH },
};

export const mockSessions: ParkingSession[] = [];

export const mockQueue: ParkingQueueItem[] = [
  { id: 'demo-queue-1', user_id: URI_ID, joined_at: EPOCH, status: 'waiting' },
];

let idCounter = 0;

/** Generates a readable unique ID for new mock rows (sessions, queue items, ...). */
export function nextMockId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

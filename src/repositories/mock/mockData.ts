/**
 * Why this file exists:
 * In-memory seed data + mutable stores backing the Mock*Repository files.
 * Lets the app run a full demo session (park / finish / queue) with no
 * Supabase connection at all.
 */

import { DEMO_USER_ID } from '../../lib/demoMode';
import type { Profile, ParkingSession, ParkingQueueItem, ParkingRequest } from '../../types/database';

export const DANI_ID = 'demo-roommate-dani';
export const URI_ID = 'demo-roommate-uri';

const EPOCH = new Date(0).toISOString();

export const mockProfiles: Record<string, Profile> = {
  [DEMO_USER_ID]: { id: DEMO_USER_ID, full_name: 'משתמש הדגמה', email: 'demo@example.com', created_at: EPOCH },
  [DANI_ID]: { id: DANI_ID, full_name: 'דני', email: 'dani@example.com', created_at: EPOCH },
  [URI_ID]: { id: URI_ID, full_name: 'אורי', email: 'uri@example.com', created_at: EPOCH },
};

/** hoursAgo=3, minutes=90 → a finished session that started 3h ago and lasted 90min. */
function pastSession(id: string, userId: string, hoursAgo: number, minutes: number): ParkingSession {
  const start = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  const end = new Date(start.getTime() + minutes * 60 * 1000);
  return {
    id,
    user_id: userId,
    start_time: start.toISOString(),
    planned_end_time: null,
    actual_end_time: end.toISOString(),
    status: 'finished',
    note: null,
    created_at: start.toISOString(),
  };
}

export const mockSessions: ParkingSession[] = [
  pastSession('demo-session-1', DANI_ID, 30, 95),
  pastSession('demo-session-2', URI_ID, 20, 40),
  pastSession('demo-session-3', DEMO_USER_ID, 9, 130),
  pastSession('demo-session-4', DANI_ID, 3, 55),
];

export const mockQueue: ParkingQueueItem[] = [
  { id: 'demo-queue-1', user_id: URI_ID, joined_at: EPOCH, status: 'waiting' },
];

/** daysFromNow=1, startHour=20, endHour=23 → a planned request for tomorrow evening. */
function futureRequest(id: string, userId: string, daysFromNow: number, startHour: number, endHour: number, note: string | null): ParkingRequest {
  const start = new Date();
  start.setDate(start.getDate() + daysFromNow);
  start.setHours(startHour, 0, 0, 0);
  const end = new Date(start);
  if (endHour <= startHour) end.setDate(end.getDate() + 1);
  end.setHours(endHour, 0, 0, 0);
  return {
    id,
    user_id: userId,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    note,
    status: 'planned',
    created_at: new Date().toISOString(),
  };
}

export const mockRequests: ParkingRequest[] = [
  futureRequest('demo-request-1', DANI_ID, 1, 20, 23, 'חוזר מאוחר מהעבודה'),
];

let idCounter = 0;

/** Generates a readable unique ID for new mock rows (sessions, queue items, ...). */
export function nextMockId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

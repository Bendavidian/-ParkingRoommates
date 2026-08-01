/**
 * Why this file exists:
 * Demo-mode stand-in for ParkingRepository. Same method signatures and the
 * same Result<T> contract, backed by the in-memory store in mockData.ts
 * instead of Supabase — ParkingService runs unchanged with no DB connection.
 */

import { ok, err } from '../../lib/result';
import type { Result } from '../../lib/result';
import type {
  ParkingSession,
  ParkingSessionWithProfile,
  CreateSessionInput,
} from '../../types/database';
import { mockProfiles, mockSessions, nextMockId } from './mockData';

const HISTORY_RETENTION_DAYS = 30;

function withProfile(session: ParkingSession): ParkingSessionWithProfile {
  return { ...session, profile: mockProfiles[session.user_id] };
}

export const MockParkingRepository = {
  async getCurrentSession(): Promise<Result<ParkingSessionWithProfile | null>> {
    const active = mockSessions.find((s) => s.status === 'active');
    return ok(active ? withProfile(active) : null);
  },

  async createSession(input: CreateSessionInput): Promise<Result<ParkingSession>> {
    if (mockSessions.some((s) => s.status === 'active')) {
      return err('The parking spot is already in use.');
    }

    const session: ParkingSession = {
      id: nextMockId('session'),
      apartment_id: input.apartmentId,
      user_id: input.userId,
      start_time: new Date().toISOString(),
      planned_end_time: input.plannedEndTime ?? null,
      actual_end_time: null,
      status: 'active',
      note: input.note ?? null,
      created_at: new Date().toISOString(),
    };
    mockSessions.push(session);
    return ok(session);
  },

  async finishSession(userId: string): Promise<Result<ParkingSession>> {
    const session = mockSessions.find((s) => s.user_id === userId && s.status === 'active');
    if (!session) return err('No matching record was found.');

    session.status = 'finished';
    session.actual_end_time = new Date().toISOString();
    return ok(session);
  },

  async getHistory(
    userId?: string,
    limit = 100,
  ): Promise<Result<ParkingSessionWithProfile[]>> {
    const cutoff = new Date(Date.now() - HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const rows = mockSessions
      .filter((s) => s.status !== 'active')
      .filter((s) => s.start_time >= cutoff)
      .filter((s) => !userId || s.user_id === userId)
      .sort((a, b) => (a.start_time < b.start_time ? 1 : -1))
      .slice(0, limit)
      .map(withProfile);
    return ok(rows);
  },
};

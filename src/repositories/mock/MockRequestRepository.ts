/**
 * Why this file exists:
 * Demo-mode stand-in for RequestRepository. Same method signatures and the
 * same Result<T> contract, backed by the in-memory store in mockData.ts
 * instead of Supabase — RequestService runs unchanged with no DB connection.
 */

import { ok, err } from '../../lib/result';
import type { Result } from '../../lib/result';
import type {
  ParkingRequest,
  ParkingRequestWithProfile,
  CreateRequestInput,
  UpdateRequestInput,
} from '../../types/database';
import { mockProfiles, mockRequests, nextMockId } from './mockData';

function withProfile(request: ParkingRequest): ParkingRequestWithProfile {
  return { ...request, profile: mockProfiles[request.user_id] };
}

export const MockRequestRepository = {
  async createParkingRequest(input: CreateRequestInput): Promise<Result<ParkingRequest>> {
    if (new Date(input.endTime) <= new Date(input.startTime)) {
      return err('A data check failed (invalid value).');
    }

    const request: ParkingRequest = {
      id: nextMockId('request'),
      apartment_id: input.apartmentId,
      user_id: input.userId,
      start_time: input.startTime,
      end_time: input.endTime,
      note: input.note ?? null,
      status: 'planned',
      created_at: new Date().toISOString(),
    };
    mockRequests.push(request);
    return ok(request);
  },

  async updateParkingRequest(
    id: string,
    userId: string,
    input: UpdateRequestInput,
  ): Promise<Result<ParkingRequest>> {
    const request = mockRequests.find((r) => r.id === id && r.user_id === userId);
    if (!request) return err('No matching record was found.');

    if (input.startTime !== undefined) request.start_time = input.startTime;
    if (input.endTime !== undefined) request.end_time = input.endTime;
    if (input.note !== undefined) request.note = input.note ?? null;
    if (input.status !== undefined) request.status = input.status;
    return ok(request);
  },

  async getUpcomingRequests(userId?: string): Promise<Result<ParkingRequestWithProfile[]>> {
    const nowIso = new Date().toISOString();
    const rows = mockRequests
      .filter((r) => r.status === 'planned' && r.start_time >= nowIso)
      .filter((r) => !userId || r.user_id === userId)
      .sort((a, b) => (a.start_time < b.start_time ? -1 : 1))
      .map(withProfile);
    return ok(rows);
  },
};

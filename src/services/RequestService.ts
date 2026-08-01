/**
 * Why this file exists:
 * Orchestrates planned-request business logic that does not belong in a
 * repository (which only speaks SQL):
 *   - Auth guard before every write
 *   - Time-range validation before hitting the DB CHECK constraint
 * UI components import from services, never from repositories directly.
 */

import { ok, err } from '../lib/result';
import type { Result } from '../lib/result';
import { getCurrentUserId, getCurrentApartmentId } from '../lib/auth';
import { isDemoMode } from '../lib/demoMode';
import { RequestRepository } from '../repositories/RequestRepository';
import { MockRequestRepository } from '../repositories/mock/MockRequestRepository';
import type { ParkingRequest, ParkingRequestWithProfile } from '../types/database';

function requestRepo() {
  return isDemoMode() ? MockRequestRepository : RequestRepository;
}

export const RequestService = {
  /**
   * Returns upcoming planned requests, all roommates by default so everyone
   * can see who already claimed a future window.
   */
  async getUpcomingRequests(filterByCurrentUser = false): Promise<Result<ParkingRequestWithProfile[]>> {
    if (!filterByCurrentUser) return requestRepo().getUpcomingRequests();

    const userId = await getCurrentUserId();
    if (!userId) return err('You must be signed in to view your requests.');
    return requestRepo().getUpcomingRequests(userId);
  },

  /**
   * Creates a planned request for the authenticated user.
   * Validates end > start client-side so the error reads clearly before it
   * would otherwise surface as a DB CHECK-constraint failure.
   */
  async createRequest(startTime: string, endTime: string, note?: string): Promise<Result<ParkingRequest>> {
    const userId = await getCurrentUserId();
    if (!userId) return err('You must be signed in to add a request.');
    const apartmentId = await getCurrentApartmentId();
    if (!apartmentId) return err('You must join an apartment before adding a request.');
    if (new Date(endTime) <= new Date(startTime)) {
      return err('End time must be after start time.');
    }

    return requestRepo().createParkingRequest({ apartmentId, userId, startTime, endTime, note });
  },

  /**
   * Cancels the authenticated user's own request.
   */
  async cancelRequest(id: string): Promise<Result<ParkingRequest>> {
    const userId = await getCurrentUserId();
    if (!userId) return err('You must be signed in to cancel a request.');
    return requestRepo().updateParkingRequest(id, userId, { status: 'cancelled' });
  },
};

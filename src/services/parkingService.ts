/**
 * Why this file exists:
 * Orchestrates parking-session business logic that does not belong in a
 * repository (which only speaks SQL). Responsibilities:
 *   - Auth guard: reject calls from unauthenticated users before hitting the DB
 *   - Ownership check: a user may only finish their own session
 *   - Coordination: finishing a session triggers serving the next queue item
 * UI components import from services, never from repositories directly.
 */

import { ok, err } from '../lib/result';
import type { Result } from '../lib/result';
import { getCurrentUserId } from '../lib/auth';
import { ParkingRepository } from '../repositories/ParkingRepository';
import { QueueRepository } from '../repositories/QueueRepository';
import type { ParkingSession, ParkingSessionWithProfile } from '../types/database';

export const ParkingService = {
  /**
   * Returns the current active session (with profile) or null if the spot
   * is free. No auth required — reading state is a public operation among
   * roommates.
   */
  async getActiveSession(): Promise<Result<ParkingSessionWithProfile | null>> {
    return ParkingRepository.getCurrentSession();
  },

  /**
   * Starts a parking session for the authenticated user.
   * The DB enforces one-active-session-at-a-time at the index level, so
   * no pre-flight check is needed here; the error surfaces via handleDbError.
   */
  async startSession(
    plannedEndTime?: string,
    note?: string,
  ): Promise<Result<ParkingSession>> {
    const userId = await getCurrentUserId();
    if (!userId) return err('You must be signed in to use the parking spot.');

    return ParkingRepository.createSession({ userId, plannedEndTime, note });
  },

  /**
   * Finishes the authenticated user's own active session.
   * Enforces ownership: if the active session belongs to a different roommate
   * the call is rejected before touching the database.
   * After finishing, serves the next person waiting in the queue (if any).
   */
  async finishSession(): Promise<Result<ParkingSession>> {
    const userId = await getCurrentUserId();
    if (!userId) return err('You must be signed in to finish a session.');

    // Ownership check — read the active session first
    const sessionResult = await ParkingRepository.getCurrentSession();
    if (!sessionResult.ok) return sessionResult;
    if (!sessionResult.data) return err('There is no active parking session to finish.');
    if (sessionResult.data.user_id !== userId) {
      return err('You can only finish your own parking session.');
    }

    const finishResult = await ParkingRepository.finishSession(userId);
    if (!finishResult.ok) return finishResult;

    // Best-effort: serve the next person in the queue.
    // We do not fail the overall operation if this step errors.
    const queueResult = await QueueRepository.getQueue();
    if (queueResult.ok && queueResult.data.length > 0) {
      await QueueRepository.serveItem(queueResult.data[0].id);
    }

    return finishResult;
  },

  /**
   * Returns session history.
   * Pass filterByCurrentUser = true to scope to the signed-in user's sessions.
   */
  async getHistory(
    filterByCurrentUser = false,
  ): Promise<Result<ParkingSessionWithProfile[]>> {
    if (!filterByCurrentUser) {
      return ParkingRepository.getHistory();
    }
    const userId = await getCurrentUserId();
    if (!userId) return err('You must be signed in to view your history.');
    return ParkingRepository.getHistory(userId);
  },
};

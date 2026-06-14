/**
 * Why this file exists:
 * Orchestrates queue business rules that do not belong in the repository:
 *   - Auth guard before every write
 *   - "Already waiting" duplicate guard before joinQueue
 *   - serveNextInQueue: reads the queue and promotes the first entry —
 *     a two-step operation that would be unsafe to split across callers
 */

import { ok, err } from '../lib/result';
import type { Result } from '../lib/result';
import { getCurrentUserId } from '../lib/auth';
import { QueueRepository } from '../repositories/QueueRepository';
import type { ParkingQueueItem, ParkingQueueItemWithProfile } from '../types/database';

export const QueueService = {
  /**
   * Returns the current waiting queue with profiles, FIFO order.
   * No auth required — all roommates can see who is waiting.
   */
  async getQueue(): Promise<Result<ParkingQueueItemWithProfile[]>> {
    return QueueRepository.getQueue();
  },

  /**
   * Adds the authenticated user to the end of the queue.
   * Rejects the call if the user is already waiting (prevents duplicate entries
   * that would otherwise require a DB unique constraint to catch).
   */
  async joinQueue(): Promise<Result<ParkingQueueItem>> {
    const userId = await getCurrentUserId();
    if (!userId) return err('You must be signed in to join the queue.');

    const queueResult = await QueueRepository.getQueue();
    if (!queueResult.ok) return queueResult;

    const alreadyWaiting = queueResult.data.some((item) => item.user_id === userId);
    if (alreadyWaiting) return err('You are already in the queue.');

    return QueueRepository.joinQueue(userId);
  },

  /**
   * Removes the authenticated user from the queue (sets status → cancelled).
   */
  async leaveQueue(): Promise<Result<ParkingQueueItem>> {
    const userId = await getCurrentUserId();
    if (!userId) return err('You must be signed in to leave the queue.');
    return QueueRepository.leaveQueue(userId);
  },

  /**
   * Promotes the first waiting entry to 'served'.
   * Called by ParkingService.finishSession() automatically, but also exposed
   * here so a future admin screen can trigger it manually.
   * Returns null (not an error) when the queue is empty.
   */
  async serveNextInQueue(): Promise<Result<ParkingQueueItem | null>> {
    const queueResult = await QueueRepository.getQueue();
    if (!queueResult.ok) return queueResult;
    if (queueResult.data.length === 0) return ok(null);

    const next = queueResult.data[0];
    return QueueRepository.serveItem(next.id);
  },
};

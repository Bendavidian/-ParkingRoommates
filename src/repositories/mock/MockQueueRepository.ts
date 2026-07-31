/**
 * Why this file exists:
 * Demo-mode stand-in for QueueRepository. Same method signatures and the
 * same Result<T> contract, backed by the in-memory store in mockData.ts
 * instead of Supabase — QueueService runs unchanged with no DB connection.
 */

import { ok, err } from '../../lib/result';
import type { Result } from '../../lib/result';
import type { ParkingQueueItem, ParkingQueueItemWithProfile } from '../../types/database';
import { mockProfiles, mockQueue, nextMockId } from './mockData';

function withProfile(item: ParkingQueueItem): ParkingQueueItemWithProfile {
  return { ...item, profile: mockProfiles[item.user_id] };
}

export const MockQueueRepository = {
  async getQueue(): Promise<Result<ParkingQueueItemWithProfile[]>> {
    const waiting = mockQueue
      .filter((q) => q.status === 'waiting')
      .sort((a, b) => (a.joined_at < b.joined_at ? -1 : 1))
      .map(withProfile);
    return ok(waiting);
  },

  async joinQueue(userId: string): Promise<Result<ParkingQueueItem>> {
    const item: ParkingQueueItem = {
      id: nextMockId('queue'),
      user_id: userId,
      joined_at: new Date().toISOString(),
      status: 'waiting',
    };
    mockQueue.push(item);
    return ok(item);
  },

  async leaveQueue(userId: string): Promise<Result<ParkingQueueItem>> {
    const item = mockQueue.find((q) => q.user_id === userId && q.status === 'waiting');
    if (!item) return err('No matching record was found.');

    item.status = 'cancelled';
    return ok(item);
  },

  async serveItem(queueItemId: string): Promise<Result<ParkingQueueItem>> {
    const item = mockQueue.find((q) => q.id === queueItemId && q.status === 'waiting');
    if (!item) return err('No matching record was found.');

    item.status = 'served';
    return ok(item);
  },
};

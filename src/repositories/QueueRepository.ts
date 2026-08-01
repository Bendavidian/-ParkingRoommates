/**
 * Why this file exists:
 * Single point of contact between the app and the `parking_queue` table.
 * Contains ONLY Supabase queries — queue business rules (e.g. "already waiting"
 * guard) live in QueueService, not here.
 */

import { supabase } from '../lib/supabase';
import { ok, err, handleDbError } from '../lib/result';
import type { Result } from '../lib/result';
import type { ParkingQueueItem, ParkingQueueItemWithProfile } from '../types/database';

const QUEUE_WITH_PROFILE =
  '*, profile:profiles!inner(id, full_name, email, created_at)' as const;

export const QueueRepository = {
  /**
   * Returns all waiting queue items in FIFO order with profiles embedded.
   */
  async getQueue(): Promise<Result<ParkingQueueItemWithProfile[]>> {
    const { data, error } = await supabase
      .from('parking_queue')
      .select(QUEUE_WITH_PROFILE)
      .eq('status', 'waiting')
      .order('joined_at', { ascending: true });

    if (error) return err(handleDbError(error));
    return ok((data ?? []) as ParkingQueueItemWithProfile[]);
  },

  /**
   * Inserts a new waiting entry for the given user.
   */
  async joinQueue(userId: string): Promise<Result<ParkingQueueItem>> {
    const { data, error } = await supabase
      .from('parking_queue')
      .insert({ user_id: userId, status: 'waiting' })
      .select()
      .single();

    if (error) return err(handleDbError(error));
    return ok(data as ParkingQueueItem);
  },

  /**
   * Cancels the given user's current waiting entry.
   * Leaves the row in place for auditing purposes.
   */
  async leaveQueue(userId: string): Promise<Result<ParkingQueueItem>> {
    const { data, error } = await supabase
      .from('parking_queue')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('status', 'waiting')
      .select()
      .single();

    if (error) return err(handleDbError(error));
    return ok(data as ParkingQueueItem);
  },

  /**
   * Marks a specific queue item as served (used when handing the spot over).
   */
  async serveItem(queueItemId: string): Promise<Result<ParkingQueueItem>> {
    const { data, error } = await supabase
      .from('parking_queue')
      .update({ status: 'served' })
      .eq('id', queueItemId)
      .eq('status', 'waiting')
      .select()
      .single();

    if (error) return err(handleDbError(error));
    return ok(data as ParkingQueueItem);
  },
};

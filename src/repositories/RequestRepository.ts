/**
 * Why this file exists:
 * Single point of contact between the app and the `parking_requests` table.
 * Contains ONLY Supabase queries — time-overlap validation and other business
 * rules belong in a service layer.
 */

import { supabase } from '../lib/supabase';
import { ok, err, handleDbError } from '../lib/result';
import type { Result } from '../lib/result';
import type {
  ParkingRequest,
  ParkingRequestWithProfile,
  CreateRequestInput,
  UpdateRequestInput,
} from '../types/database';

const REQUEST_WITH_PROFILE =
  '*, profile:profiles!inner(id, full_name, email, created_at)' as const;

export const RequestRepository = {
  /**
   * Creates a new planned parking request.
   * The DB CHECK constraint (end_time > start_time) rejects invalid ranges.
   */
  async createParkingRequest(
    input: CreateRequestInput,
  ): Promise<Result<ParkingRequest>> {
    const { data, error } = await supabase
      .from('parking_requests')
      .insert({
        user_id: input.userId,
        start_time: input.startTime,
        end_time: input.endTime,
        note: input.note ?? null,
        status: 'planned',
      })
      .select()
      .single();

    if (error) return err(handleDbError(error));
    return ok(data as ParkingRequest);
  },

  /**
   * Partially updates a request row. Only fields present in input are written.
   * The explicit user_id filter supplements RLS to surface ownership errors
   * as a readable message rather than a silent no-op.
   */
  async updateParkingRequest(
    id: string,
    userId: string,
    input: UpdateRequestInput,
  ): Promise<Result<ParkingRequest>> {
    const patch: Record<string, unknown> = {};
    if (input.startTime !== undefined) patch.start_time = input.startTime;
    if (input.endTime !== undefined) patch.end_time = input.endTime;
    if (input.note !== undefined) patch.note = input.note;
    if (input.status !== undefined) patch.status = input.status;

    const { data, error } = await supabase
      .from('parking_requests')
      .update(patch)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) return err(handleDbError(error));
    return ok(data as ParkingRequest);
  },

  /**
   * Returns all planned requests whose start_time is in the future, in
   * ascending order. Optional userId scopes to a single roommate.
   */
  async getUpcomingRequests(
    userId?: string,
  ): Promise<Result<ParkingRequestWithProfile[]>> {
    let query = supabase
      .from('parking_requests')
      .select(REQUEST_WITH_PROFILE)
      .eq('status', 'planned')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true });

    if (userId) query = query.eq('user_id', userId);

    const { data, error } = await query;
    if (error) return err(handleDbError(error));
    return ok((data ?? []) as ParkingRequestWithProfile[]);
  },
};

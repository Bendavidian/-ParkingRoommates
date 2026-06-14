/**
 * Why this file exists:
 * Single point of contact between the app and the `parking_sessions` table.
 * Contains ONLY Supabase queries — no auth checks, no business rules.
 * If the table name or column names ever change, this is the only file to edit.
 */

import { supabase } from '../lib/supabase';
import { ok, err, handleDbError } from '../lib/result';
import type { Result } from '../lib/result';
import type {
  ParkingSession,
  ParkingSessionWithProfile,
  CreateSessionInput,
} from '../types/database';

const SESSION_WITH_PROFILE =
  '*, profile:profiles!inner(id, full_name, email, created_at)' as const;

export const ParkingRepository = {
  /**
   * Returns the single active session with its owner's profile, or null if the
   * spot is currently free.
   * Uses maybeSingle() so "no rows" is data: null, not an error.
   */
  async getCurrentSession(): Promise<Result<ParkingSessionWithProfile | null>> {
    const { data, error } = await supabase
      .from('parking_sessions')
      .select(SESSION_WITH_PROFILE)
      .eq('status', 'active')
      .maybeSingle();

    if (error) return err(handleDbError(error));
    return ok(data as ParkingSessionWithProfile | null);
  },

  /**
   * Inserts a new active session row.
   * The DB partial unique index (idx_one_active_session) rejects a second
   * active row with code 23505 — callers receive a readable message via
   * handleDbError.
   */
  async createSession(input: CreateSessionInput): Promise<Result<ParkingSession>> {
    const { data, error } = await supabase
      .from('parking_sessions')
      .insert({
        user_id: input.userId,
        status: 'active',
        planned_end_time: input.plannedEndTime ?? null,
        note: input.note ?? null,
      })
      .select()
      .single();

    if (error) return err(handleDbError(error));
    return ok(data as ParkingSession);
  },

  /**
   * Marks the given user's active session as finished and stamps actual_end_time.
   * RLS ensures a user can only update their own rows; the explicit user_id
   * filter is an extra safety layer that also produces a clearer error if the
   * session belongs to someone else.
   */
  async finishSession(userId: string): Promise<Result<ParkingSession>> {
    const { data, error } = await supabase
      .from('parking_sessions')
      .update({
        status: 'finished',
        actual_end_time: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('status', 'active')
      .select()
      .single();

    if (error) return err(handleDbError(error));
    return ok(data as ParkingSession);
  },

  /**
   * Returns finished and cancelled sessions in reverse chronological order.
   * Optional userId scopes the result to a single roommate.
   * Optional limit caps the result set (default 100).
   */
  async getHistory(
    userId?: string,
    limit = 100,
  ): Promise<Result<ParkingSessionWithProfile[]>> {
    let query = supabase
      .from('parking_sessions')
      .select(SESSION_WITH_PROFILE)
      .in('status', ['finished', 'cancelled'])
      .order('start_time', { ascending: false })
      .limit(limit);

    if (userId) query = query.eq('user_id', userId);

    const { data, error } = await query;
    if (error) return err(handleDbError(error));
    return ok((data ?? []) as ParkingSessionWithProfile[]);
  },
};

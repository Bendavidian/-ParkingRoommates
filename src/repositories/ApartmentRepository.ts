/**
 * Why this file exists:
 * Single point of contact between the app and apartment membership.
 * Creating an apartment and joining one by invite code are both privileged
 * operations (they write apartments.owner_id / profiles.apartment_id), so
 * they go through SECURITY DEFINER Postgres functions (see schema.sql)
 * instead of plain inserts/updates — this file just calls those RPCs.
 */

import { supabase } from '../lib/supabase';
import { ok, err, handleDbError } from '../lib/result';
import type { Result } from '../lib/result';
import type { Apartment } from '../types/database';

export const ApartmentRepository = {
  /**
   * Returns the caller's own apartment, or null if they haven't created/
   * joined one yet. RLS already scopes this table to "your own apartment",
   * so a plain select naturally returns at most one row.
   */
  async getMyApartment(): Promise<Result<Apartment | null>> {
    const { data, error } = await supabase.from('apartments').select('*').maybeSingle();
    if (error) return err(handleDbError(error));
    return ok(data as Apartment | null);
  },

  /**
   * Creates a new apartment owned by the caller and joins them to it.
   * Returns the new apartment's id.
   */
  async createApartment(name: string): Promise<Result<string>> {
    const { data, error } = await supabase.rpc('create_apartment', { apartment_name: name });
    if (error) return err(handleDbError(error));
    return ok(data as string);
  },

  /**
   * Joins the caller to an existing apartment via its invite code.
   * Returns the apartment's id.
   */
  async joinByInviteCode(code: string): Promise<Result<string>> {
    const { data, error } = await supabase.rpc('join_apartment_by_invite_code', { code });
    if (error) return err(handleDbError(error));
    return ok(data as string);
  },
};

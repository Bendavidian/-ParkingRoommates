/**
 * Why this file exists:
 * Orchestrates apartment-membership business logic that does not belong in
 * a repository (which only speaks SQL/RPC): auth guards and basic input
 * validation before every write. UI components import from services, never
 * from repositories directly.
 */

import { ok, err } from '../lib/result';
import type { Result } from '../lib/result';
import { getCurrentUserId } from '../lib/auth';
import { isDemoMode } from '../lib/demoMode';
import { ApartmentRepository } from '../repositories/ApartmentRepository';
import { MockApartmentRepository } from '../repositories/mock/MockApartmentRepository';
import type { Apartment } from '../types/database';

function apartmentRepo() {
  return isDemoMode() ? MockApartmentRepository : ApartmentRepository;
}

export const ApartmentService = {
  /** Returns the signed-in user's apartment, or null if they haven't joined one yet. */
  async getMyApartment(): Promise<Result<Apartment | null>> {
    const userId = await getCurrentUserId();
    if (!userId) return err('You must be signed in.');
    return apartmentRepo().getMyApartment();
  },

  /** Creates a new apartment and joins the caller to it as owner. */
  async createApartment(name: string): Promise<Result<string>> {
    const userId = await getCurrentUserId();
    if (!userId) return err('You must be signed in to create an apartment.');
    if (!name.trim()) return err('Apartment name is required.');
    return apartmentRepo().createApartment(name.trim());
  },

  /** Joins the caller to an existing apartment by its invite code. */
  async joinByInviteCode(code: string): Promise<Result<string>> {
    const userId = await getCurrentUserId();
    if (!userId) return err('You must be signed in to join an apartment.');
    if (!code.trim()) return err('Invite code is required.');
    return apartmentRepo().joinByInviteCode(code.trim());
  },
};

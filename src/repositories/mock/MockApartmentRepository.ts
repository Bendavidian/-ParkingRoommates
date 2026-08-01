/**
 * Why this file exists:
 * Demo-mode stand-in for ApartmentRepository. The demo user always already
 * belongs to the fixed mock apartment, so create/join are no-ops that just
 * confirm membership rather than actually branching — there's only ever
 * one apartment to be in while demoing.
 */

import { ok } from '../../lib/result';
import type { Result } from '../../lib/result';
import type { Apartment } from '../../types/database';
import { mockApartment } from './mockData';

export const MockApartmentRepository = {
  async getMyApartment(): Promise<Result<Apartment | null>> {
    return ok(mockApartment);
  },

  async createApartment(_name: string): Promise<Result<string>> {
    return ok(mockApartment.id);
  },

  async joinByInviteCode(_code: string): Promise<Result<string>> {
    return ok(mockApartment.id);
  },
};

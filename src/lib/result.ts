/**
 * Why this file exists:
 * Supabase returns { data, error } with both potentially null, making callers
 * handle two variables and guess which is set. A discriminated union forces
 * callers to branch on `ok` first, catching the null case at compile time.
 */

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function err(error: string): Result<never> {
  return { ok: false, error };
}

/**
 * Maps known Postgres/PostgREST error codes to human-readable messages.
 * Centralised here so no repository has to hard-code magic strings.
 */
const PG_ERROR_MESSAGES: Record<string, string> = {
  '23505': 'The parking spot is already in use.',       // unique_violation
  '23503': 'A referenced record does not exist.',       // foreign_key_violation
  '23514': 'A data check failed (invalid value).',      // check_violation
  '42501': 'You do not have permission to do that.',    // insufficient_privilege
  PGRST116: 'No matching record was found.',            // PostgREST: .single() found 0 rows
};

export function handleDbError(error: unknown): string {
  if (!error || typeof error !== 'object') return 'An unexpected error occurred.';
  const e = error as { code?: string; message?: string };
  if (e.code && e.code in PG_ERROR_MESSAGES) return PG_ERROR_MESSAGES[e.code];
  return e.message ?? 'An unexpected error occurred.';
}

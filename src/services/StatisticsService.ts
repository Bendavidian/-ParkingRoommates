/**
 * Why this file exists:
 * Aggregation logic that derives statistics from raw history rows.
 * Pure computation — no Supabase calls, no auth checks.
 * Repositories give us rows; this service turns rows into numbers the UI
 * can display directly on the Stats screen.
 */

import { ok, err } from '../lib/result';
import type { Result } from '../lib/result';
import { ParkingRepository } from '../repositories/ParkingRepository';
import { getDurationInMinutes } from '../utils/dateUtils';
import type { Profile } from '../types/database';

export type UserStats = {
  userId: string;
  fullName: string;
  email: string;
  /** Number of sessions with status 'finished'. */
  totalSessions: number;
  /** Sum of all finished session durations in minutes. */
  totalMinutes: number;
  /** Average duration per finished session, rounded to nearest minute. */
  averageMinutes: number;
  /** ISO string of the most recent start_time, or null if no sessions yet. */
  lastSessionAt: string | null;
};

export type AllStats = {
  /** One entry per roommate who has at least one session. Sorted by totalMinutes descending. */
  roommates: UserStats[];
  /** Total finished sessions across all roommates. */
  totalSessionsAll: number;
  /** Combined minutes across all roommates. */
  totalMinutesAll: number;
};

export const StatisticsService = {
  /**
   * Computes stats for every roommate who has parking history.
   * Fetches all finished sessions in one query and groups them in JS so we
   * pay a single round-trip regardless of how many roommates exist.
   */
  async getAllStats(): Promise<Result<AllStats>> {
    const historyResult = await ParkingRepository.getHistory(undefined, 1000);
    if (!historyResult.ok) return historyResult;

    const sessions = historyResult.data.filter((s) => s.status === 'finished');

    // Group sessions by user_id
    const byUser = new Map<string, { profile: Profile; minutes: number[]; lastAt: string }>();

    for (const session of sessions) {
      const duration = getDurationInMinutes(
        session.start_time,
        session.actual_end_time ?? undefined,
      );

      const existing = byUser.get(session.user_id);
      if (existing) {
        existing.minutes.push(duration);
        if (session.start_time > existing.lastAt) existing.lastAt = session.start_time;
      } else {
        byUser.set(session.user_id, {
          profile: session.profile,
          minutes: [duration],
          lastAt: session.start_time,
        });
      }
    }

    const roommates: UserStats[] = Array.from(byUser.entries()).map(
      ([userId, { profile, minutes, lastAt }]) => {
        const totalMinutes = minutes.reduce((sum, m) => sum + m, 0);
        return {
          userId,
          fullName: profile.full_name,
          email: profile.email,
          totalSessions: minutes.length,
          totalMinutes,
          averageMinutes: minutes.length > 0 ? Math.round(totalMinutes / minutes.length) : 0,
          lastSessionAt: lastAt,
        };
      },
    );

    // Sort by most usage first
    roommates.sort((a, b) => b.totalMinutes - a.totalMinutes);

    return ok({
      roommates,
      totalSessionsAll: sessions.length,
      totalMinutesAll: roommates.reduce((sum, r) => sum + r.totalMinutes, 0),
    });
  },

  /**
   * Computes stats for a single user.
   * Delegates to getAllStats and extracts the relevant entry so the
   * aggregation logic stays in one place.
   */
  async getUserStats(userId: string): Promise<Result<UserStats | null>> {
    const allResult = await StatisticsService.getAllStats();
    if (!allResult.ok) return allResult;

    const user = allResult.data.roommates.find((r) => r.userId === userId) ?? null;
    return ok(user);
  },
};

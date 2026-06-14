/**
 * Why this file exists:
 * Single point of contact between the app and the `notifications` table.
 * Notifications are personal (RLS: user_id = auth.uid()) so every query
 * scopes to the current user explicitly as a second safety layer.
 */

import { supabase } from '../lib/supabase';
import { ok, err, handleDbError } from '../lib/result';
import type { Result } from '../lib/result';
import type { Notification } from '../types/database';

export const NotificationRepository = {
  /**
   * Returns the latest notifications for the given user, newest first.
   */
  async getNotifications(
    userId: string,
    limit = 30,
  ): Promise<Result<Notification[]>> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return err(handleDbError(error));
    return ok((data ?? []) as Notification[]);
  },

  /**
   * Marks a single notification as read. Requires both notificationId and
   * userId so the update cannot be misdirected to another user's row.
   */
  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<Result<Notification>> {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) return err(handleDbError(error));
    return ok(data as Notification);
  },

  /**
   * Returns the count of unread notifications for a user.
   * Useful for a badge on the tab bar without loading full payloads.
   */
  async getUnreadCount(userId: string): Promise<Result<number>> {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) return err(handleDbError(error));
    return ok(count ?? 0);
  },
};

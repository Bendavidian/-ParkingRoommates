import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import AppCard from '../components/AppCard';
import AppButton from '../components/AppButton';
import SectionTitle from '../components/SectionTitle';
import ScreenContainer from '../components/ScreenContainer';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import colors from '../theme/colors';
import { useAuth } from '../hooks/useAuth';
import { DEMO_USER_ID } from '../lib/demoMode';
import { ParkingService } from '../services/parkingService';
import { QueueService } from '../services/QueueService';
import { formatTime } from '../utils/dateUtils';
import type { ParkingSessionWithProfile, ParkingQueueItemWithProfile } from '../types/database';

type ActionKind = 'park' | 'finish' | 'join' | 'leave' | null;

export default function HomeScreen() {
  const { user, isDemoUser } = useAuth();
  const currentUserId = isDemoUser ? DEMO_USER_ID : user?.id ?? null;
  const greetingName = isDemoUser
    ? 'משתמש הדגמה'
    : ((user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? '');

  const [session, setSession] = useState<ParkingSessionWithProfile | null>(null);
  const [queue, setQueue] = useState<ParkingQueueItemWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<ActionKind>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [sessionResult, queueResult] = await Promise.all([
      ParkingService.getActiveSession(),
      QueueService.getQueue(),
    ]);

    if (sessionResult.ok) setSession(sessionResult.data);
    else setErrorMsg(sessionResult.error);

    if (queueResult.ok) setQueue(queueResult.data);
    else setErrorMsg(queueResult.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  async function runAction(kind: ActionKind, action: () => Promise<{ ok: boolean; error?: string }>) {
    setErrorMsg(null);
    setPendingAction(kind);
    const result = await action();
    if (!result.ok) setErrorMsg(result.error ?? 'אירעה שגיאה, נסה שוב');
    await loadData();
    setPendingAction(null);
  }

  const isMine = !!session && session.user_id === currentUserId;
  const isWaiting = queue.some((item) => item.user_id === currentUserId);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.greeting}>שלום {greetingName} 👋</Text>
        <Text style={styles.subheading}>מה מצב החנייה?</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loading} />
      ) : (
        <>
          <AppCard style={styles.parkingCard}>
            <View style={styles.statusRow}>
              <Text style={styles.cardTitle}>{session ? 'החנייה תפוסה' : 'החנייה פנויה'}</Text>
              <StatusBadge variant={session ? 'danger' : 'success'} label={session ? 'תפוסה' : 'פנוי'} />
            </View>

            {session ? (
              <>
                <Text style={styles.cardText}>מחנה כרגע: {session.profile.full_name}</Text>
                {session.planned_end_time ? (
                  <Text style={styles.cardText}>עד שעה: {formatTime(session.planned_end_time)}</Text>
                ) : null}
              </>
            ) : (
              <Text style={styles.cardText}>המקום פנוי כרגע — קדימה!</Text>
            )}
          </AppCard>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <AppCard style={styles.actionCard}>
            <Text style={styles.sectionLabel}>פעולות מהירות</Text>
            <View style={styles.actionRow}>
              {!session ? (
                <AppButton
                  title="אני מחנה עכשיו"
                  onPress={() => runAction('park', () => ParkingService.startSession())}
                  disabled={pendingAction !== null}
                  style={styles.actionBtn}
                />
              ) : null}

              {isMine ? (
                <AppButton
                  title="פיניתי את החנייה"
                  onPress={() => runAction('finish', () => ParkingService.finishSession())}
                  variant="success"
                  disabled={pendingAction !== null}
                  style={styles.actionBtn}
                />
              ) : null}
            </View>

            {session && !isMine ? (
              isWaiting ? (
                <AppButton
                  title="בטל המתנה"
                  onPress={() => runAction('leave', () => QueueService.leaveQueue())}
                  variant="ghost"
                  disabled={pendingAction !== null}
                />
              ) : (
                <AppButton
                  title="אני ממתין לחנייה"
                  onPress={() => runAction('join', () => QueueService.joinQueue())}
                  variant="secondary"
                  disabled={pendingAction !== null}
                />
              )
            ) : null}

            {pendingAction ? <ActivityIndicator color={colors.primary} style={styles.loading} /> : null}
          </AppCard>

          <SectionTitle title="תור ממתינים" />
          {queue.length === 0 ? (
            <EmptyState message="אין ממתינים כרגע" />
          ) : (
            <AppCard style={styles.queueCard}>
              {queue.map((item, index) => (
                <View key={item.id} style={styles.queueItem}>
                  <Text style={styles.queueIndex}>{index + 1}.</Text>
                  <Text style={styles.queueName}>
                    {item.profile.full_name}
                    {item.user_id === currentUserId ? ' (אני)' : ''}
                  </Text>
                </View>
              ))}
            </AppCard>
          )}
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 18,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subheading: {
    fontSize: 16,
    color: colors.muted,
    marginTop: 6,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  loading: {
    marginTop: 24,
  },
  parkingCard: {
    marginBottom: 18,
  },
  statusRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    writingDirection: 'rtl',
  },
  cardText: {
    color: colors.muted,
    fontSize: 15,
    marginBottom: 6,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  actionCard: {
    marginBottom: 18,
  },
  sectionLabel: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  actionRow: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
  },
  queueCard: {
    paddingVertical: 16,
  },
  queueItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  queueIndex: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  queueName: {
    color: colors.text,
    fontSize: 15,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
});

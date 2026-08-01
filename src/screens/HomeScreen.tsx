import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Easing } from 'react-native';
import AppCard from '../components/AppCard';
import AppButton from '../components/AppButton';
import ScreenContainer from '../components/ScreenContainer';
import EmptyState from '../components/EmptyState';
import Avatar from '../components/Avatar';
import colors from '../theme/colors';
import fonts from '../theme/fonts';
import { useAuth } from '../hooks/useAuth';
import { DEMO_USER_ID } from '../lib/demoMode';
import { ParkingService } from '../services/parkingService';
import { QueueService } from '../services/QueueService';
import { formatTime } from '../utils/dateUtils';
import type { ParkingSessionWithProfile, ParkingQueueItemWithProfile } from '../types/database';

type ActionKind = 'park' | 'finish' | 'join' | 'leave' | null;

/** mm:ss elapsed since startIso, ticking display for the live status timer. */
function formatElapsed(startIso: string, nowMs: number): string {
  const totalSeconds = Math.max(0, Math.floor((nowMs - new Date(startIso).getTime()) / 1000));
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

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
  const [nowMs, setNowMs] = useState(() => Date.now());

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

  // Live-ticking clock for the status timer — the one piece of the screen
  // that keeps moving on its own instead of only reacting to button presses.
  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session?.id]);

  // --- Entrance choreography: masthead → status → actions → queue ---
  const enter = useRef({
    masthead: new Animated.Value(0),
    status: new Animated.Value(0),
    actions: new Animated.Value(0),
    queue: new Animated.Value(0),
  }).current;

  useEffect(() => {
    if (loading) return;
    const cfg = { duration: 420, useNativeDriver: true, easing: Easing.out(Easing.cubic) };
    Animated.stagger(90, [
      Animated.timing(enter.masthead, { toValue: 1, ...cfg }),
      Animated.timing(enter.status, { toValue: 1, ...cfg }),
      Animated.timing(enter.actions, { toValue: 1, ...cfg }),
      Animated.timing(enter.queue, { toValue: 1, ...cfg }),
    ]).start();
  }, [loading]);

  function riseStyle(anim: Animated.Value) {
    return {
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
    };
  }

  // Cross-fades the status wash/stripe between free and occupied instead of
  // hard-cutting the color when the spot changes hands.
  const statusAnim = useRef(new Animated.Value(session ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(statusAnim, {
      toValue: session ? 1 : 0,
      duration: 380,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  }, [!!session]);

  // Pulsing "live" dot next to the timer, only while the spot is occupied.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!session) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [session?.id]);

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

  const elapsed = useMemo(
    () => (session ? formatElapsed(session.start_time, nowMs) : null),
    [session?.start_time, nowMs],
  );

  return (
    <ScreenContainer>
      <Animated.View style={[styles.masthead, riseStyle(enter.masthead)]}>
        <View style={styles.logoTile}>
          <Text style={styles.logoEmoji}>🅿️</Text>
        </View>
        <View style={styles.mastheadText}>
          <Text style={styles.eyebrow}>PARKING · ROOMMATES</Text>
          <Text style={styles.greeting}>שלום, {greetingName} 👋</Text>
        </View>
      </Animated.View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loading} />
      ) : (
        <>
          <Animated.View style={[styles.statusPanel, riseStyle(enter.status)]}>
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: colors.accentSoft, opacity: statusAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
              ]}
            />
            <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.dangerSoft, opacity: statusAnim }]} />

            <Animated.View
              style={[styles.statusStripe, { backgroundColor: colors.accent, opacity: statusAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}
            />
            <Animated.View style={[styles.statusStripe, { backgroundColor: colors.danger, opacity: statusAnim }]} />

            <View style={styles.statusInner}>
              <View style={styles.statusTopRow}>
                <View style={[styles.statusPill, { backgroundColor: session ? colors.danger : colors.accent }]}>
                  <Text style={styles.statusPillText}>{session ? 'תפוסה' : 'פנוי'}</Text>
                </View>
                <Text style={styles.statusTitle}>{session ? 'החנייה תפוסה' : 'החנייה פנויה'}</Text>
              </View>

              {session ? (
                <>
                  <Text style={styles.statusLine}>מחנה כרגע: {session.profile.full_name}</Text>
                  <View style={styles.liveRow}>
                    <Animated.View
                      style={[
                        styles.liveDot,
                        {
                          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
                          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.2] }) }],
                        },
                      ]}
                    />
                    <Text style={styles.statusTimer}>{elapsed}</Text>
                    <Text style={styles.statusTimerLabel}>בחניה</Text>
                  </View>
                  {session.planned_end_time ? (
                    <View style={styles.endPill}>
                      <Text style={styles.endPillText}>עד {formatTime(session.planned_end_time)}</Text>
                    </View>
                  ) : null}
                </>
              ) : (
                <Text style={styles.statusLine}>המקום פנוי כרגע — קדימה!</Text>
              )}
            </View>
          </Animated.View>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <Animated.View style={riseStyle(enter.actions)}>
            <AppCard style={styles.actionCard}>
              <Text style={styles.panelLabel}>פעולות מהירות</Text>
              <View style={styles.actionRow}>
                {!session ? (
                  <AppButton
                    title="אני מחנה עכשיו"
                    onPress={() => runAction('park', () => ParkingService.startSession())}
                    disabled={pendingAction !== null}
                    showArrow
                    style={styles.actionBtn}
                  />
                ) : null}

                {isMine ? (
                  <AppButton
                    title="פיניתי את החנייה"
                    onPress={() => runAction('finish', () => ParkingService.finishSession())}
                    disabled={pendingAction !== null}
                    showArrow
                    style={styles.actionBtn}
                  />
                ) : null}
              </View>

              {session && !isMine ? (
                isWaiting ? (
                  <AppButton
                    title="בטל המתנה"
                    onPress={() => runAction('leave', () => QueueService.leaveQueue())}
                    variant="outline"
                    disabled={pendingAction !== null}
                  />
                ) : (
                  <AppButton
                    title="אני ממתין לחנייה"
                    onPress={() => runAction('join', () => QueueService.joinQueue())}
                    variant="outline"
                    disabled={pendingAction !== null}
                  />
                )
              ) : null}

              {pendingAction ? <ActivityIndicator color={colors.accent} style={styles.loading} /> : null}
            </AppCard>
          </Animated.View>

          <Animated.View style={riseStyle(enter.queue)}>
            <View style={styles.panelLabelRow}>
              {queue.length > 0 ? <Text style={styles.panelCount}>({queue.length})</Text> : null}
              <Text style={styles.panelLabel}>תור ממתינים</Text>
            </View>
            {queue.length === 0 ? (
              <EmptyState message="אין ממתינים כרגע" />
            ) : (
              <AppCard style={styles.queueCard}>
                {queue.map((item, index) => (
                  <View key={item.id} style={styles.queueItem}>
                    <View style={styles.queueLeft}>
                      <Avatar seed={item.user_id} label={item.profile.full_name} />
                      <Text style={styles.queueName}>
                        {item.profile.full_name}
                        {item.user_id === currentUserId ? ' (אני)' : ''}
                      </Text>
                    </View>
                    <Text style={styles.queueIndex}>{index + 1}</Text>
                  </View>
                ))}
              </AppCard>
            )}
          </Animated.View>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  masthead: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  logoTile: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: colors.logoInk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 20,
  },
  mastheadText: {
    gap: 3,
  },
  eyebrow: {
    fontFamily: fonts.monoBold,
    fontSize: 10.5,
    letterSpacing: 1.2,
    color: colors.muted,
    writingDirection: 'rtl',
  },
  greeting: {
    fontFamily: fonts.displayExtraBold,
    fontSize: 23,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  loading: {
    marginTop: 24,
  },
  statusPanel: {
    marginBottom: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  statusStripe: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 5,
  },
  statusInner: {
    padding: 18,
    alignItems: 'flex-end',
    gap: 8,
  },
  statusTopRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: 10,
  },
  statusTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 19,
    color: colors.ink,
  },
  statusPill: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusPillText: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: '#fff',
  },
  statusLine: {
    fontFamily: fonts.bodyRegular,
    fontSize: 14.5,
    color: colors.inkSoft,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  liveRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  statusTimer: {
    fontFamily: fonts.monoBold,
    fontSize: 16,
    color: colors.ink,
  },
  statusTimerLabel: {
    fontFamily: fonts.bodyRegular,
    fontSize: 13,
    color: colors.muted,
  },
  endPill: {
    backgroundColor: 'rgba(16,35,26,0.06)',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 4,
    marginTop: 2,
  },
  endPillText: {
    fontFamily: fonts.monoBold,
    fontSize: 11.5,
    color: colors.inkSoft,
  },
  errorText: {
    color: colors.danger,
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  actionCard: {
    marginBottom: 16,
  },
  panelLabel: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.muted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  panelLabelRow: {
    flexDirection: 'row-reverse',
    alignItems: 'baseline',
    gap: 5,
    marginBottom: 12,
  },
  panelCount: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    color: colors.muted,
  },
  actionRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginTop: 12,
    marginBottom: 10,
  },
  actionBtn: {
    flex: 1,
  },
  queueCard: {
    paddingVertical: 6,
  },
  queueItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  queueLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  queueIndex: {
    fontFamily: fonts.monoBold,
    color: colors.muted,
    fontSize: 12.5,
  },
  queueName: {
    fontFamily: fonts.bodySemiBold,
    color: colors.ink,
    fontSize: 15,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
});

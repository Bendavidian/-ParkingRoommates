import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppCard from '../components/AppCard';
import AppButton from '../components/AppButton';
import SectionTitle from '../components/SectionTitle';
import ScreenContainer from '../components/ScreenContainer';
import EmptyState from '../components/EmptyState';
import colors from '../theme/colors';
import { useAuth } from '../hooks/useAuth';
import { DEMO_USER_ID } from '../lib/demoMode';
import { ParkingService } from '../services/parkingService';
import { QueueService } from '../services/QueueService';
import { formatTime } from '../utils/dateUtils';
import type { ParkingSessionWithProfile, ParkingQueueItemWithProfile } from '../types/database';

type ActionKind = 'park' | 'finish' | 'join' | 'leave' | null;

const FREE_GRADIENT = ['#16a34a', '#0d9488'] as const;
const OCCUPIED_GRADIENT = ['#dc2626', '#ea580c'] as const;

const AVATAR_PALETTE = ['#2563eb', '#7c3aed', '#0d9488', '#d97706', '#db2777', '#4f46e5'];

function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

/** mm:ss elapsed since startIso, ticking display for the live hero timer. */
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

  // Live-ticking clock for the hero timer — the one piece of the screen that
  // keeps moving on its own instead of only reacting to button presses.
  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session?.id]);

  // --- Entrance choreography: header → hero → actions → queue, staggered ---
  const enter = useRef({
    header: new Animated.Value(0),
    hero: new Animated.Value(0),
    actions: new Animated.Value(0),
    queue: new Animated.Value(0),
  }).current;

  useEffect(() => {
    if (loading) return;
    const cfg = { duration: 420, useNativeDriver: true, easing: Easing.out(Easing.cubic) };
    Animated.stagger(90, [
      Animated.timing(enter.header, { toValue: 1, ...cfg }),
      Animated.timing(enter.hero, { toValue: 1, ...cfg }),
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

  // Cross-fades the hero between the free and occupied gradients instead of
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
      <Animated.View style={[styles.header, riseStyle(enter.header)]}>
        <Text style={styles.greeting}>שלום {greetingName} 👋</Text>
        <Text style={styles.subheading}>מה מצב החנייה?</Text>
      </Animated.View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loading} />
      ) : (
        <>
          <Animated.View style={[styles.heroShadow, riseStyle(enter.hero)]}>
            <View style={styles.heroClip}>
              <Animated.View
                style={[
                  StyleSheet.absoluteFillObject,
                  { opacity: statusAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
                ]}
              >
                <LinearGradient colors={FREE_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
              </Animated.View>
              <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: statusAnim }]}>
                <LinearGradient colors={OCCUPIED_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
              </Animated.View>

              <View style={styles.heroContent}>
                <View style={styles.heroTitleRow}>
                  <Text style={styles.heroEmoji}>🅿️</Text>
                  <Text style={styles.heroTitle}>{session ? 'החנייה תפוסה' : 'החנייה פנויה!'}</Text>
                </View>

                {session ? (
                  <>
                    <Text style={styles.heroLine}>מחנה כרגע: {session.profile.full_name}</Text>
                    <View style={styles.liveRow}>
                      <Animated.View
                        style={[
                          styles.liveDot,
                          {
                            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
                            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] }) }],
                          },
                        ]}
                      />
                      <Text style={styles.heroTimer}>{elapsed} בחניה</Text>
                    </View>
                    {session.planned_end_time ? (
                      <View style={styles.heroPill}>
                        <Text style={styles.heroPillText}>עד {formatTime(session.planned_end_time)}</Text>
                      </View>
                    ) : null}
                  </>
                ) : (
                  <Text style={styles.heroLine}>המקום פנוי כרגע — קדימה!</Text>
                )}
              </View>
            </View>
          </Animated.View>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <Animated.View style={riseStyle(enter.actions)}>
            <AppCard style={styles.actionCard}>
              <Text style={styles.sectionLabel}>פעולות מהירות</Text>
              <View style={styles.actionRow}>
                {!session ? (
                  <AppButton
                    title="🚗 אני מחנה עכשיו"
                    onPress={() => runAction('park', () => ParkingService.startSession())}
                    disabled={pendingAction !== null}
                    style={styles.actionBtn}
                  />
                ) : null}

                {isMine ? (
                  <AppButton
                    title="✅ פיניתי את החנייה"
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
                    title="✋ בטל המתנה"
                    onPress={() => runAction('leave', () => QueueService.leaveQueue())}
                    variant="ghost"
                    disabled={pendingAction !== null}
                  />
                ) : (
                  <AppButton
                    title="⏳ אני ממתין לחנייה"
                    onPress={() => runAction('join', () => QueueService.joinQueue())}
                    variant="secondary"
                    disabled={pendingAction !== null}
                  />
                )
              ) : null}

              {pendingAction ? <ActivityIndicator color={colors.primary} style={styles.loading} /> : null}
            </AppCard>
          </Animated.View>

          <Animated.View style={riseStyle(enter.queue)}>
            <SectionTitle title={`תור ממתינים${queue.length > 0 ? ` (${queue.length})` : ''}`} />
            {queue.length === 0 ? (
              <EmptyState message="אין ממתינים כרגע" />
            ) : (
              <AppCard style={styles.queueCard}>
                {queue.map((item, index) => (
                  <View key={item.id} style={styles.queueItem}>
                    <View style={styles.queueLeft}>
                      <View style={[styles.avatar, { backgroundColor: avatarColor(item.user_id) }]}>
                        <Text style={styles.avatarText}>{item.profile.full_name.charAt(0)}</Text>
                      </View>
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
  heroShadow: {
    marginBottom: 18,
    borderRadius: 22,
    shadowColor: colors.cardShadow,
    shadowOpacity: 1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  heroClip: {
    borderRadius: 22,
    overflow: 'hidden',
    minHeight: 150,
  },
  heroContent: {
    padding: 20,
  },
  heroTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  heroEmoji: {
    fontSize: 22,
  },
  heroTitle: {
    fontSize: 23,
    fontWeight: '700',
    color: '#fff',
    writingDirection: 'rtl',
  },
  heroLine: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 15,
    writingDirection: 'rtl',
    textAlign: 'right',
    marginBottom: 4,
  },
  liveRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  liveDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  heroTimer: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  heroPill: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 10,
  },
  heroPillText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    writingDirection: 'rtl',
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
    paddingVertical: 6,
  },
  queueItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  queueLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  queueIndex: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  queueName: {
    color: colors.text,
    fontSize: 15,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
});

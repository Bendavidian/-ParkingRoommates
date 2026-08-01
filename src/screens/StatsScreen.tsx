import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import AppCard from '../components/AppCard';
import SectionTitle from '../components/SectionTitle';
import EmptyState from '../components/EmptyState';
import Avatar from '../components/Avatar';
import { StatisticsService } from '../services/StatisticsService';
import { formatMinutes } from '../utils/dateUtils';
import colors from '../theme/colors';
import fonts from '../theme/fonts';
import type { AllStats } from '../services/StatisticsService';

export default function StatsScreen() {
  const [stats, setStats] = useState<AllStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const result = await StatisticsService.getAllStats();
    if (result.ok) setStats(result.data);
    else setErrorMsg(result.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const maxMinutes = stats ? Math.max(1, ...stats.roommates.map((r) => r.totalMinutes)) : 1;

  return (
    <ScreenContainer>
      <SectionTitle title="סטטיסטיקות חנייה" subtitle="כמה זמן כל שותף השתמש בחניה" />

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loading} />
      ) : errorMsg ? (
        <Text style={styles.errorText}>{errorMsg}</Text>
      ) : !stats || stats.roommates.length === 0 ? (
        <EmptyState message="עדיין אין מספיק נתונים לסטטיסטיקה" />
      ) : (
        <>
          <AppCard style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{stats.totalSessionsAll}</Text>
                <Text style={styles.summaryLabel}>חניות סה"כ</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{formatMinutes(stats.totalMinutesAll)}</Text>
                <Text style={styles.summaryLabel}>זמן חניה סה"כ</Text>
              </View>
            </View>
          </AppCard>

          {stats.roommates.map((row) => {
            const ratio = row.totalMinutes / maxMinutes;
            return (
              <AppCard key={row.userId} style={styles.card}>
                <View style={styles.headerRow}>
                  <Avatar seed={row.userId} label={row.fullName} size={30} />
                  <View style={styles.headerText}>
                    <Text style={styles.name}>{row.fullName}</Text>
                    <Text style={styles.subline}>
                      {row.totalSessions} חניות · בממוצע {formatMinutes(row.averageMinutes)}
                    </Text>
                  </View>
                  <Text style={styles.totalValue}>{formatMinutes(row.totalMinutes)}</Text>
                </View>
                <View style={styles.progressBarBackground}>
                  <View style={[styles.progressBarFill, { width: `${Math.max(4, ratio * 100)}%` }]} />
                </View>
              </AppCard>
            );
          })}
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    marginTop: 24,
  },
  errorText: {
    fontFamily: fonts.bodySemiBold,
    color: colors.danger,
    fontSize: 14,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  summaryCard: {
    marginBottom: 16,
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentSoft,
  },
  summaryRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  summaryDivider: {
    width: 1,
    height: 34,
    backgroundColor: colors.borderStrong,
  },
  summaryValue: {
    fontFamily: fonts.monoBold,
    fontSize: 18,
    color: colors.accentStrong,
  },
  summaryLabel: {
    fontFamily: fonts.bodyRegular,
    fontSize: 12.5,
    color: colors.inkSoft,
  },
  card: {
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontFamily: fonts.bodyBold,
    color: colors.ink,
    fontSize: 15,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subline: {
    fontFamily: fonts.bodyRegular,
    color: colors.muted,
    fontSize: 12.5,
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  totalValue: {
    fontFamily: fonts.monoBold,
    color: colors.ink,
    fontSize: 14,
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
});

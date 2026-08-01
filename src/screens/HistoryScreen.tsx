import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import AppCard from '../components/AppCard';
import SectionTitle from '../components/SectionTitle';
import EmptyState from '../components/EmptyState';
import Avatar from '../components/Avatar';
import { ParkingService } from '../services/parkingService';
import { formatDateTime, formatTime, getDurationInMinutes, formatMinutes } from '../utils/dateUtils';
import colors from '../theme/colors';
import fonts from '../theme/fonts';
import type { ParkingSessionWithProfile } from '../types/database';

export default function HistoryScreen() {
  const [history, setHistory] = useState<ParkingSessionWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const result = await ParkingService.getHistory();
    if (result.ok) setHistory(result.data);
    else setErrorMsg(result.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  return (
    <ScreenContainer>
      <SectionTitle title="היסטוריית שימוש" subtitle="חניה קודמת של כל אחד מהשותפים" />

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loading} />
      ) : errorMsg ? (
        <Text style={styles.errorText}>{errorMsg}</Text>
      ) : history.length === 0 ? (
        <EmptyState message="עדיין אין היסטוריית חניה" />
      ) : (
        history.map((item) => {
          const minutes = getDurationInMinutes(item.start_time, item.actual_end_time ?? undefined);
          return (
            <AppCard key={item.id} style={styles.historyCard}>
              <View style={styles.row}>
                <View style={styles.left}>
                  <Avatar seed={item.user_id} label={item.profile.full_name} size={30} />
                  <View>
                    <Text style={styles.name}>{item.profile.full_name}</Text>
                    <Text style={styles.range}>
                      {formatDateTime(item.start_time)}
                      {item.actual_end_time ? ` – ${formatTime(item.actual_end_time)}` : ''}
                    </Text>
                  </View>
                </View>
                <Text style={styles.duration}>{formatMinutes(minutes)}</Text>
              </View>
              {item.status === 'cancelled' ? <Text style={styles.cancelledTag}>בוטלה</Text> : null}
            </AppCard>
          );
        })
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
  historyCard: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  name: {
    fontFamily: fonts.bodyBold,
    color: colors.ink,
    fontSize: 15,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  range: {
    fontFamily: fonts.bodyRegular,
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  duration: {
    fontFamily: fonts.monoBold,
    color: colors.accentStrong,
    fontSize: 13,
  },
  cancelledTag: {
    fontFamily: fonts.monoBold,
    color: colors.danger,
    fontSize: 11,
    letterSpacing: 0.5,
    marginTop: 8,
    textAlign: 'right',
  },
});

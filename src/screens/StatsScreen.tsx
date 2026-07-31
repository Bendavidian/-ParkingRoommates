import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import AppCard from '../components/AppCard';
import SectionTitle from '../components/SectionTitle';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

const stats = [
  { label: 'שבוע אחרון', values: [{ name: 'בן', hours: 12 }, { name: 'דני', hours: 9 }, { name: 'אורי', hours: 7 }] },
  { label: 'שבועיים אחרונים', values: [{ name: 'בן', hours: 22 }, { name: 'דני', hours: 18 }, { name: 'אורי', hours: 14 }] },
  { label: 'חודש אחרון', values: [{ name: 'בן', hours: 36 }, { name: 'דני', hours: 28 }, { name: 'אורי', hours: 20 }] },
];

export default function StatsScreen() {
  return (
    <ScreenContainer>
      <SectionTitle title="סטטיסטיקות חנייה" subtitle="הצגה חזותית של שעות החנייה" />
      {stats.map((item) => (
        <AppCard key={item.label} style={styles.card}>
          <Text style={styles.periodTitle}>{item.label}</Text>
          {item.values.map((row) => {
            const ratio = Math.min(row.hours / 36, 1);
            return (
              <View key={row.name} style={styles.statRow}>
                <View style={styles.statLabel}>
                  <Text style={styles.statName}>{row.name}</Text>
                  <Text style={styles.statValue}>{row.hours} שעות</Text>
                </View>
                <View style={styles.progressBarBackground}>
                  <View style={[styles.progressBarFill, { width: `${ratio * 100}%` }]} />
                </View>
              </View>
            );
          })}
        </AppCard>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  periodTitle: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.muted,
    marginBottom: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  statRow: {
    marginBottom: 16,
  },
  statLabel: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statName: {
    fontFamily: fonts.bodyBold,
    color: colors.ink,
    fontSize: 15,
    writingDirection: 'rtl',
  },
  statValue: {
    fontFamily: fonts.monoMedium,
    color: colors.muted,
    fontSize: 14,
    writingDirection: 'rtl',
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

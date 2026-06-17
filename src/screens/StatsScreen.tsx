import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import AppCard from '../components/AppCard';
import SectionTitle from '../components/SectionTitle';
import colors from '../theme/colors';

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
    marginBottom: 18,
  },
  periodTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
    color: colors.text,
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
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  statValue: {
    color: colors.muted,
    fontSize: 15,
    writingDirection: 'rtl',
  },
  progressBarBackground: {
    width: '100%',
    height: 10,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
});

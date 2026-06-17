import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import AppCard from '../components/AppCard';
import colors from '../theme/colors';

const history = [
  'בן חנה מ־18:30 עד 22:30',
  'דני חנה מ־09:00 עד 12:00',
];

export default function HistoryScreen() {
  return (
    <ScreenContainer>
      <Text style={styles.title}>היסטוריית שימוש</Text>
      <Text style={styles.subtitle}>חניה קודמת של כל אחד מהשותפים</Text>

      {history.map((item) => (
        <AppCard key={item} style={styles.historyCard}>
          <Text style={styles.historyText}>{item}</Text>
        </AppCard>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    marginBottom: 18,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  historyCard: {
    marginBottom: 14,
  },
  historyText: {
    color: colors.text,
    fontSize: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});

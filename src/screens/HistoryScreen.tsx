import React from 'react';
import { Text, StyleSheet } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import AppCard from '../components/AppCard';
import SectionTitle from '../components/SectionTitle';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

const history = [
  'בן חנה מ־18:30 עד 22:30',
  'דני חנה מ־09:00 עד 12:00',
];

export default function HistoryScreen() {
  return (
    <ScreenContainer>
      <SectionTitle title="היסטוריית שימוש" subtitle="חניה קודמת של כל אחד מהשותפים" />

      {history.map((item) => (
        <AppCard key={item} style={styles.historyCard}>
          <Text style={styles.historyText}>{item}</Text>
        </AppCard>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  historyCard: {
    marginBottom: 14,
  },
  historyText: {
    fontFamily: fonts.bodySemiBold,
    color: colors.ink,
    fontSize: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});

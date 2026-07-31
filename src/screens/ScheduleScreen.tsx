import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import AppCard from '../components/AppCard';
import AppButton from '../components/AppButton';
import SectionTitle from '../components/SectionTitle';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

const requests = [
  'ראשון 20:00 עד שני 08:00',
  'שלישי 18:00 עד 23:00',
];

export default function ScheduleScreen() {
  return (
    <ScreenContainer>
      <SectionTitle title="תכנון חנייה" subtitle="נהל בקשות עתידיות בקלות" />
      <AppButton title="הוסף בקשה עתידית" onPress={() => {}} showArrow style={styles.addButton} />

      {requests.map((item) => (
        <AppCard key={item} style={styles.requestCard}>
          <Text style={styles.requestText}>{item}</Text>
        </AppCard>
      ))}

      <View style={styles.noteBox}>
        <Text style={styles.noteTitle}>טיפ מהמערכת</Text>
        <Text style={styles.noteText}>תכנן מראש כדי להפחית חיכוך ותורים לחנייה המשותפת.</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  addButton: {
    marginBottom: 22,
  },
  requestCard: {
    marginBottom: 14,
  },
  requestText: {
    fontFamily: fonts.bodySemiBold,
    color: colors.ink,
    fontSize: 16,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  noteBox: {
    marginTop: 24,
    padding: 18,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteTitle: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.accentStrong,
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  noteText: {
    fontFamily: fonts.bodyRegular,
    color: colors.inkSoft,
    fontSize: 14,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});

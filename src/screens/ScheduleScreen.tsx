import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import AppCard from '../components/AppCard';
import AppButton from '../components/AppButton';
import colors from '../theme/colors';

const requests = [
  'ראשון 20:00 עד שני 08:00',
  'שלישי 18:00 עד 23:00',
];

export default function ScheduleScreen() {
  return (
    <ScreenContainer>
      <Text style={styles.title}>תכנון חנייה</Text>
      <Text style={styles.subtitle}>נהל בקשות עתידיות בקלות</Text>
      <AppButton title="הוסף בקשה עתידית" onPress={() => {}} variant="secondary" style={styles.addButton} />

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
  addButton: {
    marginBottom: 22,
  },
  requestCard: {
    marginBottom: 14,
  },
  requestText: {
    color: colors.text,
    fontSize: 16,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  noteBox: {
    marginTop: 24,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  noteTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  noteText: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});

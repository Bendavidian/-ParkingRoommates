import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AppCard from '../components/AppCard';
import AppButton from '../components/AppButton';
import SectionTitle from '../components/SectionTitle';
import ScreenContainer from '../components/ScreenContainer';
import StatusBadge from '../components/StatusBadge';
import colors from '../theme/colors';

const queue = ['דני', 'אורי'];

export default function HomeScreen() {
  const parkingOccupied = true;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.greeting}>שלום בן 👋</Text>
        <Text style={styles.subheading}>מה מצב החנייה?</Text>
      </View>

      <AppCard style={styles.parkingCard}>
        <View style={styles.statusRow}>
          <Text style={styles.cardTitle}>
            {parkingOccupied ? 'החנייה תפוסה' : 'החנייה פנויה'}
          </Text>
          <StatusBadge variant={parkingOccupied ? 'danger' : 'success'} label={parkingOccupied ? 'תפוסה' : 'פנוי'} />
        </View>

        {parkingOccupied ? (
          <>
            <Text style={styles.cardText}>מחנה כרגע: בן</Text>
            <Text style={styles.cardText}>עד שעה: 22:30</Text>
          </>
        ) : (
          <Text style={styles.cardText}>המשתמש האחרון שחרר את המקום לפני דקה</Text>
        )}
      </AppCard>

      <AppCard style={styles.actionCard}>
        <Text style={styles.sectionLabel}>פעולות מהירות</Text>
        <View style={styles.actionRow}>
          <AppButton title="אני מחנה עכשיו" onPress={() => {}} style={styles.actionBtn} />
          <AppButton title="פיניתי את החנייה" onPress={() => {}} variant="success" style={styles.actionBtn} />
        </View>
        <AppButton title="אני ממתין לחנייה" onPress={() => {}} variant="secondary" />
      </AppCard>

      <SectionTitle title="תור ממתינים" />
      <AppCard style={styles.queueCard}>
        {queue.map((name, index) => (
          <View key={name} style={styles.queueItem}>
            <Text style={styles.queueIndex}>{index + 1}.</Text>
            <Text style={styles.queueName}>{name}</Text>
          </View>
        ))}
      </AppCard>
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
  parkingCard: {
    marginBottom: 18,
  },
  statusRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    writingDirection: 'rtl',
  },
  cardText: {
    color: colors.muted,
    fontSize: 15,
    marginBottom: 6,
    writingDirection: 'rtl',
    textAlign: 'right',
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
    paddingVertical: 16,
  },
  queueItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  queueIndex: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  queueName: {
    color: colors.text,
    fontSize: 15,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
});

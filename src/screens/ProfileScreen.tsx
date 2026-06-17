import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import AppButton from '../components/AppButton';
import AppCard from '../components/AppCard';
import ScreenContainer from '../components/ScreenContainer';
import colors from '../theme/colors';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? 'בן דוד';
  const email = user?.email ?? 'bendben13@gmail.com';

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>הפרופיל שלי</Text>
      <Text style={styles.subtitle}>פרטים אישיים וניהול חשבון</Text>

      <AppCard style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{fullName.charAt(0)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.fieldLabel}>שם</Text>
          <Text style={styles.fieldValue}>{fullName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.fieldLabel}>אימייל</Text>
          <Text style={styles.fieldValue}>{email}</Text>
        </View>
      </AppCard>

      <AppButton title="הגדרות" onPress={() => {}} variant="secondary" style={styles.button} />
      <AppButton
        title={signingOut ? 'מתנתק...' : 'התנתקות'}
        onPress={handleSignOut}
        variant="danger"
        disabled={signingOut}
        style={styles.button}
      />
      {signingOut ? <ActivityIndicator color={colors.danger} style={styles.loading} /> : null}
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
  profileCard: {
    paddingVertical: 24,
    marginBottom: 22,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    alignSelf: 'flex-end',
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  fieldLabel: {
    color: colors.muted,
    fontSize: 15,
    writingDirection: 'rtl',
  },
  fieldValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  button: {
    marginBottom: 14,
  },
  loading: {
    marginTop: 8,
  },
});

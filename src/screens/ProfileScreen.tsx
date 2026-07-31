import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import AppButton from '../components/AppButton';
import AppCard from '../components/AppCard';
import ScreenContainer from '../components/ScreenContainer';
import SectionTitle from '../components/SectionTitle';
import Avatar from '../components/Avatar';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

export default function ProfileScreen() {
  const { user, isDemoUser, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const fullName = isDemoUser
    ? 'משתמש הדגמה'
    : ((user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? '');
  const email = isDemoUser ? 'demo@example.com' : (user?.email ?? '');

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
  }

  return (
    <ScreenContainer>
      <SectionTitle title="הפרופיל שלי" subtitle="פרטים אישיים וניהול חשבון" />

      <AppCard style={styles.profileCard}>
        <Avatar seed={user?.id ?? 'demo'} label={fullName || '?'} size={68} style={styles.avatar} />
        <View style={styles.infoRow}>
          <Text style={styles.fieldLabel}>שם</Text>
          <Text style={styles.fieldValue}>{fullName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.fieldLabel}>אימייל</Text>
          <Text style={styles.fieldValue}>{email}</Text>
        </View>
      </AppCard>

      <AppButton title="הגדרות" onPress={() => {}} variant="outline" style={styles.button} />
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
  profileCard: {
    paddingVertical: 24,
    marginBottom: 22,
  },
  avatar: {
    marginBottom: 18,
    alignSelf: 'flex-end',
  },
  infoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  fieldLabel: {
    fontFamily: fonts.bodyRegular,
    color: colors.muted,
    fontSize: 15,
    writingDirection: 'rtl',
  },
  fieldValue: {
    fontFamily: fonts.bodySemiBold,
    color: colors.ink,
    fontSize: 15,
    writingDirection: 'rtl',
  },
  button: {
    marginBottom: 14,
  },
  loading: {
    marginTop: 8,
  },
});

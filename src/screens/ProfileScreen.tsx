import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Share, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../hooks/useAuth';
import AppButton from '../components/AppButton';
import AppCard from '../components/AppCard';
import ScreenContainer from '../components/ScreenContainer';
import SectionTitle from '../components/SectionTitle';
import Avatar from '../components/Avatar';
import { ApartmentService } from '../services/ApartmentService';
import colors from '../theme/colors';
import fonts from '../theme/fonts';
import type { Apartment } from '../types/database';

export default function ProfileScreen() {
  const { user, isDemoUser, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [copied, setCopied] = useState(false);

  const fullName = isDemoUser
    ? 'משתמש הדגמה'
    : ((user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? '');
  const email = isDemoUser ? 'demo@example.com' : (user?.email ?? '');

  const loadApartment = useCallback(async () => {
    const result = await ApartmentService.getMyApartment();
    if (result.ok) setApartment(result.data);
  }, []);

  useEffect(() => {
    loadApartment();
  }, [loadApartment]);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
  }

  async function handleCopyCode() {
    if (!apartment) return;
    await Clipboard.setStringAsync(apartment.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function handleShareCode() {
    if (!apartment) return;
    await Share.share({
      message: `הצטרף לדירה שלי באפליקציית חניית השותפים! קוד ההזמנה: ${apartment.invite_code}`,
    });
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

      {apartment ? (
        <AppCard style={styles.apartmentCard}>
          <Text style={styles.panelLabel}>הדירה שלי</Text>
          <Text style={styles.apartmentName}>{apartment.name}</Text>

          <Text style={[styles.fieldLabel, styles.codeLabel]}>קוד הזמנה לשכנים</Text>
          <TouchableOpacity onPress={handleCopyCode} style={styles.codePill}>
            <Text style={styles.codeText}>{apartment.invite_code}</Text>
            <Text style={styles.copyHint}>{copied ? 'הועתק ✓' : 'העתק'}</Text>
          </TouchableOpacity>

          <AppButton title="שתף קוד הזמנה" onPress={handleShareCode} showArrow style={styles.shareBtn} />
        </AppCard>
      ) : null}

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
    marginBottom: 16,
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
  apartmentCard: {
    marginBottom: 22,
  },
  panelLabel: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.muted,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 6,
  },
  apartmentName: {
    fontFamily: fonts.displayBold,
    fontSize: 19,
    color: colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 16,
  },
  codeLabel: {
    marginBottom: 8,
    textAlign: 'right',
  },
  codePill: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  codeText: {
    fontFamily: fonts.monoBold,
    fontSize: 18,
    letterSpacing: 2,
    color: colors.accentStrong,
  },
  copyHint: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12.5,
    color: colors.accentStrong,
  },
  shareBtn: {
    marginBottom: 0,
  },
  button: {
    marginBottom: 14,
  },
  loading: {
    marginTop: 8,
  },
});

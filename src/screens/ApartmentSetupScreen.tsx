import React, { useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { ApartmentService } from '../services/ApartmentService';
import AppTextInput from '../components/AppTextInput';
import AppButton from '../components/AppButton';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

type Mode = 'create' | 'join';

export default function ApartmentSetupScreen() {
  const { refreshApartmentId, signOut } = useAuth();

  const [mode, setMode] = useState<Mode>('create');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function switchMode(next: Mode) {
    setMode(next);
    setError('');
  }

  async function handleSubmit() {
    setError('');

    if (mode === 'create') {
      if (!name.trim()) {
        setError('יש להזין שם לדירה');
        return;
      }
      setSubmitting(true);
      const result = await ApartmentService.createApartment(name.trim());
      if (!result.ok) setError(result.error);
      else await refreshApartmentId();
      setSubmitting(false);
    } else {
      if (!code.trim()) {
        setError('יש להזין קוד הזמנה');
        return;
      }
      setSubmitting(true);
      const result = await ApartmentService.joinByInviteCode(code.trim());
      if (!result.ok) setError('קוד ההזמנה שגוי, בדוק ונסה שוב');
      else await refreshApartmentId();
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.masthead}>
          <View style={styles.logoTile}>
            <Text style={styles.logoEmoji}>🅿️</Text>
          </View>
          <Text style={styles.eyebrow}>PARKING · ROOMMATES</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>עוד צעד אחד</Text>
          <Text style={styles.subtitle}>צור דירה חדשה או הצטרף לדירה קיימת עם קוד הזמנה</Text>

          <View style={styles.toggleRow}>
            <TouchableOpacity style={[styles.toggleBtn, mode === 'create' && styles.toggleBtnActive]} onPress={() => switchMode('create')}>
              <Text style={[styles.toggleText, mode === 'create' && styles.toggleTextActive]}>דירה חדשה</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggleBtn, mode === 'join' && styles.toggleBtnActive]} onPress={() => switchMode('join')}>
              <Text style={[styles.toggleText, mode === 'join' && styles.toggleTextActive]}>הצטרפות עם קוד</Text>
            </TouchableOpacity>
          </View>

          {mode === 'create' ? (
            <AppTextInput
              placeholder="שם הדירה (למשל: הבית של בן)"
              autoCapitalize="none"
              value={name}
              onChangeText={setName}
              editable={!submitting}
              style={styles.input}
            />
          ) : (
            <AppTextInput
              placeholder="קוד הזמנה"
              autoCapitalize="characters"
              autoCorrect={false}
              value={code}
              onChangeText={setCode}
              editable={!submitting}
              style={styles.input}
            />
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <AppButton
            title={mode === 'create' ? 'צור דירה' : 'הצטרף לדירה'}
            onPress={handleSubmit}
            disabled={submitting}
            showArrow
            style={styles.submitBtn}
          />

          <AppButton title="התנתקות" onPress={signOut} variant="outline" disabled={submitting} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  masthead: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'center',
    marginBottom: 20,
  },
  logoTile: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.logoInk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 17,
  },
  eyebrow: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.muted,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontFamily: fonts.displayExtraBold,
    fontSize: 24,
    color: colors.ink,
    marginBottom: 6,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontFamily: fonts.bodyRegular,
    color: colors.muted,
    fontSize: 14.5,
    marginBottom: 22,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  toggleRow: {
    flexDirection: 'row-reverse',
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  toggleBtnActive: {
    backgroundColor: colors.accent,
  },
  toggleText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13.5,
    color: colors.accent,
    writingDirection: 'rtl',
  },
  toggleTextActive: {
    color: '#fff',
  },
  input: {
    marginBottom: 14,
  },
  errorText: {
    fontFamily: fonts.bodySemiBold,
    color: colors.danger,
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  submitBtn: {
    marginBottom: 12,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import AppTextInput from '../components/AppTextInput';
import AppButton from '../components/AppButton';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

type Mode = 'login' | 'signup';


export default function LoginScreen() {
  const { signIn, signUp, demoSignIn } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  function resetForm() {
    setFullName('');
    setEmail('');
    setPassword('');
    setError('');
    setInfo('');
  }

  function switchMode(next: Mode) {
    setMode(next);
    resetForm();
  }

  async function handleSubmit() {
    setError('');
    setInfo('');

    if (!email.trim() || !password.trim()) {
      setError('יש למלא את כל השדות');
      return;
    }
    if (mode === 'signup' && !fullName.trim()) {
      setError('יש למלא שם מלא');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        const { hebrewError } = await signIn(email.trim(), password);
        if (hebrewError) setError(hebrewError);
        // On success, onAuthStateChange fires → RootNavigator switches to Main automatically
      } else {
        const { hebrewError, needsConfirmation } = await signUp(
          email.trim(),
          password,
          fullName.trim(),
        );
        if (hebrewError) {
          setError(hebrewError);
        } else if (needsConfirmation) {
          setInfo('החשבון נוצר! בדוק את האימייל שלך ואמת אותו לפני ההתחברות.');
        }
        // If no confirmation needed, onAuthStateChange fires → navigates automatically
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleDemo() {
    demoSignIn();
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.masthead}>
          <View style={styles.logoTile}>
            <Text style={styles.logoEmoji}>🅿️</Text>
          </View>
          <Text style={styles.eyebrow}>PARKING · ROOMMATES</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>חניית השותפים</Text>
          <Text style={styles.subtitle}>ניהול חנייה משותפת בזמן אמת</Text>

          {/* Mode toggle */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'login' && styles.toggleBtnActive]}
              onPress={() => switchMode('login')}
            >
              <Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>
                התחברות
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'signup' && styles.toggleBtnActive]}
              onPress={() => switchMode('signup')}
            >
              <Text style={[styles.toggleText, mode === 'signup' && styles.toggleTextActive]}>
                הרשמה
              </Text>
            </TouchableOpacity>
          </View>

          {/* Full name — signup only */}
          {mode === 'signup' && (
            <AppTextInput
              placeholder="שם מלא"
              autoCapitalize="words"
              autoCorrect={false}
              value={fullName}
              onChangeText={setFullName}
              editable={!submitting}
              style={styles.input}
            />
          )}

          <AppTextInput
            placeholder="אימייל"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            editable={!submitting}
            style={styles.input}
          />

          <AppTextInput
            placeholder="סיסמה"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
            editable={!submitting}
            style={styles.input}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {info ? <Text style={styles.infoText}>{info}</Text> : null}

          <AppButton
            title={mode === 'login' ? 'התחברות' : 'יצירת חשבון'}
            onPress={handleSubmit}
            disabled={submitting}
            showArrow
            style={styles.submitBtn}
          />

          <AppButton
            title="כניסה למצב הדגמה"
            onPress={handleDemo}
            variant="outline"
            disabled={submitting}
          />
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
    fontSize: 26,
    color: colors.ink,
    marginBottom: 6,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontFamily: fonts.bodyRegular,
    color: colors.muted,
    fontSize: 15,
    marginBottom: 24,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  toggleRow: {
    flexDirection: 'row-reverse',
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 22,
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
    fontSize: 14,
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
  infoText: {
    fontFamily: fonts.bodySemiBold,
    color: colors.accentStrong,
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  submitBtn: {
    marginBottom: 12,
  },
});

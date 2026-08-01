import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import AppCard from '../components/AppCard';
import AppButton from '../components/AppButton';
import AppTextInput from '../components/AppTextInput';
import SectionTitle from '../components/SectionTitle';
import EmptyState from '../components/EmptyState';
import Avatar from '../components/Avatar';
import { useAuth } from '../hooks/useAuth';
import { DEMO_USER_ID } from '../lib/demoMode';
import { RequestService } from '../services/RequestService';
import { formatDateTime, formatTime } from '../utils/dateUtils';
import colors from '../theme/colors';
import fonts from '../theme/fonts';
import type { ParkingRequestWithProfile } from '../types/database';

const DAY_OPTIONS = [
  { label: 'היום', offset: 0 },
  { label: 'מחר', offset: 1 },
  { label: 'מחרתיים', offset: 2 },
];
const START_HOUR_OPTIONS = [8, 12, 16, 18, 20, 22];
const DURATION_OPTIONS = [
  { label: 'שעה', hours: 1 },
  { label: '2 שעות', hours: 2 },
  { label: '4 שעות', hours: 4 },
  { label: 'כל הלילה', hours: 'overnight' as const },
];

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

function buildRange(dayOffset: number, startHour: number, duration: number | 'overnight') {
  const start = new Date();
  start.setDate(start.getDate() + dayOffset);
  start.setHours(startHour, 0, 0, 0);

  const end = new Date(start);
  if (duration === 'overnight') {
    end.setDate(end.getDate() + 1);
    end.setHours(8, 0, 0, 0);
  } else {
    end.setHours(end.getHours() + duration);
  }
  return { start, end };
}

export default function ScheduleScreen() {
  const { user, isDemoUser } = useAuth();
  const currentUserId = isDemoUser ? DEMO_USER_ID : user?.id ?? null;

  const [requests, setRequests] = useState<ParkingRequestWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [dayOffset, setDayOffset] = useState(1);
  const [startHour, setStartHour] = useState(18);
  const [duration, setDuration] = useState<number | 'overnight'>(2);
  const [note, setNote] = useState('');

  const loadData = useCallback(async () => {
    const result = await RequestService.getUpcomingRequests();
    if (result.ok) setRequests(result.data);
    else setErrorMsg(result.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  async function handleAdd() {
    setErrorMsg(null);
    setBusy(true);
    const { start, end } = buildRange(dayOffset, startHour, duration);
    const result = await RequestService.createRequest(start.toISOString(), end.toISOString(), note.trim() || undefined);
    if (!result.ok) {
      setErrorMsg(result.error);
    } else {
      setFormOpen(false);
      setNote('');
      await loadData();
    }
    setBusy(false);
  }

  async function handleCancel(id: string) {
    setErrorMsg(null);
    setBusy(true);
    const result = await RequestService.cancelRequest(id);
    if (!result.ok) setErrorMsg(result.error);
    await loadData();
    setBusy(false);
  }

  return (
    <ScreenContainer>
      <SectionTitle title="תכנון חנייה" subtitle="נהל בקשות עתידיות בקלות" />

      {!formOpen ? (
        <AppButton
          title="הוסף בקשה עתידית"
          onPress={() => setFormOpen(true)}
          showArrow
          disabled={busy}
          style={styles.openFormButton}
        />
      ) : (
        <AppCard style={styles.formCard}>
          <Text style={styles.panelLabel}>יום</Text>
          <View style={styles.chipRow}>
            {DAY_OPTIONS.map((opt) => (
              <Chip key={opt.offset} label={opt.label} selected={dayOffset === opt.offset} onPress={() => setDayOffset(opt.offset)} />
            ))}
          </View>

          <Text style={[styles.panelLabel, styles.panelLabelSpaced]}>שעת התחלה</Text>
          <View style={styles.chipRow}>
            {START_HOUR_OPTIONS.map((hour) => (
              <Chip key={hour} label={`${hour}:00`} selected={startHour === hour} onPress={() => setStartHour(hour)} />
            ))}
          </View>

          <Text style={[styles.panelLabel, styles.panelLabelSpaced]}>משך</Text>
          <View style={styles.chipRow}>
            {DURATION_OPTIONS.map((opt) => (
              <Chip key={opt.label} label={opt.label} selected={duration === opt.hours} onPress={() => setDuration(opt.hours)} />
            ))}
          </View>

          <AppTextInput
            placeholder="הערה (אופציונלי)"
            value={note}
            onChangeText={setNote}
            editable={!busy}
            style={styles.noteInput}
          />

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <View style={styles.formActions}>
            <AppButton title="הוסף בקשה" onPress={handleAdd} showArrow disabled={busy} style={styles.formActionBtn} />
            <AppButton
              title="ביטול"
              onPress={() => {
                setFormOpen(false);
                setErrorMsg(null);
              }}
              variant="outline"
              disabled={busy}
              style={styles.formActionBtn}
            />
          </View>
          {busy ? <ActivityIndicator color={colors.accent} style={styles.loading} /> : null}
        </AppCard>
      )}

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loading} />
      ) : errorMsg && !formOpen ? (
        <Text style={styles.errorText}>{errorMsg}</Text>
      ) : requests.length === 0 ? (
        <EmptyState message="אין בקשות עתידיות כרגע" />
      ) : (
        requests.map((item) => (
          <AppCard key={item.id} style={styles.requestCard}>
            <View style={styles.requestRow}>
              <View style={styles.requestLeft}>
                <Avatar seed={item.user_id} label={item.profile.full_name} size={30} />
                <View>
                  <Text style={styles.requestName}>{item.profile.full_name}</Text>
                  <Text style={styles.requestRange}>
                    {formatDateTime(item.start_time)} – {formatTime(item.end_time)}
                  </Text>
                  {item.note ? <Text style={styles.requestNote}>{item.note}</Text> : null}
                </View>
              </View>
              {item.user_id === currentUserId ? (
                <TouchableOpacity onPress={() => handleCancel(item.id)} disabled={busy}>
                  <Text style={styles.cancelLink}>בטל</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </AppCard>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    marginTop: 16,
  },
  errorText: {
    fontFamily: fonts.bodySemiBold,
    color: colors.danger,
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  openFormButton: {
    marginBottom: 22,
  },
  formCard: {
    marginBottom: 22,
  },
  panelLabel: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.muted,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 10,
  },
  panelLabelSpaced: {
    marginTop: 16,
  },
  chipRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13.5,
    color: colors.ink,
  },
  chipTextSelected: {
    color: '#fff',
  },
  noteInput: {
    marginTop: 16,
  },
  formActions: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginTop: 16,
  },
  formActionBtn: {
    flex: 1,
  },
  requestCard: {
    marginBottom: 12,
  },
  requestRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  requestLeft: {
    flexDirection: 'row-reverse',
    gap: 10,
    flex: 1,
  },
  requestName: {
    fontFamily: fonts.bodyBold,
    color: colors.ink,
    fontSize: 15,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  requestRange: {
    fontFamily: fonts.bodyRegular,
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  requestNote: {
    fontFamily: fonts.bodyRegular,
    color: colors.inkSoft,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  cancelLink: {
    fontFamily: fonts.monoBold,
    color: colors.danger,
    fontSize: 12,
    letterSpacing: 0.3,
    paddingTop: 4,
  },
});

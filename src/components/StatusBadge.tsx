import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import colors from '../theme/colors';

type StatusBadgeProps = {
  label: string;
  variant?: 'success' | 'danger' | 'primary' | 'secondary';
  style?: ViewStyle;
};

export default function StatusBadge({ label, variant = 'primary', style }: StatusBadgeProps) {
  const backgroundColor =
    variant === 'success'
      ? '#dcfce7'
      : variant === 'danger'
      ? '#fee2e2'
      : variant === 'secondary'
      ? '#e0e7ff'
      : '#dbeafe';

  const textColor =
    variant === 'success'
      ? '#166534'
      : variant === 'danger'
      ? '#991b1b'
      : variant === 'secondary'
      ? '#3730a3'
      : '#1d4ed8';

  return (
    <View style={[styles.badge, { backgroundColor }, style]}>
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    alignSelf: 'flex-end',
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
});

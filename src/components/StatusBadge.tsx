import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

type StatusBadgeProps = {
  label: string;
  variant?: 'accent' | 'danger';
  style?: ViewStyle;
};

export default function StatusBadge({ label, variant = 'accent', style }: StatusBadgeProps) {
  const backgroundColor = variant === 'danger' ? colors.danger : colors.accent;

  return (
    <View style={[styles.badge, { backgroundColor }, style]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: 'flex-end',
  },
  text: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: '#fff',
    writingDirection: 'rtl',
  },
});

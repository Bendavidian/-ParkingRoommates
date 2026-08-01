import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import colors from '../theme/colors';

type AppCardProps = {
  children: ReactNode;
  style?: ViewStyle;
};

export default function AppCard({ children, style }: AppCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    shadowColor: colors.cardShadow,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
});

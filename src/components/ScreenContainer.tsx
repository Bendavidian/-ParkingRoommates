import React, { ReactNode } from 'react';
import { StyleSheet, ScrollView, ViewStyle } from 'react-native';
import colors from '../theme/colors';
import spacing from '../theme/spacing';

type ScreenContainerProps = {
  children: ReactNode;
  style?: ViewStyle;
};

export default function ScreenContainer({ children, style }: ScreenContainerProps) {
  return (
    <ScrollView contentContainerStyle={[styles.container, style]}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
    direction: 'rtl',
  },
});

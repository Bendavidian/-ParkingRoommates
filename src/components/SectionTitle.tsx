import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';
import typography from '../theme/typography';

type SectionTitleProps = {
  title: string;
  subtitle?: string;
};

export default function SectionTitle({ title, subtitle }: SectionTitleProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 18,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: typography.strong,
    textAlign: 'right',
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.body,
    marginTop: 4,
    textAlign: 'right',
  },
});

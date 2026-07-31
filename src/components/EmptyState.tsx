import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

export default function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 22,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginTop: 16,
    direction: 'rtl',
  },
  text: {
    color: colors.muted,
    fontFamily: fonts.bodyRegular,
    fontSize: 14.5,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});

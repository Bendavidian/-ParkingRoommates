import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';

export default function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginTop: 16,
    direction: 'rtl',
  },
  text: {
    color: colors.muted,
    fontSize: 15,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import fonts from '../theme/fonts';

const PALETTE = ['#0f9d6b', '#0a7350', '#2563eb', '#7c3aed', '#d97706', '#4f46e5'];

/** Deterministic accent color per id/name, so the same person always gets the same avatar color. */
function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

type AvatarProps = {
  seed: string;
  label: string;
  size?: number;
  style?: ViewStyle;
};

export default function Avatar({ seed, label, size = 32, style }: AvatarProps) {
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size * 0.32, backgroundColor: colorFor(seed) },
        style,
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.42 }]}>{label.charAt(0)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: fonts.displayBold,
    color: '#fff',
  },
});

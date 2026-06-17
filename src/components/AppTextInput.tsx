import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import colors from '../theme/colors';

type AppTextInputProps = TextInputProps & {
  label?: string;
};

export default function AppTextInput({ label, style, ...rest }: AppTextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.placeholder}
      style={[styles.input, style]}
      textAlign="right"
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
  },
});

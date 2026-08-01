import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
} from 'react-native';
import colors from '../theme/colors';

type AppButtonProps = {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled,
  style,
  textStyle,
}: AppButtonProps) {
  const backgroundColor =
    variant === 'primary'
      ? colors.primary
      : variant === 'secondary'
      ? colors.secondary
      : variant === 'danger'
      ? colors.danger
      : variant === 'success'
      ? colors.success
      : 'transparent';

  const color = variant === 'ghost' ? colors.text : '#fff';
  const borderColor = variant === 'ghost' ? colors.border : 'transparent';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        { backgroundColor, borderColor, opacity: disabled ? 0.6 : 1 },
        style,
      ]}
    >
      <Text style={[styles.text, { color }, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});

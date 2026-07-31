import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Animated,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
} from 'react-native';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

type AppButtonProps = {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  /** solid = filled accent pill, outline = bordered pill, danger = filled red pill (destructive actions only). */
  variant?: 'solid' | 'outline' | 'danger';
  /** Trailing arrow, for the one primary action a screen leads to. */
  showArrow?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export default function AppButton({
  title,
  onPress,
  variant = 'solid',
  showArrow = false,
  disabled,
  style,
  textStyle,
}: AppButtonProps) {
  // Press feedback is a scale spring on this inner layer rather than
  // TouchableOpacity's built-in fade — pairs better with the pill fills.
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  }

  function handlePressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  }

  const backgroundColor =
    variant === 'solid' ? colors.accent : variant === 'danger' ? colors.danger : 'transparent';
  const color = variant === 'outline' ? colors.ink : '#fff';
  const borderColor = variant === 'outline' ? colors.borderStrong : 'transparent';

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={style}
    >
      <Animated.View
        style={[
          styles.button,
          { backgroundColor, borderColor, opacity: disabled ? 0.55 : 1, transform: [{ scale }] },
        ]}
      >
        <Text style={[styles.text, { color }, textStyle]}>{title}</Text>
        {showArrow ? <Text style={[styles.arrow, { color }]}>←</Text> : null}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  text: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  arrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
});

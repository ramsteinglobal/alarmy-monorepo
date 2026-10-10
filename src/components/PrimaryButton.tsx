import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { COLORS, FONT, RADIUS } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'accent' | 'dark' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
};

export default function PrimaryButton({
  label,
  onPress,
  variant = 'accent',
  disabled = false,
  loading = false,
  accessibilityHint,
}: Props) {
  const inactive = disabled || loading;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      activeOpacity={0.85}
      disabled={inactive}
      onPress={onPress}
      style={[styles.base, styles[variant], inactive && styles.inactive]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? COLORS.text : COLORS.onDark} />
      ) : (
        <Text style={[styles.text, variant === 'ghost' && styles.ghostText]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: RADIUS.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  accent: { backgroundColor: COLORS.accent },
  dark: { backgroundColor: COLORS.dark },
  ghost: { backgroundColor: 'transparent' },
  inactive: { opacity: 0.5 },
  text: { fontSize: FONT.bodyLg, fontWeight: '700', letterSpacing: 0.5, color: COLORS.onDark },
  ghostText: { color: COLORS.muted, fontWeight: '600' },
});

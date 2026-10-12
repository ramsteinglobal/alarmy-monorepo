import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { FONT, RADIUS, type ThemeColors } from '../theme';
import { useThemeColors } from '../store/ThemeContext';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'accent' | 'dark' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
  accessibilityLabel?: string;
};

export default function PrimaryButton({
  label,
  onPress,
  variant = 'accent',
  disabled = false,
  loading = false,
  accessibilityHint,
  accessibilityLabel,
}: Props) {
  const inactive = disabled || loading;
  const colors = useThemeColors();
  const styles = createStyles(colors);
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      activeOpacity={0.85}
      disabled={inactive}
      onPress={onPress}
      style={[styles.base, styles[variant], inactive && styles.inactive]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? colors.text : colors.onDark} />
      ) : (
        <Text style={[styles.text, variant === 'ghost' && styles.ghostText]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    base: {
      minHeight: 54,
      borderRadius: RADIUS.md + 2,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    accent: { backgroundColor: colors.accent },
    dark: { backgroundColor: colors.dark },
    ghost: { backgroundColor: 'transparent' },
    inactive: { opacity: 0.5 },
    text: { fontSize: FONT.bodyLg, fontWeight: '700', letterSpacing: 0.5, color: colors.onDark },
    ghostText: { color: colors.text, fontWeight: '600' },
  });

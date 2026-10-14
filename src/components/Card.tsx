import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { RADIUS, SPACING, type ThemeColors } from '../theme';
import { useThemeColors } from '../store/ThemeContext';

type Props = { children: React.ReactNode; style?: ViewStyle };

export default function Card({ children, style }: Props) {
  const styles = createStyles(useThemeColors());
  return <View style={[styles.card, style]}>{children}</View>;
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      borderWidth: 1,
      borderColor: colors.divider,
    },
  });

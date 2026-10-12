import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { FONT, lightColors, SPACING, type ThemeColors } from '../theme';
import { useThemeColors } from '../store/ThemeContext';
import Card from '../components/Card';

type Props = {
  label?: string;
  icon?: string;
  title?: string;
  children?: React.ReactNode;
  hint?: string;
};

/** Shared "prompt" card at the top of every mission. */
export default function MissionCard({ label, icon, title, children, hint }: Props) {
  const styles = createStyles(useThemeColors());
  return (
    <Card style={styles.card}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </Card>
  );
}

export const createMissionStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    input: {
      marginTop: SPACING.md,
      minHeight: 54,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.softBorder,
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      fontSize: FONT.bodyLg,
      color: colors.text,
    },
    error: {
      marginTop: SPACING.sm,
      textAlign: 'center',
      fontSize: FONT.body,
      color: colors.danger,
    },
    spacer: { marginTop: SPACING.md },
  });

/** Back-compat static styles (light). Prefer createMissionStyles(useThemeColors()). */
export const missionStyles = createMissionStyles(lightColors);

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: { alignItems: 'center', backgroundColor: colors.card },
    label: { fontSize: FONT.caption, fontWeight: '700', letterSpacing: 1.5, color: colors.muted },
    icon: { fontSize: 40, color: colors.accent, marginTop: SPACING.sm },
    title: { marginTop: SPACING.sm, fontSize: FONT.title, fontWeight: '700', color: colors.text },
    hint: { marginTop: SPACING.sm, fontSize: FONT.body, textAlign: 'center', color: colors.muted },
  });

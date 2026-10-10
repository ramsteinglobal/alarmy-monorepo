import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { COLORS, FONT, SPACING } from '../theme';
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

export const missionStyles = StyleSheet.create({
  input: {
    marginTop: SPACING.md,
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.softBorder,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    fontSize: FONT.bodyLg,
    color: COLORS.text,
  },
  error: { marginTop: SPACING.sm, textAlign: 'center', fontSize: FONT.body, color: COLORS.danger },
  spacer: { marginTop: SPACING.md },
});

const styles = StyleSheet.create({
  card: { alignItems: 'center', backgroundColor: COLORS.card },
  label: { fontSize: FONT.caption, fontWeight: '700', letterSpacing: 1.5, color: COLORS.muted },
  icon: { fontSize: 40, color: COLORS.accent, marginTop: SPACING.sm },
  title: { marginTop: SPACING.sm, fontSize: FONT.title, fontWeight: '700', color: COLORS.text },
  hint: { marginTop: SPACING.sm, fontSize: FONT.body, textAlign: 'center', color: COLORS.muted },
});

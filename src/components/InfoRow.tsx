import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONT, SPACING, type ThemeColors } from '../theme';
import { useThemeColors } from '../store/ThemeContext';

type Props = { icon: string; label: string; value: string; description?: string };

/** Icon + small label + value (+ optional description). Used on ringing, summary and success. */
export default function InfoRow({ icon, label, value, description }: Props) {
  const styles = createStyles(useThemeColors());
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${label}: ${value}${description ? `. ${description}` : ''}`}
    >
      <View style={styles.iconBox}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
    iconBox: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: colors.iconBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    icon: { fontSize: FONT.title, fontWeight: '700', color: colors.accent },
    content: { flex: 1 },
    label: { fontSize: FONT.caption, fontWeight: '700', letterSpacing: 1.5, color: colors.muted },
    value: { marginTop: 3, fontSize: FONT.bodyLg, fontWeight: '700', color: colors.text },
    description: { marginTop: 2, fontSize: FONT.caption, color: colors.muted },
  });

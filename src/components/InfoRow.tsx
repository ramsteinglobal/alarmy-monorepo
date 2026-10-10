import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT } from '../theme';

type Props = { icon: string; label: string; value: string; description?: string };

/** Icon + small label + value (+ optional description). Used on ringing, summary and success. */
export default function InfoRow({ icon, label, value, description }: Props) {
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

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: { fontSize: FONT.title, fontWeight: '700', color: COLORS.accent },
  content: { flex: 1 },
  label: { fontSize: FONT.caption, fontWeight: '700', letterSpacing: 1.2, color: COLORS.muted },
  value: { marginTop: 3, fontSize: 15, fontWeight: '700', color: COLORS.text },
  description: { marginTop: 2, fontSize: FONT.caption, color: COLORS.muted },
});

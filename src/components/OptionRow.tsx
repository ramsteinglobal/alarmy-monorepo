import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONT, RADIUS } from '../theme';

type Props = {
  icon: string;
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
  badge?: { text: string; color: string };
};

/** One selectable row in a single-choice list (sounds, missions). */
export default function OptionRow({ icon, title, description, selected, onPress, badge }: Props) {
  return (
    <TouchableOpacity
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}. ${description}${badge ? `. ${badge.text}` : ''}`}
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}>
      <View style={[styles.iconBox, selected && styles.iconBoxSelected]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        {badge ? <Text style={[styles.badge, { color: badge.color }]}>{badge.text}</Text> : null}
      </View>

      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    padding: 14,
    marginBottom: 10,
    borderRadius: RADIUS.md + 2,
    borderWidth: 1,
    borderColor: COLORS.softBorder,
    backgroundColor: COLORS.surface,
  },
  cardSelected: { borderColor: COLORS.accent, backgroundColor: COLORS.accentSoft },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.iconBg,
  },
  iconBoxSelected: { backgroundColor: COLORS.accentTint },
  icon: { fontSize: 20, color: COLORS.accent },
  info: { flex: 1 },
  title: { fontSize: FONT.bodyLg, fontWeight: '700', color: COLORS.text },
  description: { marginTop: 2, fontSize: FONT.caption, color: COLORS.muted },
  badge: { marginTop: 4, fontSize: FONT.caption, fontWeight: '700' },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.softBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: COLORS.accent },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.accent },
});

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONT, TOUCH_MIN } from '../theme';

type Props = { title: string; subtitle?: string; onBack?: () => void };

export default function ScreenHeader({ title, subtitle, onBack }: Props) {
  return (
    <View>
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={onBack}
            style={styles.back}
          >
            <Text style={styles.backGlyph}>‹</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.back} />
        )}
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <View style={styles.back} />
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: TOUCH_MIN, height: TOUCH_MIN, justifyContent: 'center' },
  backGlyph: { fontSize: 34, lineHeight: 36, color: COLORS.text },
  title: { fontSize: FONT.title, fontWeight: '700', color: COLORS.text },
  subtitle: { textAlign: 'center', fontSize: FONT.body, color: COLORS.muted, marginTop: 4 },
});

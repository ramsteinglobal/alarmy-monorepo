import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT, SPACING } from '../theme';

/**
 * Full-screen brand moment: yellow cover, white mark + name centered.
 * Matches the native launch screens so cold start feels like one shot.
 */
export default function SplashScreen() {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.mark}>
          <Text style={styles.markText}>✦</Text>
        </View>
        <Text style={styles.title}>Wakely</Text>
        <Text style={styles.subtitle}>Wake up. Prove it.</Text>
        <ActivityIndicator color={COLORS.onAccent} style={styles.spinner} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.accent },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  mark: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.onAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: { fontSize: 38, color: COLORS.accent },
  title: { marginTop: SPACING.md, fontSize: 44, fontWeight: '800', color: COLORS.onAccent },
  subtitle: { marginTop: SPACING.sm, fontSize: FONT.bodyLg, color: COLORS.onAccent, opacity: 0.9 },
  spinner: { marginTop: SPACING.xl },
});

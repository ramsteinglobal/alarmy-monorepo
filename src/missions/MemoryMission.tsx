import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FONT, RADIUS, type ThemeColors } from '../theme';
import { useThemeColors } from '../store/ThemeContext';
import MissionCard, { createMissionStyles } from './MissionCard';
import type { MissionProps } from './types';

const SYMBOLS = ['●', '▲', '■', '★', '◆', '♥'];
const SHOW_MS = 3000;

const makeSequence = (length: number) =>
  Array.from({ length }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);

export default function MemoryMission({
  onComplete,
  onProgress,
  length = 4,
}: MissionProps & { length?: number }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const missionStyles = createMissionStyles(colors);
  const total = Math.max(3, Math.min(6, Math.round(length)));
  const [sequence, setSequence] = useState(() => makeSequence(total));
  const [phase, setPhase] = useState<'show' | 'recall'>('show');
  const [entered, setEntered] = useState<string[]>([]);
  const [error, setError] = useState(false);

  // The sequence is hidden after a few seconds, so it has to be remembered.
  useEffect(() => {
    if (phase !== 'show') return undefined;
    const t = setTimeout(() => setPhase('recall'), SHOW_MS);
    return () => clearTimeout(t);
  }, [phase, sequence]);

  const restart = useCallback(() => {
    setSequence(makeSequence(total));
    setEntered([]);
    setError(true);
    setPhase('show');
  }, [total]);

  const press = (symbol: string) => {
    const next = [...entered, symbol];
    setEntered(next);
    setError(false);
    onProgress?.(Math.min(next.length / total, 1));
    if (next.length === total) {
      if (next.every((s, i) => s === sequence[i])) onComplete();
      else restart();
    }
  };

  return (
    <>
      <MissionCard
        label={phase === 'show' ? 'REMEMBER' : 'REPEAT THE SEQUENCE'}
        hint={
          phase === 'show' ? 'It will disappear in a moment.' : `Tap ${total} symbols in order.`
        }
      >
        <Text
          accessibilityLabel={
            phase === 'show' ? `Sequence: ${sequence.join(' ')}` : 'Sequence hidden'
          }
          style={styles.sequence}
        >
          {phase === 'show'
            ? sequence.join('  ')
            : entered.concat(Array(total - entered.length).fill('·')).join('  ')}
        </Text>
      </MissionCard>

      {error ? <Text style={missionStyles.error}>Not quite. Here is a new sequence.</Text> : null}

      {phase === 'recall' ? (
        <View style={styles.pad}>
          {SYMBOLS.map(s => (
            <TouchableOpacity
              key={s}
              accessibilityRole="button"
              accessibilityLabel={`Symbol ${s}`}
              style={styles.key}
              onPress={() => press(s)}
            >
              <Text style={styles.keyText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    sequence: { fontSize: 40, letterSpacing: 4, color: colors.accent, marginTop: 10 },
    pad: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 10,
      marginTop: 20,
    },
    key: {
      width: '30%',
      minHeight: 64,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: colors.softBorder,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    keyText: { fontSize: FONT.title + 6, color: colors.text },
  });

import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONT, RADIUS } from '../theme';
import MissionCard, { missionStyles } from './MissionCard';
import type { MissionProps } from './types';

const SYMBOLS = ['●', '▲', '■', '★', '◆', '♥'];
const LENGTH = 4;
const SHOW_MS = 3000;

const makeSequence = () =>
  Array.from({ length: LENGTH }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);

export default function MemoryMission({ onComplete }: MissionProps) {
  const [sequence, setSequence] = useState(makeSequence);
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
    setSequence(makeSequence());
    setEntered([]);
    setError(true);
    setPhase('show');
  }, []);

  const press = (symbol: string) => {
    const next = [...entered, symbol];
    setEntered(next);
    setError(false);
    if (next.length === LENGTH) {
      if (next.every((s, i) => s === sequence[i])) onComplete();
      else restart();
    }
  };

  return (
    <>
      <MissionCard
        label={phase === 'show' ? 'REMEMBER' : 'REPEAT THE SEQUENCE'}
        hint={phase === 'show' ? 'It will disappear in a moment.' : `Tap ${LENGTH} symbols in order.`}>
        <Text
          accessibilityLabel={phase === 'show' ? `Sequence: ${sequence.join(' ')}` : 'Sequence hidden'}
          style={styles.sequence}>
          {phase === 'show' ? sequence.join('  ') : entered.concat(Array(LENGTH - entered.length).fill('·')).join('  ')}
        </Text>
      </MissionCard>

      {error ? <Text style={missionStyles.error}>Not quite. Here is a new sequence.</Text> : null}

      {phase === 'recall' ? (
        <View style={styles.pad}>
          {SYMBOLS.map(s => (
            <TouchableOpacity key={s} accessibilityRole="button" accessibilityLabel={`Symbol ${s}`} style={styles.key} onPress={() => press(s)}>
              <Text style={styles.keyText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  sequence: { fontSize: 40, letterSpacing: 4, color: COLORS.accent, marginTop: 10 },
  pad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginTop: 20 },
  key: {
    width: '30%',
    minHeight: 64,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.softBorder,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { fontSize: FONT.title + 6, color: COLORS.text },
});

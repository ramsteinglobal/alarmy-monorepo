import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { useThemeColors } from '../store/ThemeContext';
import MissionCard, { createMissionStyles } from './MissionCard';
import type { MissionProps } from './types';

export type MathDifficulty = 'Easy' | 'Medium' | 'Hard';

// A new question every time, so the answer can't be memorised.
const makeQuestion = (difficulty: MathDifficulty) => {
  if (difficulty === 'Easy') {
    const a = 1 + Math.floor(Math.random() * 9);
    const b = 1 + Math.floor(Math.random() * 9);
    return { a, b, answer: a + b };
  }
  if (difficulty === 'Hard') {
    const a = 25 + Math.floor(Math.random() * 75);
    const b = 10 + Math.floor(Math.random() * 90);
    return { a, b, answer: a + b };
  }
  const a = 4 + Math.floor(Math.random() * 16);
  const b = 4 + Math.floor(Math.random() * 16);
  return { a, b, answer: a + b };
};

type Props = MissionProps & {
  problems?: number;
  difficulty?: MathDifficulty;
};

export default function MathMission({
  onComplete,
  onProgress,
  problems = 1,
  difficulty = 'Medium',
}: Props) {
  const colors = useThemeColors();
  const missionStyles = createMissionStyles(colors);
  const total = Math.max(1, Math.min(5, Math.round(problems)));
  const [q, setQ] = useState(() => makeQuestion(difficulty));
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [solved, setSolved] = useState(0);

  const check = () => {
    if (Number(value) === q.answer && value.trim() !== '') {
      const next = solved + 1;
      setSolved(next);
      onProgress?.(Math.min(next / total, 1));
      if (next >= total) {
        onComplete();
        return;
      }
      setValue('');
      setError(false);
      setQ(makeQuestion(difficulty)); // next problem
      return;
    }
    setError(true);
    setValue('');
    setQ(makeQuestion(difficulty)); // wrong answer = new question
  };

  return (
    <>
      <MissionCard label={total > 1 ? `SOLVE ${solved + 1} OF ${total}` : 'SOLVE'}>
        <Text
          accessibilityLabel={`${q.a} plus ${q.b}`}
          style={{ fontSize: 44, fontWeight: '700', color: colors.text, marginTop: 8 }}
        >
          {q.a} + {q.b} = ?
        </Text>
      </MissionCard>
      <TextInput
        style={missionStyles.input}
        value={value}
        onChangeText={t => {
          setValue(t);
          setError(false);
        }}
        placeholder="Enter your answer"
        placeholderTextColor={colors.muted}
        keyboardType="numeric"
        returnKeyType="done"
        onSubmitEditing={check}
        accessibilityLabel="Your answer"
      />
      {error ? <Text style={missionStyles.error}>Not quite. Here is a new one.</Text> : null}
      <View style={{ height: 16 }} />
      <PrimaryButton label="CHECK ANSWER" onPress={check} />
    </>
  );
}

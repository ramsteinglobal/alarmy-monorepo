import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { COLORS } from '../theme';
import MissionCard, { missionStyles } from './MissionCard';
import type { MissionProps } from './types';

// A new question every time, so the answer can't be memorised.
const makeQuestion = () => {
  const a = 4 + Math.floor(Math.random() * 16);
  const b = 4 + Math.floor(Math.random() * 16);
  return { a, b, answer: a + b };
};

export default function MathMission({ onComplete }: MissionProps) {
  const [q, setQ] = useState(makeQuestion);
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  const check = () => {
    if (Number(value) === q.answer && value.trim() !== '') {
      onComplete();
      return;
    }
    setError(true);
    setValue('');
    setQ(makeQuestion()); // wrong answer = new question
  };

  return (
    <>
      <MissionCard label="SOLVE">
        <Text
          accessibilityLabel={`${q.a} plus ${q.b}`}
          style={{ fontSize: 44, fontWeight: '700', color: COLORS.text, marginTop: 8 }}
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
        placeholderTextColor={COLORS.muted}
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

import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { COLORS, FONT } from '../theme';
import MissionCard, { missionStyles } from './MissionCard';
import type { MissionProps } from './types';

const SENTENCES = [
  'I am awake and ready for the day',
  'Today I will do one thing that matters',
  'Water first, then the world',
  'I get up now and thank myself later',
];

const normalise = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

export default function TypingMission({ onComplete }: MissionProps) {
  const [target] = useState(() => SENTENCES[Math.floor(Math.random() * SENTENCES.length)]);
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  const check = () => {
    if (normalise(value) === normalise(target)) onComplete();
    else setError(true);
  };

  return (
    <>
      <MissionCard label="TYPE THIS">
        <Text style={{ fontSize: FONT.title, fontWeight: '700', textAlign: 'center', color: COLORS.text, marginTop: 8 }}>
          {target}
        </Text>
      </MissionCard>
      <TextInput
        style={[missionStyles.input, { minHeight: 90, textAlignVertical: 'top', paddingTop: 14 }]}
        value={value}
        onChangeText={t => { setValue(t); setError(false); }}
        placeholder="Type the sentence"
        placeholderTextColor={COLORS.muted}
        multiline
        autoCorrect={false}
        accessibilityLabel="Type the sentence shown above"
      />
      {error ? <Text style={missionStyles.error}>Please type the sentence exactly as shown.</Text> : null}
      <View style={{ height: 16 }} />
      <PrimaryButton label="CHECK" onPress={check} />
    </>
  );
}

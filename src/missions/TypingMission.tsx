import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { FONT } from '../theme';
import { useThemeColors } from '../store/ThemeContext';
import MissionCard, { createMissionStyles } from './MissionCard';
import type { MissionProps } from './types';

const SENTENCES = [
  'I am awake and ready for the day',
  'Today I will do one thing that matters',
  'Water first, then the world',
  'I get up now and thank myself later',
  'Small steps every morning build a strong life',
  'My alarm is a promise I keep to myself',
  'One deep breath, then begin',
  'Today is mine to shape',
  'I choose progress over comfort',
  'Wake up, show up, never give up',
];

const pickSentence = () =>
  SENTENCES[Math.floor(Math.random() * SENTENCES.length)];

const normalise = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

export default function TypingMission({
  onComplete,
  onProgress,
  reps = 1,
}: MissionProps & { reps?: number }) {
  const colors = useThemeColors();
  const missionStyles = createMissionStyles(colors);
  const total = Math.max(1, Math.min(3, Math.round(reps)));
  const [target, setTarget] = useState<string>(pickSentence);
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [done, setDone] = useState(0);

  const check = () => {
    if (normalise(value) === normalise(target)) {
      const next = done + 1;
      setDone(next);
      onProgress?.(Math.min(next / total, 1));
      if (next >= total) {
        onComplete();
        return;
      }
      setValue('');
      setError(false);
      setTarget(pickSentence());
      return;
    }
    setError(true);
  };

  return (
    <>
      <MissionCard label={total > 1 ? `TYPE ${done + 1} OF ${total}` : 'TYPE THIS'}>
        <Text
          style={{
            fontSize: FONT.title,
            fontWeight: '700',
            textAlign: 'center',
            color: colors.text,
            marginTop: 8,
          }}
        >
          {target}
        </Text>
      </MissionCard>
      <TextInput
        style={[missionStyles.input, { minHeight: 90, textAlignVertical: 'top', paddingTop: 14 }]}
        value={value}
        onChangeText={t => {
          setValue(t);
          setError(false);
        }}
        placeholder="Type the sentence"
        placeholderTextColor={colors.muted}
        multiline
        autoCorrect={false}
        accessibilityLabel="Type the sentence shown above"
      />
      {error ? (
        <Text style={missionStyles.error}>Please type the sentence exactly as shown.</Text>
      ) : null}
      <View style={{ height: 16 }} />
      <PrimaryButton label="CHECK" onPress={check} />
    </>
  );
}

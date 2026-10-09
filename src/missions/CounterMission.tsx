import React, { useState } from 'react';
import { Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { COLORS } from '../theme';
import MissionCard from './MissionCard';
import type { MissionProps } from './types';

type Props = MissionProps & {
  icon: string;
  title: string;
  description: string;
  buttonLabel: string;
  target?: number;
};

/**
 * Shake and squat share this screen.
 * TODO: count real movement with the accelerometer (react-native-sensors) instead
 * of button taps. The tap button is a placeholder, and anyone can tap it half asleep.
 */
export default function CounterMission({
  icon,
  title,
  description,
  buttonLabel,
  target = 10,
  onComplete,
  onProgress,
}: Props) {
  const [count, setCount] = useState(0);

  const increment = () => {
    const next = count + 1;
    setCount(next);
    onProgress?.(Math.min(next / target, 1));
    if (next >= target) onComplete();
  };

  return (
    <>
      <MissionCard icon={icon} title={title} hint={description}>
        <Text accessibilityLiveRegion="polite" style={{ marginTop: 10, fontSize: 36, fontWeight: '700', color: COLORS.accent }}>
          {count} / {target}
        </Text>
      </MissionCard>
      <View style={{ height: 16 }} />
      <PrimaryButton label={buttonLabel} onPress={increment} />
    </>
  );
}

import React, { useState } from 'react';
import { Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { useThemeColors } from '../store/ThemeContext';
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
 * Tap-to-count missions: squat and tap challenge. Shake has its own
 * accelerometer mission (ShakeMission) with this as fallback.
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
  const colors = useThemeColors();

  const increment = () => {
    const next = count + 1;
    setCount(next);
    onProgress?.(Math.min(next / target, 1));
    if (next >= target) onComplete();
  };

  return (
    <>
      <MissionCard icon={icon} title={title} hint={description}>
        <Text
          accessibilityLiveRegion="polite"
          style={{ marginTop: 10, fontSize: 36, fontWeight: '700', color: colors.accent }}
        >
          {count} / {target}
        </Text>
      </MissionCard>
      <View style={{ height: 16 }} />
      <PrimaryButton label={buttonLabel} onPress={increment} />
    </>
  );
}

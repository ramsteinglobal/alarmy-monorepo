import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { accelerometer, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';
import { map, filter } from 'rxjs/operators';
import type { Subscription } from 'rxjs';
import { useThemeColors } from '../store/ThemeContext';
import MissionCard from './MissionCard';
import CounterMission from './CounterMission';
import type { MissionProps } from './types';

const SHAKE_THRESHOLD = 4;
const DEBOUNCE_MS = 350;

type Props = MissionProps & {
  target?: number;
};

/**
 * Counts real shakes from the accelerometer. If the sensor is unavailable
 * (emulator, denied, old device), falls back to tap-to-count so the alarm
 * can still be stopped honestly by effort.
 */
export default function ShakeMission({ target = 10, onComplete, onProgress }: Props) {
  const colors = useThemeColors();
  const [count, setCount] = useState(0);
  const [sensorLive, setSensorLive] = useState(true);
  const countRef = useRef(0);
  const lastShake = useRef(0);
  const doneRef = useRef(false);

  useEffect(() => {
    setUpdateIntervalForType(SensorTypes.accelerometer, 100);
    let subscription: Subscription | null = null;
    try {
      subscription = accelerometer
        .pipe(
          map(({ x, y, z }) => Math.sqrt(x * x + y * y + z * z) - 9.81),
          filter(strength => Math.abs(strength) > SHAKE_THRESHOLD),
        )
        .subscribe(
          () => {
            const now = Date.now();
            if (now - lastShake.current < DEBOUNCE_MS || doneRef.current) return;
            lastShake.current = now;
            countRef.current += 1;
            setCount(countRef.current);
            onProgress?.(Math.min(countRef.current / target, 1));
            if (countRef.current >= target) {
              doneRef.current = true;
              onComplete();
            }
          },
          () => setSensorLive(false),
        );
    } catch {
      setSensorLive(false);
    }
    return () => subscription?.unsubscribe();
  }, [onComplete, onProgress, target]);

  if (!sensorLive) {
    return (
      <CounterMission
        icon="↔"
        title="Shake Your Phone"
        description={`Sensor unavailable — tap SHAKE ${target} times instead.`}
        buttonLabel="SHAKE"
        target={target}
        onComplete={onComplete}
        onProgress={onProgress}
      />
    );
  }

  return (
    <MissionCard
      label="SHAKE TO WAKE"
      hint={`Shake hard ${target} times. Gentle wobbles don't count.`}
    >
      <Text
        accessibilityLiveRegion="polite"
        style={{ marginTop: 10, fontSize: 44, fontWeight: '800', color: colors.accent }}
      >
        {count} / {target}
      </Text>
      <View style={{ height: 8 }} />
      <Text style={{ fontSize: 13, color: colors.muted }}>Move the phone like you mean it</Text>
    </MissionCard>
  );
}

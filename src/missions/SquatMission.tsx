import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { accelerometer, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';
import { map, filter } from 'rxjs/operators';
import type { Subscription } from 'rxjs';
import { useThemeColors } from '../store/ThemeContext';
import MissionCard from './MissionCard';
import CounterMission from './CounterMission';
import type { MissionProps } from './types';

// A squat = phone drops down (negative Y acceleration) then rises back.
// Detection differs from Shake: uses Y-axis only, slower debounce.
const SQUAT_THRESHOLD = 2.5;
const MIN_GAP_MS = 700;
const MAX_GAP_MS = 3500;

type Props = MissionProps & {
  target?: number;
};

/**
 * Real squat detection via accelerometer Y-axis. The user must physically
 * lower and raise the phone (holding it while squatting). Different from
 * ShakeMission which detects rapid back-and-forth motion.
 */
export default function SquatMission({ target = 10, onComplete, onProgress }: Props) {
  const colors = useThemeColors();
  const [count, setCount] = useState(0);
  const [sensorLive, setSensorLive] = useState(true);
  const countRef = useRef(0);
  const lastDownRef = useRef(0);
  const doneRef = useRef(false);

  useEffect(() => {
    setUpdateIntervalForType(SensorTypes.accelerometer, 100);
    let subscription: Subscription | null = null;
    let sawDown = false;

    try {
      subscription = accelerometer
        .pipe(
          map(({ y }) => y), // Y-axis = vertical motion when phone held upright
          filter(y => Math.abs(y) > SQUAT_THRESHOLD),
        )
        .subscribe(
          y => {
            if (doneRef.current) return;
            const now = Date.now();

            if (y < -SQUAT_THRESHOLD) {
              // Phone moving down — record the "down" event
              sawDown = true;
              lastDownRef.current = now;
              return;
            }

            // Phone moving up after a down — count a squat if timing matches
            if (sawDown && y > SQUAT_THRESHOLD) {
              const gap = now - lastDownRef.current;
              if (gap >= MIN_GAP_MS && gap <= MAX_GAP_MS) {
                countRef.current += 1;
                setCount(countRef.current);
                onProgress?.(Math.min(countRef.current / target, 1));
                if (countRef.current >= target) {
                  doneRef.current = true;
                  onComplete();
                }
              }
              sawDown = false;
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
        icon="↕"
        title="Squat Mission"
        description={`Sensor unavailable — tap SQUAT ${target} times instead.`}
        buttonLabel="SQUAT"
        target={target}
        onComplete={onComplete}
        onProgress={onProgress}
      />
    );
  }

  return (
    <MissionCard
      label="SQUAT TO WAKE"
      hint={`Hold your phone and do ${target} real squats. Lower down, stand up — that is one.`}
    >
      <Text
        accessibilityLiveRegion="polite"
        style={{ marginTop: 10, fontSize: 44, fontWeight: '800', color: colors.accent }}
      >
        {count} / {target}
      </Text>
      <View style={{ height: 8 }} />
      <Text style={{ fontSize: 13, color: colors.muted }}>
        Down slowly, up slowly. Fast wobbles don&apos;t count.
      </Text>
    </MissionCard>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Card from '../../components/Card';
import PrimaryButton from '../../components/PrimaryButton';
import Screen from '../../components/Screen';
import useBlockBack from '../../hooks/useBlockBack';
import {
  WAKE_CHECK_GRACE_MS,
  cancelWakeCheck,
  scheduleWakeRering,
} from '../../services/alarmScheduler';
import { useThemeColors } from '../../store/ThemeContext';
import { FONT, SPACING, type ThemeColors } from '../../theme';
import type { AlarmScreenProps } from '../../types/navigation';
import { formatClock } from '../../utils/time';

/**
 * Fall-back-asleep prevention: minutes after dismiss, prove you're still up.
 * Ignoring this screen lets the parallel re-ring trigger restart the mission.
 */
export default function WakeCheckScreen({ navigation, route }: AlarmScreenProps<'WakeCheck'>) {
  const alarm = route.params?.alarm;
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [secondsLeft, setSecondsLeft] = useState(Math.round(WAKE_CHECK_GRACE_MS / 1000));
  const [now, setNow] = useState(() => new Date());
  const finished = useRef(false);

  // Back would dodge the fall-back-asleep guard — the re-ring still fires.
  useBlockBack();

  useEffect(() => {
    if (alarm?.id) {
      // User engaged: clear the delivered check, but keep a 60s re-ring armed
      // so force-killing the app here still brings the full alarm back.
      cancelWakeCheck(alarm.id)
        .then(() => {
          if (!finished.current && alarm) return scheduleWakeRering(alarm);
        })
        .catch(error => console.error('Failed to arm wake re-ring:', error));
    }
    const clock = setInterval(() => setNow(new Date()), 1000);
    const countdown = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          if (!finished.current && alarm) {
            finished.current = true;
            cancelWakeCheck(alarm.id).catch(error =>
              console.error('Failed to cancel wake-up check:', error),
            );
            navigation.replace('AlarmRinging', { alarm, startedAt: Date.now(), snoozeCount: 0 });
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      clearInterval(clock);
      clearInterval(countdown);
    };
  }, [alarm, navigation]);

  const handleConfirm = () => {
    if (finished.current) return;
    finished.current = true;
    if (alarm?.id) {
      cancelWakeCheck(alarm.id).catch(error =>
        console.error('Failed to cancel wake-up check:', error),
      );
    }
    navigation.reset({ index: 0, routes: [{ name: 'AlarmDashboard' }] });
  };

  const { time, period } = formatClock(now);

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerLabel}>WAKE-UP CHECK</Text>
          <Text accessibilityRole="header" style={styles.headerTitle}>
            Still awake?
          </Text>
        </View>

        <View style={styles.timeSection}>
          <Text style={styles.time}>{time}</Text>
          <Text style={styles.period}>{period}</Text>
        </View>

        <Card>
          <Text style={styles.cardText}>
            You dismissed {alarm?.label ? `"${alarm.label}"` : 'your alarm'} at {alarm?.time ?? ''}{' '}
            {alarm?.period ?? ''}. Prove you're up — or the full alarm re-rings in {secondsLeft}s.
          </Text>
        </Card>

        <View style={styles.actions}>
          <PrimaryButton
            label="I'M UP ✓"
            accessibilityLabel="Confirm I'm awake"
            onPress={handleConfirm}
          />
        </View>
      </View>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20, paddingTop: SPACING.md },
    header: { alignItems: 'center' },
    headerLabel: {
      fontSize: FONT.caption,
      fontWeight: '700',
      letterSpacing: 2,
      color: colors.accent,
    },
    headerTitle: { marginTop: 6, fontSize: FONT.headline, fontWeight: '700', color: colors.text },
    timeSection: { alignItems: 'center', marginTop: 34, marginBottom: 26 },
    time: { fontSize: FONT.display, lineHeight: 70, fontWeight: '700', color: colors.text },
    period: { fontSize: 18, fontWeight: '700', color: colors.accent, marginTop: -4 },
    cardText: { fontSize: FONT.body, lineHeight: 22, color: colors.text, textAlign: 'center' },
    actions: { marginTop: 'auto', paddingBottom: SPACING.md, gap: SPACING.sm },
  });

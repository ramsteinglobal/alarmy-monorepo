import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import Card from '../../components/Card';
import InfoRow from '../../components/InfoRow';
import PrimaryButton from '../../components/PrimaryButton';
import Screen from '../../components/Screen';
import useBlockBack from '../../hooks/useBlockBack';
import { COLORS, FONT, RADIUS, SPACING } from '../../theme';
import type { AlarmScreenProps } from '../../types/navigation';
import { formatClock } from '../../utils/time';

export default function AlarmRingingScreen({
  navigation,
  route,
}: AlarmScreenProps<'AlarmRinging'>) {
  const alarm = route.params?.alarm;
  const [now, setNow] = useState(() => new Date());

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // An alarm must not be dismissed by the Android back button.
  useBlockBack();

  const { time, period } = formatClock(now);

  const handleStartMission = () => {
    if (!alarm) {
      Alert.alert('Alarm Error', 'Alarm information is missing.');
      return;
    }
    navigation.navigate('MissionExecution', { alarm });
  };

  // Development shortcut only. Remove once real scheduling is in place.
  const handleDismiss = () =>
    navigation.reset({ index: 0, routes: [{ name: 'AlarmDashboard' }] });

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerLabel}>WAKE UP</Text>
          <Text accessibilityRole="header" style={styles.headerTitle}>
            Alarm Ringing
          </Text>
        </View>

        <View style={styles.timeSection} accessible accessibilityLabel={`It is ${time} ${period}`}>
          <Text style={styles.time}>{time}</Text>
          <Text style={styles.period}>{period}</Text>
          <Text style={styles.wakeText}>It's time to wake up</Text>
        </View>

        <Card>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardLabel}>ALARM</Text>
              <Text style={styles.alarmTime}>
                {alarm?.time ?? '--:--'} {alarm?.period ?? ''}
              </Text>
            </View>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>ACTIVE</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <InfoRow
            icon="✓"
            label="MISSION"
            value={alarm?.mission?.title ?? 'Math Mission'}
            description={alarm?.mission?.description ?? 'Complete the mission to stop the alarm'}
          />
          <InfoRow
            icon="♪"
            label="SOUND"
            value={alarm?.sound?.name ?? 'Classic Alarm'}
            description={alarm?.sound?.description ?? 'Alarm sound'}
          />
        </Card>

        <View style={styles.instructionBox}>
          <Text style={styles.instructionTitle}>Mission Required</Text>
          <Text style={styles.instructionText}>
            Complete your selected mission to turn off the alarm.
          </Text>
        </View>

        <View style={styles.actions}>
          <PrimaryButton label="START MISSION" onPress={handleStartMission} />
          {__DEV__ ? (
            <PrimaryButton label="Dismiss for now (dev only)" variant="ghost" onPress={handleDismiss} />
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: SPACING.md },
  header: { alignItems: 'center' },
  headerLabel: { fontSize: FONT.caption, fontWeight: '700', letterSpacing: 2, color: COLORS.accent },
  headerTitle: { marginTop: 6, fontSize: FONT.headline, fontWeight: '700', color: COLORS.text },
  timeSection: { alignItems: 'center', marginTop: 34, marginBottom: 26 },
  time: { fontSize: FONT.display, lineHeight: 70, fontWeight: '700', color: COLORS.text },
  period: { fontSize: 18, fontWeight: '700', color: COLORS.accent, marginTop: -4 },
  wakeText: { marginTop: 8, fontSize: FONT.body, color: COLORS.muted },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel: { fontSize: FONT.caption, fontWeight: '700', letterSpacing: 1.5, color: COLORS.muted },
  alarmTime: { marginTop: 4, fontSize: FONT.headline, fontWeight: '700', color: COLORS.text },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.accentTint,
  },
  activeBadgeText: { fontSize: FONT.caption, fontWeight: '700', color: COLORS.accent },
  divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: SPACING.md },
  instructionBox: { marginTop: 18, paddingHorizontal: 8, alignItems: 'center' },
  instructionTitle: { fontSize: FONT.body, fontWeight: '700', color: COLORS.text },
  instructionText: { marginTop: 5, fontSize: FONT.caption + 1, lineHeight: 18, textAlign: 'center', color: COLORS.muted },
  actions: { marginTop: 'auto', paddingBottom: SPACING.md, gap: SPACING.sm },
});

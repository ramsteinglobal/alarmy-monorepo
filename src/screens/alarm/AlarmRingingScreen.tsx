import React, { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import Card from '../../components/Card';
import InfoRow from '../../components/InfoRow';
import PrimaryButton from '../../components/PrimaryButton';
import Screen from '../../components/Screen';
import useBlockBack from '../../hooks/useBlockBack';
import { cancelBackup, promptFixPermissions, snoozeAlarm } from '../../services/alarmScheduler';
import {
  getMaxSnoozes,
  getMissionChain,
  getSnoozeMinutes,
  missionChainTitle,
} from '../../storage/alarmStorage';
import { useThemeColors } from '../../store/ThemeContext';
import { FONT, RADIUS, SPACING, type ThemeColors } from '../../theme';
import type { AlarmScreenProps } from '../../types/navigation';
import { formatClock } from '../../utils/time';

export default function AlarmRingingScreen({
  navigation,
  route,
}: AlarmScreenProps<'AlarmRinging'>) {
  const alarm = route.params?.alarm;
  const snoozeCount = route.params?.snoozeCount ?? 0;
  const snoozeMinutes = alarm ? getSnoozeMinutes(alarm) : 5;
  const snoozesLeft = (alarm ? getMaxSnoozes(alarm) : 3) - snoozeCount;
  const [now, setNow] = useState(() => new Date());
  const [snoozing, setSnoozing] = useState(false);
  const colors = useThemeColors();
  const styles = createStyles(colors);

  // When the ringing screen mounts, the alarm starts demanding attention.
  // This timestamp travels Ringing -> Mission -> Success so history records
  // how long the wake-up actually took.
  const ringingStartedAt = useRef(Date.now());

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
    // User engaged: the extra-loud backup is no longer needed.
    if (alarm.id) {
      cancelBackup(alarm.id).catch(error => console.error('Failed to cancel backup:', error));
    }
    navigation.navigate('MissionExecution', {
      alarm,
      startedAt: ringingStartedAt.current,
      snoozeCount,
    });
  };

  // Development shortcut only. Remove once real scheduling is in place.
  const handleDismiss = () => navigation.reset({ index: 0, routes: [{ name: 'AlarmDashboard' }] });

  const handleSnooze = async () => {
    if (!alarm || snoozing) return;
    setSnoozing(true);
    try {
      const result = await snoozeAlarm(alarm, snoozeCount);
      if (!result.ok) {
        promptFixPermissions(result);
        return;
      }
      Alert.alert(
        'Snoozed',
        `Back in ${snoozeMinutes} minutes. ${snoozesLeft - 1} snooze${
          snoozesLeft - 1 === 1 ? '' : 's'
        } left.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.reset({ index: 0, routes: [{ name: 'AlarmDashboard' }] }),
          },
        ],
      );
    } finally {
      setSnoozing(false);
    }
  };

  return (
    <Screen>
      {!alarm ? (
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerLabel}>WAKE UP</Text>
            <Text accessibilityRole="header" style={styles.headerTitle}>
              Something went wrong
            </Text>
          </View>
          <Card>
            <Text style={styles.errorText}>
              This alarm opened without its details, so there is nothing to turn off. Your saved
              alarms are safe.
            </Text>
          </Card>
          <View style={styles.actions}>
            <PrimaryButton
              label="Back to alarms"
              onPress={() => navigation.reset({ index: 0, routes: [{ name: 'AlarmDashboard' }] })}
            />
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.headerLabel}>WAKE UP</Text>
            </View>

            <View
              style={styles.timeSection}
              accessible
              accessibilityLabel={`It is ${time} ${period}`}
            >
              <Text style={styles.time}>{time}</Text>
              <Text style={styles.period}>{period}</Text>
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
                  <Text style={styles.activeBadgeText}>RINGING</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <InfoRow
                icon="✓"
                label={alarm && getMissionChain(alarm).length > 1 ? 'MISSIONS' : 'MISSION'}
                value={alarm ? missionChainTitle(alarm) : 'Math Mission'}
                description={
                  alarm && getMissionChain(alarm).length > 1
                    ? getMissionChain(alarm)
                        .map((m, i) => `${i + 1}. ${m.title}`)
                        .join('\n')
                    : alarm?.mission?.description ?? 'Complete the mission to stop the alarm'
                }
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
              {snoozesLeft > 0 ? (
                <PrimaryButton
                  label={
                    snoozing ? 'Snoozing…' : `Snooze ${snoozeMinutes} min (${snoozesLeft} left)`
                  }
                  accessibilityLabel={
                    snoozing ? 'Snoozing' : `Snooze ${snoozeMinutes} minutes, ${snoozesLeft} left`
                  }
                  variant="ghost"
                  loading={snoozing}
                  onPress={handleSnooze}
                />
              ) : (
                <Text style={styles.noSnooze}>No snoozes left — finish your missions to stop.</Text>
              )}
              {__DEV__ ? (
                <PrimaryButton
                  label="Dismiss for now (dev only)"
                  variant="ghost"
                  onPress={handleDismiss}
                />
              ) : null}
            </View>
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scroll: { flexGrow: 1 },
    container: { flex: 1, paddingHorizontal: 20, paddingTop: SPACING.md },
    header: { alignItems: 'center' },
    headerLabel: {
      fontSize: FONT.caption,
      fontWeight: '700',
      letterSpacing: 2,
      color: colors.accent,
    },
    headerTitle: { marginTop: 6, fontSize: FONT.headline, fontWeight: '700', color: colors.text },
    errorText: { fontSize: FONT.body, lineHeight: 22, color: colors.text, textAlign: 'center' },
    timeSection: { alignItems: 'center', marginTop: SPACING.xl, marginBottom: SPACING.lg },
    time: { fontSize: FONT.display, lineHeight: 70, fontWeight: '700', color: colors.text },
    period: { fontSize: FONT.bodyLg, fontWeight: '700', color: colors.accent },
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardLabel: {
      fontSize: FONT.caption,
      fontWeight: '700',
      letterSpacing: 1.5,
      color: colors.muted,
    },
    alarmTime: { marginTop: 4, fontSize: FONT.title, fontWeight: '700', color: colors.text },
    activeBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: RADIUS.sm,
      backgroundColor: colors.accentTint,
    },
    activeBadgeText: { fontSize: FONT.caption, fontWeight: '700', color: colors.accent },
    divider: { height: 1, backgroundColor: colors.divider, marginVertical: SPACING.md },
    instructionBox: { marginTop: SPACING.md, paddingHorizontal: 8, alignItems: 'center' },
    instructionTitle: { fontSize: FONT.body, fontWeight: '700', color: colors.text },
    instructionText: {
      marginTop: 5,
      fontSize: FONT.body,
      lineHeight: 20,
      textAlign: 'center',
      color: colors.muted,
    },
    actions: { marginTop: 'auto', paddingBottom: SPACING.md, gap: SPACING.sm },
    noSnooze: { textAlign: 'center', fontSize: FONT.body, color: colors.muted },
  });

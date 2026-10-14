import React, { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import PrimaryButton from '../../components/PrimaryButton';
import Screen from '../../components/Screen';
import useBlockBack from '../../hooks/useBlockBack';
import { cancelBackup, promptFixPermissions, snoozeAlarm } from '../../services/alarmScheduler';
import { playAlarmSound, playAlarmUri, stopSoundPreview } from '../../services/nativeAudio';
import {
  getMaxSnoozes,
  getMissionChain,
  getSnoozeMinutes,
  missionChainTitle,
} from '../../storage/alarmStorage';
import { useTheme, useThemeColors } from '../../store/ThemeContext';
import { FONT, RADIUS, SPACING, type ThemeColors } from '../../theme';
import type { RootScreenProps } from '../../types/navigation';
import { formatClock } from '../../utils/time';

export default function AlarmRingingScreen({ navigation, route }: RootScreenProps<'AlarmRinging'>) {
  const alarm = route.params?.alarm;
  const snoozeCount = route.params?.snoozeCount ?? 0;
  const snoozeMinutes = alarm ? getSnoozeMinutes(alarm) : 5;
  const snoozesLeft = (alarm ? getMaxSnoozes(alarm) : 3) - snoozeCount;
  const [now, setNow] = useState(() => new Date());
  const [snoozing, setSnoozing] = useState(false);
  const colors = useThemeColors();
  const { isDark } = useTheme();
  const styles = createStyles(colors, isDark);

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

  // Play the alarm through the native STREAM_ALARM so volume buttons
  // (which control STREAM_MUSIC) cannot mute it.
  useEffect(() => {
    const sound = alarm?.sound;
    if (!sound) return;

    const start = async () => {
      try {
        if (sound.id.startsWith('system_') && sound.file) {
          await playAlarmUri(sound.file);
        } else if (sound.file) {
          await playAlarmSound(sound.file);
        }
      } catch (err) {
        console.error('Failed to start native alarm sound:', err);
      }
    };

    start();

    return () => {
      stopSoundPreview().catch(err => console.error('Failed to stop native sound:', err));
    };
  }, [alarm?.sound]);

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

  // Development shortcut only — goes directly to the root AlarmDashboard.
  const handleDismiss = () => navigation.reset({ index: 0, routes: [{ name: 'Main' }] });

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
            onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Main' }] }),
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
            <Text style={styles.headerLabel}>ALARM IS RINGING</Text>
            <Text accessibilityRole="header" style={styles.greeting}>
              Something went wrong
            </Text>
          </View>
          <View style={styles.missionCard}>
            <Text style={styles.errorText}>
              This alarm opened without its details, so there is nothing to turn off. Your saved
              alarms are safe.
            </Text>
          </View>
          <View style={styles.actions}>
            <PrimaryButton
              label="Back to alarms"
              onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}
            />
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            <View style={styles.header}>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.headerLabel}>ALARM IS RINGING</Text>
              </View>
              <Text style={styles.greeting}>Good morning</Text>
            </View>

            <View
              style={styles.timeSection}
              accessible
              accessibilityLabel={`It is ${time} ${period}`}
            >
              <Text style={styles.time}>{time}</Text>
              <Text style={styles.period}>{period}</Text>
            </View>

            <View style={styles.missionCard}>
              <View style={styles.missionIcon}>
                <Text style={styles.missionIconText}>✓</Text>
              </View>
              <Text style={styles.missionEyebrow}>
                {getMissionChain(alarm).length > 1
                  ? `YOUR ${getMissionChain(alarm).length}-STEP WAKE-UP`
                  : 'YOUR WAKE-UP MISSION'}
              </Text>
              <Text style={styles.missionTitle}>{missionChainTitle(alarm)}</Text>
              <Text style={styles.instructionText}>
                Get up and complete the mission to stop the alarm.
              </Text>
            </View>

            <View style={styles.actions}>
              <PrimaryButton
                label="START MISSION  →"
                accessibilityHint="Begins the wake-up challenge. Complete it to stop the alarm."
                onPress={handleStartMission}
              />
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

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    scroll: { flexGrow: 1 },
    container: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: SPACING.lg,
      paddingBottom: SPACING.md,
      justifyContent: 'space-between',
    },
    header: { alignItems: 'center', gap: 12 },
    liveBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: RADIUS.pill,
      backgroundColor: colors.dangerSoft,
    },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },
    headerLabel: {
      fontSize: FONT.caption,
      fontWeight: '700',
      letterSpacing: 1.5,
      color: colors.danger,
    },
    greeting: { fontSize: FONT.title, fontWeight: '600', color: colors.muted },
    errorText: { fontSize: FONT.body, lineHeight: 22, color: colors.text, textAlign: 'center' },
    timeSection: {
      alignSelf: 'center',
      width: 250,
      height: 250,
      borderRadius: 125,
      borderWidth: 1,
      borderColor: colors.softBorder,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: SPACING.md,
      elevation: isDark ? 0 : 5,
      shadowColor: '#000000',
      shadowOpacity: isDark ? 0 : 0.08,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
    },
    time: {
      fontSize: 62,
      lineHeight: 72,
      fontWeight: '700',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    period: {
      marginTop: 4,
      fontSize: FONT.bodyLg,
      fontWeight: '700',
      letterSpacing: 2,
      color: colors.accent,
    },
    missionCard: {
      alignItems: 'center',
      paddingHorizontal: 22,
      paddingVertical: SPACING.lg,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.softBorder,
      backgroundColor: colors.card,
    },
    missionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accentTint,
      marginBottom: 12,
    },
    missionIconText: { fontSize: 25, fontWeight: '700', color: colors.accent },
    missionEyebrow: {
      fontSize: FONT.caption,
      fontWeight: '700',
      letterSpacing: 1.4,
      color: colors.accent,
    },
    missionTitle: {
      marginTop: 6,
      fontSize: FONT.title,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    instructionText: {
      marginTop: 8,
      fontSize: FONT.body,
      lineHeight: 21,
      textAlign: 'center',
      color: colors.muted,
    },
    actions: { paddingTop: SPACING.md, gap: SPACING.xs },
    noSnooze: { textAlign: 'center', fontSize: FONT.body, color: colors.muted },
  });

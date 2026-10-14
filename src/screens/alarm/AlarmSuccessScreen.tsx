import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Card from '../../components/Card';
import InfoRow from '../../components/InfoRow';
import PrimaryButton from '../../components/PrimaryButton';
import Screen from '../../components/Screen';
import useBlockBack from '../../hooks/useBlockBack';
import { cancelBackup, scheduleWakeCheck, stopRinging } from '../../services/alarmScheduler';
import { pushAlarm, pushHistoryItem } from '../../services/cloudSync';
import { addAlarmHistory, updateAlarmHistory, type WakeMood } from '../../storage/alarmHistory';
import { updateAlarm } from '../../storage/alarmStorage';
import { getMissionChain } from '../../storage/alarmStorage';
import { useTheme, useThemeColors } from '../../store/ThemeContext';
import { FONT, RADIUS, SPACING, type ThemeColors } from '../../theme';
import type { RootScreenProps } from '../../types/navigation';

export default function AlarmSuccessScreen({ navigation, route }: RootScreenProps<'AlarmSuccess'>) {
  const alarm = route.params?.alarm;
  const [leaving, setLeaving] = useState(false);
  const [mood, setMood] = useState<WakeMood | null>(null);
  const recorded = useRef(false);
  const recordId = useRef<string | null>(null);
  const colors = useThemeColors();
  const { isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  // Back would return into the finished mission stack — stay until DONE.
  useBlockBack();

  // Record the wake-up as soon as the screen opens, so closing the app
  // before tapping DONE no longer loses it (it used to be saved on DONE only).
  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    const startedAt = route.params?.startedAt;
    const snoozeCount = route.params?.snoozeCount ?? 0;
    const durationSeconds =
      typeof startedAt === 'number' ? Math.max(0, Math.round((Date.now() - startedAt) / 1000)) : 0;
    const chain = alarm ? getMissionChain(alarm) : [];
    const id = Date.now().toString();
    recordId.current = id;
    const record = {
      id,
      alarmId: alarm?.id ?? '',
      alarmTime: alarm?.time ?? '--:--',
      period: alarm?.period ?? '',
      missionId: chain[0]?.id ?? alarm?.mission?.id ?? '',
      missionTitle:
        chain.length > 1
          ? `${chain[0]?.title ?? 'Mission'} + ${chain.length - 1} more`
          : chain[0]?.title ?? alarm?.mission?.title ?? 'Wake Up Mission',
      chainIds: chain.length > 0 ? chain.map(m => m.id) : undefined,
      snoozeCount,
      completed: true,
      completedAt: new Date().toISOString(),
      durationSeconds,
    } as const;
    addAlarmHistory({ ...record });
    pushHistoryItem({ ...record }).catch(error => console.error('Cloud push failed:', error));
    // Remove the ringing notification; weekly triggers stay scheduled.
    if (alarm?.id) {
      stopRinging(alarm.id).catch(error => console.error('Failed to stop ringing:', error));
      cancelBackup(alarm.id).catch(error => console.error('Failed to cancel backup:', error));
    }
    // One-time alarms are spent: auto-disable so the dashboard never shows a
    // live alarm with no future trigger.
    if (alarm && (!alarm.dayNames || alarm.dayNames.length === 0) && alarm.enabled) {
      const spent = { ...alarm, enabled: false };
      updateAlarm(spent)
        .then(() => pushAlarm(spent).catch(error => console.error('Cloud push failed:', error)))
        .catch(error => console.error('Failed to disable one-time alarm:', error));
    }
    // Fall-back-asleep prevention: re-check minutes later unless disabled.
    if (alarm) {
      scheduleWakeCheck(alarm).catch(error =>
        console.error('Failed to schedule wake-up check:', error),
      );
    }
  }, [alarm, route.params?.startedAt, route.params?.snoozeCount]);

  const pickMood = (next: WakeMood) => {
    setMood(next);
    if (recordId.current) {
      updateAlarmHistory(recordId.current, { mood: next }).catch(error =>
        console.error('Failed to save mood:', error),
      );
    }
  };

  const goToDashboard = () => {
    setLeaving(true);
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  const handleViewReport = () => {
    // Alarm stack -> tab navigator, with a dashboard fallback.
    const parent = navigation.getParent();
    if (parent) parent.navigate('Report' as never);
    else goToDashboard();
  };

  const startedAt = route.params?.startedAt;
  const tookSeconds =
    typeof startedAt === 'number' ? Math.max(0, Math.round((Date.now() - startedAt) / 1000)) : null;
  const tookText =
    tookSeconds === null
      ? null
      : tookSeconds < 60
      ? `Took ${tookSeconds}s`
      : `Took ${Math.floor(tookSeconds / 60)}m ${tookSeconds % 60}s`;
  const snoozes = route.params?.snoozeCount ?? 0;
  const effortText = [tookText, snoozes > 0 ? `Snoozed ${snoozes}×` : 'No snoozes']
    .filter(Boolean)
    .join(' · ');

  if (!alarm) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text accessibilityRole="header" style={styles.title}>
            You're Awake!
          </Text>
          <Card>
            <Text style={styles.errorText}>
              Your wake-up was recorded, but the alarm details are missing.
            </Text>
          </Card>
          <View style={styles.actions}>
            <PrimaryButton label="Done" variant="dark" loading={leaving} onPress={goToDashboard} />
          </View>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.circle} accessibilityElementsHidden importantForAccessibility="no">
          <Text style={styles.check}>✓</Text>
        </View>

        <Text accessibilityRole="header" style={styles.title}>
          You're Awake!
        </Text>
        <Text style={styles.subtitle}>{effortText}</Text>

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>ALARM COMPLETED</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>SUCCESS</Text>
            </View>
          </View>
          <View style={styles.divider} />

          <InfoRow icon="◷" label="Wake-up time" value={`${alarm.time} ${alarm.period}`.trim()} />
          <InfoRow
            icon="✓"
            label="Mission"
            value={alarm.mission?.title ?? 'Wake-up mission'}
            description="Completed"
          />
          <InfoRow icon="♪" label="Alarm sound" value={alarm.sound?.name ?? 'Classic alarm'} />
        </Card>

        <View style={styles.message}>
          <Text style={styles.messageTitle}>How do you feel?</Text>
        </View>

        <View
          style={styles.moodRow}
          accessibilityRole="radiogroup"
          accessibilityLabel="Morning mood"
        >
          {(
            [
              { id: 'great', icon: '😄', label: 'Great' },
              { id: 'ok', icon: '🙂', label: 'OK' },
              { id: 'tired', icon: '🥱', label: 'Tired' },
            ] as const
          ).map(option => (
            <Text
              key={option.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: mood === option.id }}
              accessibilityLabel={`Feeling ${option.label}`}
              onPress={() => pickMood(option.id)}
              style={[styles.mood, mood === option.id && styles.moodSelected]}
            >
              {option.icon} {option.label}
            </Text>
          ))}
        </View>

        <View style={styles.actions}>
          <PrimaryButton label="Done" variant="dark" loading={leaving} onPress={goToDashboard} />
          <PrimaryButton
            label="View report"
            variant="ghost"
            disabled={leaving}
            onPress={handleViewReport}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    content: { paddingHorizontal: 20, paddingTop: SPACING.md, paddingBottom: SPACING.xl },
    circle: {
      width: 82,
      height: 82,
      borderRadius: 41,
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accentTint,
      marginBottom: 18,
    },
    check: { fontSize: 38, fontWeight: '700', color: colors.accent },
    title: {
      textAlign: 'center',
      fontSize: FONT.headline,
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: { textAlign: 'center', marginTop: 6, fontSize: FONT.body, color: colors.muted },
    errorText: { fontSize: FONT.body, lineHeight: 22, color: colors.text, textAlign: 'center' },
    card: { marginTop: SPACING.lg },
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardLabel: {
      fontSize: FONT.caption,
      fontWeight: '700',
      letterSpacing: 1.5,
      color: colors.muted,
    },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: RADIUS.sm,
      backgroundColor: colors.success,
    },
    badgeText: {
      fontSize: FONT.caption,
      fontWeight: '700',
      color: isDark ? '#0E2A1F' : colors.onDark,
    },
    divider: { height: 1, backgroundColor: colors.divider, marginVertical: SPACING.md },
    message: { marginTop: SPACING.lg, alignItems: 'center', paddingHorizontal: 8 },
    messageTitle: { fontSize: FONT.bodyLg, fontWeight: '700', color: colors.text },
    messageText: {
      marginTop: 4,
      fontSize: FONT.body,
      lineHeight: 20,
      textAlign: 'center',
      color: colors.muted,
    },
    moodRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: SPACING.sm,
      marginTop: SPACING.md,
    },
    mood: {
      minHeight: 44,
      textAlignVertical: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.softBorder,
      fontSize: FONT.body,
      fontWeight: '700',
      color: colors.muted,
      overflow: 'hidden',
    },
    moodSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
      color: colors.accent,
    },
    actions: { marginTop: SPACING.lg, gap: SPACING.sm },
  });

import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import Card from '../../components/Card';
import InfoRow from '../../components/InfoRow';
import PrimaryButton from '../../components/PrimaryButton';
import Screen from '../../components/Screen';
import ScreenHeader from '../../components/ScreenHeader';
import { DEFAULT_MISSION, DEFAULT_SOUND, MISSIONS, SOUNDS } from '../../data/options';
import { promptFixPermissions, scheduleAlarm } from '../../services/alarmScheduler';
import { pushAlarm } from '../../services/cloudSync';
import {
  addAlarm,
  DEFAULT_AUTO_DISMISS_MINUTES,
  DEFAULT_MAX_SNOOZES,
  DEFAULT_SNOOZE_MINUTES,
  DEFAULT_WAKE_CHECK_MINUTES,
  StoredAlarm,
  updateAlarm,
} from '../../storage/alarmStorage';
import { getDefaultAutoDismiss } from '../../storage/prefs';
import { useTheme, useThemeColors } from '../../store/ThemeContext';
import { FONT, RADIUS, SPACING, type ThemeColors } from '../../theme';
import type { AlarmScreenProps } from '../../types/navigation';
import { describeDays } from '../../utils/days';

export default function AlarmSummaryScreen({
  navigation,
  route,
}: AlarmScreenProps<'AlarmSummary'>) {
  const draft = route.params.alarm;
  const [saving, setSaving] = useState(false);
  const colors = useThemeColors();
  const { isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const [snoozeMinutes, setSnoozeMinutes] = useState(draft.snoozeMinutes ?? DEFAULT_SNOOZE_MINUTES);
  const [maxSnoozes, setMaxSnoozes] = useState(draft.maxSnoozes ?? DEFAULT_MAX_SNOOZES);
  const [autoDismissMinutes, setAutoDismissMinutes] = useState(
    draft.autoDismissMinutes ?? DEFAULT_AUTO_DISMISS_MINUTES,
  );
  const [wakeCheckMinutes, setWakeCheckMinutes] = useState(
    draft.wakeCheckMinutes ?? DEFAULT_WAKE_CHECK_MINUTES,
  );

  // New alarms start on the user's auto-dismiss default from Settings.
  useEffect(() => {
    if (draft.autoDismissMinutes !== undefined) return;
    getDefaultAutoDismiss().then(setAutoDismissMinutes);
  }, [draft.autoDismissMinutes]);

  const isEditing = !!draft.id;
  const enabled = draft.enabled ?? true;

  // BUG FIX: the sound lives in the draft. Before, it was read from a param that
  // was always undefined, so every alarm was saved as "Classic Alarm".
  const sound = draft.sound ?? SOUNDS.find(s => s.id === 'classic') ?? DEFAULT_SOUND;
  const mission = route.params.mission ?? draft.mission ?? DEFAULT_MISSION;
  const chain =
    draft.missions && draft.missions.length > 0
      ? draft.missions
      : [
          {
            id: mission.id,
            title: mission.title,
            description: mission.description,
            difficulty: mission.difficulty,
          },
        ];
  const missionIcon = MISSIONS.find(m => m.id === mission.id)?.icon ?? '∑';
  const soundIcon = SOUNDS.find(s => s.id === sound.id)?.icon ?? '♪';

  const minute = String(draft.minute).padStart(2, '0');
  const daysText = describeDays(draft.selectedDayNames);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    const alarmData: StoredAlarm = {
      id: draft.id ?? Date.now().toString(),
      time: `${draft.hour}:${minute}`,
      period: draft.period,
      days: daysText,
      dayNames: draft.selectedDayNames,
      label: draft.label?.trim() ? draft.label.trim() : undefined,
      sound: { id: sound.id, name: sound.name, description: sound.description, file: sound.file },
      mission: {
        id: chain[0].id,
        title: chain[0].title,
        description: chain[0].description,
        difficulty: chain[0].difficulty,
      },
      missions: chain,
      missionConfig: draft.missionConfig,
      snoozeMinutes,
      maxSnoozes,
      autoDismissMinutes,
      wakeCheckMinutes,
      enabled,
    };

    try {
      if (isEditing) await updateAlarm(alarmData);
      else await addAlarm(alarmData);

      // Scheduling is best-effort: the alarm is saved even if permission is missing.
      const result = await scheduleAlarm(alarmData);
      promptFixPermissions(result);
      pushAlarm(alarmData).catch(error => console.error('Cloud push failed:', error));

      navigation.reset({ index: 0, routes: [{ name: 'AlarmDashboard' }] });
    } catch (error) {
      console.error('Error saving alarm:', error);
      Alert.alert('Could not save alarm', 'Please try again.');
      setSaving(false);
    }
  };

  const buttonLabel = saving
    ? isEditing
      ? 'Updating Alarm...'
      : 'Saving Alarm...'
    : isEditing
    ? 'Update Alarm →'
    : 'Save Alarm →';

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <ScreenHeader
          title={isEditing ? 'Review changes' : 'Alarm Summary'}
          subtitle={isEditing ? 'Review your alarm changes' : 'Review your wake-up routine'}
          onBack={saving ? undefined : navigation.goBack}
        />

        <Card style={styles.timeCard}>
          <Text style={styles.cardLabel}>ALARM TIME</Text>
          <Text
            style={styles.time}
            accessibilityLabel={`${draft.hour}:${minute} ${draft.period}, ${daysText}`}
          >
            {draft.hour}:{minute}
            <Text style={styles.period}> {draft.period}</Text>
          </Text>
          <Text style={styles.days}>{daysText}</Text>
        </Card>

        <Card style={styles.detailsCard}>
          <InfoRow
            icon={soundIcon}
            label="ALARM SOUND"
            value={sound.name}
            description={sound.description}
          />
          {chain.map((m, i) => (
            <InfoRow
              key={m.id}
              icon={MISSIONS.find(x => x.id === m.id)?.icon ?? missionIcon}
              label={chain.length > 1 ? `MISSION ${i + 1} OF ${chain.length}` : 'WAKE-UP MISSION'}
              value={m.title}
              description={m.description}
            />
          ))}
        </Card>

        <Card style={styles.detailsCard}>
          <Text style={styles.cardLabel}>SNOOZE & BACKUP</Text>
          <BehaviorRow
            label="Snooze length"
            hint="Pause between re-rings"
            value={`${snoozeMinutes} min`}
            onMinus={() => setSnoozeMinutes(v => (v <= 1 ? 1 : v === 10 ? 5 : v === 5 ? 3 : 1))}
            onPlus={() => setSnoozeMinutes(v => (v >= 10 ? 10 : v === 5 ? 10 : v === 3 ? 5 : 3))}
          />
          <BehaviorRow
            label="Max snoozes"
            hint={maxSnoozes === 0 ? 'Off — no snooze button' : undefined}
            value={maxSnoozes === 0 ? 'Off' : `${maxSnoozes}`}
            onMinus={() => setMaxSnoozes(v => Math.max(0, v - 1))}
            onPlus={() => setMaxSnoozes(v => Math.min(5, v + 1))}
          />
          <BehaviorRow
            label="Auto-dismiss"
            hint="Silences itself if untouched"
            value={autoDismissMinutes === 0 ? 'Off' : `${autoDismissMinutes} min`}
            onMinus={() =>
              setAutoDismissMinutes(v => (v <= 0 ? 0 : v <= 15 ? 0 : v <= 30 ? 15 : 30))
            }
            onPlus={() =>
              setAutoDismissMinutes(v => (v >= 60 ? 60 : v < 15 ? 15 : v < 30 ? 30 : 60))
            }
          />
          <BehaviorRow
            label="Wake-up check"
            hint={wakeCheckMinutes === 0 ? 'Off' : 'Re-rings if you fall back asleep'}
            value={wakeCheckMinutes === 0 ? 'Off' : `${wakeCheckMinutes} min`}
            onMinus={() => setWakeCheckMinutes(v => (v <= 0 ? 0 : v <= 5 ? 0 : v <= 10 ? 5 : 10))}
            onPlus={() => setWakeCheckMinutes(v => (v >= 20 ? 20 : v < 5 ? 5 : v < 10 ? 10 : 20))}
          />
        </Card>

        <Card style={styles.statusCard}>
          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>{enabled ? 'Alarm enabled' : 'Alarm disabled'}</Text>
            <Text style={styles.statusSubtitle}>
              {enabled
                ? 'This alarm will ring at the selected time'
                : 'You can enable it from the dashboard'}
            </Text>
          </View>
          <View style={[styles.statusBadge, !enabled && styles.statusBadgeOff]}>
            <Text style={styles.statusBadgeText}>{enabled ? 'ON' : 'OFF'}</Text>
          </View>
        </Card>

        <View style={styles.actions}>
          <PrimaryButton
            label={buttonLabel}
            accessibilityLabel={isEditing ? 'Update alarm' : 'Save alarm'}
            variant="dark"
            loading={saving}
            onPress={handleSave}
          />
          <PrimaryButton
            label="Back"
            variant="ghost"
            disabled={saving}
            onPress={navigation.goBack}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function BehaviorRow({
  label,
  value,
  hint,
  onMinus,
  onPlus,
}: {
  label: string;
  value: string;
  hint?: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  const styles = createStyles(useThemeColors(), useTheme().isDark);
  return (
    <View style={styles.behaviorRow}>
      <View style={styles.behaviorText}>
        <Text style={styles.behaviorLabel}>{label}</Text>
        {hint ? <Text style={styles.behaviorHint}>{hint}</Text> : null}
      </View>
      <View style={styles.behaviorControls}>
        <Text accessibilityRole="button" onPress={onMinus} style={styles.behaviorButton}>
          −
        </Text>
        <Text style={styles.behaviorValue}>{value}</Text>
        <Text accessibilityRole="button" onPress={onPlus} style={styles.behaviorButton}>
          +
        </Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    content: { paddingHorizontal: 20, paddingTop: SPACING.sm, paddingBottom: SPACING.xl },
    timeCard: { marginTop: SPACING.md, alignItems: 'center', backgroundColor: colors.card },
    cardLabel: {
      fontSize: FONT.caption,
      fontWeight: '700',
      letterSpacing: 1.5,
      color: colors.muted,
    },
    time: { marginTop: 6, fontSize: 52, fontWeight: '700', color: colors.text },
    period: { fontSize: FONT.title, color: colors.accent },
    days: { marginTop: 4, fontSize: FONT.body, color: colors.muted },
    detailsCard: { marginTop: SPACING.md },
    statusCard: { marginTop: SPACING.md, flexDirection: 'row', alignItems: 'center' },
    statusText: { flex: 1 },
    statusTitle: { fontSize: FONT.bodyLg, fontWeight: '700', color: colors.text },
    statusSubtitle: { marginTop: 2, fontSize: FONT.caption, color: colors.muted },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: RADIUS.pill,
      backgroundColor: colors.success,
    },
    statusBadgeOff: { backgroundColor: colors.muted },
    statusBadgeText: {
      fontSize: FONT.caption,
      fontWeight: '700',
      color: isDark ? '#0E2A1F' : colors.onDark,
    },
    behaviorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: SPACING.sm,
    },
    behaviorText: { flex: 1 },
    behaviorLabel: { fontSize: FONT.body, fontWeight: '400', color: colors.text },
    behaviorHint: { marginTop: 2, fontSize: FONT.caption, color: colors.muted },
    behaviorControls: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    behaviorButton: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.accent,
      minWidth: 44,
      minHeight: 44,
      textAlign: 'center',
      textAlignVertical: 'center',
    },
    behaviorValue: {
      fontSize: FONT.bodyLg,
      fontWeight: '700',
      color: colors.text,
      minWidth: 64,
      textAlign: 'center',
    },
    actions: { marginTop: SPACING.lg, gap: SPACING.sm },
  });

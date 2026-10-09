import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import Card from '../../components/Card';
import InfoRow from '../../components/InfoRow';
import PrimaryButton from '../../components/PrimaryButton';
import Screen from '../../components/Screen';
import ScreenHeader from '../../components/ScreenHeader';
import { DEFAULT_MISSION, DEFAULT_SOUND, MISSIONS, SOUNDS } from '../../data/options';
import { addAlarm, StoredAlarm, updateAlarm } from '../../storage/alarmStorage';
import { COLORS, FONT, RADIUS, SPACING } from '../../theme';
import type { AlarmScreenProps } from '../../types/navigation';
import { describeDays } from '../../utils/days';

export default function AlarmSummaryScreen({
  navigation,
  route,
}: AlarmScreenProps<'AlarmSummary'>) {
  const draft = route.params.alarm;
  const [saving, setSaving] = useState(false);

  const isEditing = !!draft.id;
  const enabled = draft.enabled ?? true;

  // BUG FIX: the sound lives in the draft. Before, it was read from a param that
  // was always undefined, so every alarm was saved as "Classic Alarm".
  const sound = draft.sound ?? SOUNDS.find(s => s.id === 'classic') ?? DEFAULT_SOUND;
  const mission = route.params.mission ?? draft.mission ?? DEFAULT_MISSION;
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
      sound: { id: sound.id, name: sound.name, description: sound.description },
      mission: {
        id: mission.id,
        title: mission.title,
        description: mission.description,
        difficulty: mission.difficulty,
      },
      enabled,
    };

    try {
      if (isEditing) await updateAlarm(alarmData);
      else await addAlarm(alarmData);

      navigation.reset({ index: 0, routes: [{ name: 'AlarmDashboard' }] });
    } catch (error) {
      console.error('Error saving alarm:', error);
      Alert.alert('Could not save alarm', 'Please try again.');
      setSaving(false);
    }
  };

  const buttonLabel = saving
    ? isEditing ? 'Updating Alarm...' : 'Saving Alarm...'
    : isEditing ? 'Update Alarm →' : 'Save Alarm →';

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <ScreenHeader
          title={isEditing ? 'Edit Alarm' : 'Alarm Summary'}
          subtitle={isEditing ? 'Review your alarm changes' : 'Review your wake-up routine'}
          onBack={saving ? undefined : navigation.goBack}
        />

        <Card style={styles.timeCard}>
          <Text style={styles.cardLabel}>ALARM TIME</Text>
          <Text
            style={styles.time}
            accessibilityLabel={`${draft.hour}:${minute} ${draft.period}, ${daysText}`}>
            {draft.hour}:{minute}
            <Text style={styles.period}> {draft.period}</Text>
          </Text>
          <Text style={styles.days}>{daysText}</Text>
        </Card>

        <Card style={styles.detailsCard}>
          <InfoRow icon={soundIcon} label="ALARM SOUND" value={sound.name} description={sound.description} />
          <InfoRow icon={missionIcon} label="WAKE-UP MISSION" value={mission.title} description={mission.description} />
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
          <PrimaryButton label={buttonLabel} variant="dark" loading={saving} onPress={handleSave} />
          <PrimaryButton label="Back" variant="ghost" disabled={saving} onPress={navigation.goBack} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: SPACING.sm, paddingBottom: SPACING.xl },
  timeCard: { marginTop: SPACING.md, alignItems: 'center', backgroundColor: COLORS.card },
  cardLabel: { fontSize: FONT.caption, fontWeight: '700', letterSpacing: 1.5, color: COLORS.muted },
  time: { marginTop: 6, fontSize: 52, fontWeight: '700', color: COLORS.text },
  period: { fontSize: FONT.title, color: COLORS.accent },
  days: { marginTop: 4, fontSize: FONT.body, color: COLORS.muted },
  detailsCard: { marginTop: SPACING.md, paddingBottom: 2 },
  statusCard: { marginTop: SPACING.md, flexDirection: 'row', alignItems: 'center' },
  statusText: { flex: 1 },
  statusTitle: { fontSize: FONT.bodyLg, fontWeight: '700', color: COLORS.text },
  statusSubtitle: { marginTop: 2, fontSize: FONT.caption, color: COLORS.muted },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.success,
  },
  statusBadgeOff: { backgroundColor: COLORS.muted },
  statusBadgeText: { fontSize: FONT.caption, fontWeight: '700', color: COLORS.onDark },
  actions: { marginTop: SPACING.lg, gap: SPACING.sm },
});

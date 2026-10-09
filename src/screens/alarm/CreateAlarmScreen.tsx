import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Card from '../../components/Card';
import PrimaryButton from '../../components/PrimaryButton';
import Screen from '../../components/Screen';
import ScreenHeader from '../../components/ScreenHeader';
import TimeStepper from '../../components/TimeStepper';
import { COLORS, FONT, RADIUS, SPACING, TOUCH_MIN } from '../../theme';
import type { AlarmScreenProps } from '../../types/navigation';
import {
  DAYS,
  DEFAULT_REPEAT_IDS,
  dayIdsFromNames,
  dayNamesFromIds,
  describeDays,
} from '../../utils/days';
import { parseStoredTime } from '../../utils/time';

export default function CreateAlarmScreen({ navigation, route }: AlarmScreenProps<'CreateAlarm'>) {
  const editAlarm = route.params?.editAlarm;
  const isEditing = !!editAlarm;

  // Lazy initialisers: the edit data is ready on the first render (no flash of 7:52).
  const initial = parseStoredTime(editAlarm?.time, editAlarm?.period);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  const [period, setPeriod] = useState<'AM' | 'PM'>(initial.period);
  const [selectedDays, setSelectedDays] = useState<string[]>(() =>
    editAlarm ? dayIdsFromNames(editAlarm.dayNames ?? []) : DEFAULT_REPEAT_IDS,
  );

  const stepHour = (d: 1 | -1) => setHour(h => ((h - 1 + d + 12) % 12) + 1);
  const stepMinute = (d: 1 | -1) => setMinute(m => (m + d + 60) % 60);
  const toggleDay = (id: string) =>
    setSelectedDays(cur => (cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]));

  const minuteText = String(minute).padStart(2, '0');
  const selectedDayNames = dayNamesFromIds(selectedDays);
  const daysText = describeDays(selectedDayNames);

  const handleContinue = () => {
    navigation.navigate('SelectSound', {
      alarm: {
        id: editAlarm?.id,
        sound: editAlarm?.sound,
        mission: editAlarm?.mission,
        enabled: editAlarm?.enabled,
        hour,
        minute,
        period,
        selectedDays,
        selectedDayNames,
        isEditing,
      },
    });
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <ScreenHeader
          title={isEditing ? 'Edit Alarm' : 'Create Alarm'}
          subtitle={
            isEditing ? 'Update your wake-up time and routine' : 'Set your wake-up time and routine'
          }
          onBack={navigation.goBack}
        />

        <Card style={styles.timeCard}>
          <Text style={styles.sectionTitle}>Wake-up Time</Text>
          <Text style={styles.holdHint}>Press and hold ▲ ▼ to change quickly</Text>

          <View style={styles.timeRow}>
            <TimeStepper
              label="hour"
              value={String(hour).padStart(2, '0')}
              onIncrement={() => stepHour(1)}
              onDecrement={() => stepHour(-1)}
            />
            <Text style={styles.colon}>:</Text>
            <TimeStepper
              label="minute"
              value={minuteText}
              onIncrement={() => stepMinute(1)}
              onDecrement={() => stepMinute(-1)}
            />

            <View style={styles.periodColumn} accessibilityRole="radiogroup">
              {(['AM', 'PM'] as const).map(p => (
                <TouchableOpacity
                  key={p}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: period === p }}
                  onPress={() => setPeriod(p)}
                  style={[styles.periodButton, period === p && styles.periodSelected]}>
                  <Text style={[styles.periodText, period === p && styles.periodSelectedText]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Card>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Repeat Days</Text>
            <Text style={styles.helper}>Select days</Text>
          </View>
          <View style={styles.daysRow}>
            {DAYS.map(day => {
              const selected = selectedDays.includes(day.id);
              return (
                <TouchableOpacity
                  key={day.id}
                  accessibilityRole="checkbox"
                  accessibilityLabel={day.name}
                  accessibilityState={{ checked: selected }}
                  onPress={() => toggleDay(day.id)}
                  style={[styles.dayButton, selected && styles.daySelected]}>
                  <Text style={[styles.dayText, selected && styles.daySelectedText]}>{day.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Card style={styles.preview}>
          <Text style={styles.previewLabel}>{isEditing ? 'EDIT PREVIEW' : 'ALARM PREVIEW'}</Text>
          <View style={styles.previewRow}>
            <Text style={styles.previewTime}>
              {hour}:{minuteText}
            </Text>
            <Text style={styles.previewPeriod}>{period}</Text>
          </View>
          <Text style={styles.previewDays}>{daysText}</Text>
        </Card>

        <View style={styles.actions}>
          <PrimaryButton label="Continue →" variant="dark" onPress={handleContinue} />
          <PrimaryButton label="Cancel" variant="ghost" onPress={navigation.goBack} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const DAY_SIZE = 42;

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: SPACING.sm, paddingBottom: SPACING.xl },
  timeCard: { marginTop: SPACING.md, alignItems: 'center' },
  sectionTitle: { fontSize: FONT.bodyLg, fontWeight: '700', color: COLORS.text },
  holdHint: { marginTop: 2, fontSize: FONT.caption, color: COLORS.muted },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md },
  colon: { fontSize: 44, fontWeight: '700', color: COLORS.text, marginHorizontal: 2 },
  periodColumn: { marginLeft: SPACING.md, gap: 8 },
  periodButton: {
    minWidth: 56,
    height: TOUCH_MIN,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.softBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodSelected: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  periodText: { fontSize: FONT.body, fontWeight: '700', color: COLORS.muted },
  periodSelectedText: { color: COLORS.onAccent },
  section: { marginTop: SPACING.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  helper: { fontSize: FONT.caption, color: COLORS.muted },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.sm },
  dayButton: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    borderRadius: DAY_SIZE / 2,
    borderWidth: 1,
    borderColor: COLORS.softBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  dayText: { fontSize: FONT.body, fontWeight: '700', color: COLORS.muted },
  daySelectedText: { color: COLORS.onAccent },
  preview: { marginTop: SPACING.lg, alignItems: 'center', backgroundColor: COLORS.card },
  previewLabel: { fontSize: FONT.caption, fontWeight: '700', letterSpacing: 1.5, color: COLORS.muted },
  previewRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 6 },
  previewTime: { fontSize: 40, fontWeight: '700', color: COLORS.text },
  previewPeriod: { marginLeft: 6, fontSize: FONT.title, fontWeight: '700', color: COLORS.accent },
  previewDays: { marginTop: 2, fontSize: FONT.body, color: COLORS.muted },
  actions: { marginTop: SPACING.lg, gap: SPACING.sm },
});

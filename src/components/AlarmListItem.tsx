import React from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import type { StoredAlarm } from '../storage/alarmStorage';
import { missionChainTitle } from '../storage/alarmStorage';
import { FONT, RADIUS, SPACING, TOUCH_MIN, type ThemeColors } from '../theme';
import { useThemeColors } from '../store/ThemeContext';
import Card from './Card';
import InfoRow from './InfoRow';
import { buildTriggers } from '../utils/nextTrigger';
import { formatTimeUntil } from '../utils/time';

type Props = {
  alarm: StoredAlarm;
  onToggle: (enabled: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  /** Development only: opens the ringing screen for this alarm. */
  onTestRing?: () => void;
};

/** One alarm in the dashboard list. */
export default function AlarmListItem({ alarm, onToggle, onEdit, onDelete, onTestRing }: Props) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const nextTrigger = alarm.enabled
    ? buildTriggers(alarm).sort((a, b) => a.at.getTime() - b.at.getTime())[0]
    : undefined;
  const ringsText =
    alarm.enabled && nextTrigger?.at
      ? `Rings ${formatTimeUntil(nextTrigger.at, new Date())}`
      : alarm.days || 'No repeat';

  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <View
          style={styles.timeRow}
          accessible
          accessibilityLabel={`${alarm.time} ${alarm.period}, ${ringsText}`}
        >
          <Text style={styles.time}>{alarm.time}</Text>
          <Text style={styles.period}>{alarm.period}</Text>
        </View>
        <Switch
          accessibilityLabel={`Alarm ${alarm.time} ${alarm.period}`}
          value={alarm.enabled}
          onValueChange={onToggle}
          trackColor={{ false: colors.softBorder, true: colors.accentSoft }}
          thumbColor={alarm.enabled ? colors.accent : colors.surface}
        />
      </View>

      <View style={styles.daysRow}>
        <Text style={styles.days}>{[alarm.label, ringsText].filter(Boolean).join(' · ')}</Text>
        <View style={[styles.badge, !alarm.enabled && styles.badgeOff]}>
          <Text style={[styles.badgeText, !alarm.enabled && styles.badgeTextOff]}>
            {alarm.enabled ? 'ACTIVE' : 'OFF'}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.missionChip}>
        <Text style={styles.missionChipText}>✓ {missionChainTitle(alarm)}</Text>
      </View>
      <InfoRow icon="♪" label="SOUND" value={alarm.sound?.name ?? 'Classic Alarm'} />

      <View style={styles.actions}>
        <Text style={styles.status}>{alarm.enabled ? 'Alarm enabled' : 'Alarm disabled'}</Text>
        <View style={styles.buttons}>
          {onTestRing ? (
            <TouchableOpacity accessibilityRole="button" onPress={onTestRing} style={styles.link}>
              <Text style={styles.test}>Test ring</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Edit alarm ${alarm.time} ${alarm.period}`}
            onPress={onEdit}
            style={styles.link}
          >
            <Text style={styles.edit}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Delete alarm ${alarm.time} ${alarm.period}`}
            onPress={onDelete}
            style={styles.link}
          >
            <Text style={styles.delete}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: { marginBottom: SPACING.md },
    top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    timeRow: { flexDirection: 'row', alignItems: 'baseline' },
    time: { fontSize: 38, fontWeight: '700', color: colors.text },
    period: { marginLeft: 6, fontSize: FONT.bodyLg, fontWeight: '700', color: colors.accent },
    daysRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 2,
    },
    days: { fontSize: FONT.body, color: colors.muted },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: RADIUS.pill,
      backgroundColor: colors.accentTint,
    },
    badgeOff: { backgroundColor: colors.divider },
    badgeText: { fontSize: FONT.caption, fontWeight: '700', color: colors.accent },
    badgeTextOff: { color: colors.muted },
    divider: { height: 1, backgroundColor: colors.divider, marginVertical: SPACING.md },
    missionChip: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: RADIUS.pill,
      backgroundColor: colors.accentSoft,
      marginBottom: SPACING.sm,
    },
    missionChipText: { fontSize: FONT.caption, fontWeight: '700', color: colors.accent },
    actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    status: { fontSize: FONT.caption, color: colors.muted },
    buttons: { flexDirection: 'row', alignItems: 'center' },
    link: { minHeight: TOUCH_MIN, paddingHorizontal: 10, justifyContent: 'center' },
    edit: { fontSize: FONT.body, fontWeight: '700', color: colors.accent },
    delete: { fontSize: FONT.body, fontWeight: '700', color: colors.danger },
    test: { fontSize: FONT.body, fontWeight: '700', color: colors.muted },
  });

import React from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import type { StoredAlarm } from '../storage/alarmStorage';
import { COLORS, FONT, RADIUS, SPACING, TOUCH_MIN } from '../theme';
import Card from './Card';
import InfoRow from './InfoRow';

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
  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <View
          style={styles.timeRow}
          accessible
          accessibilityLabel={`${alarm.time} ${alarm.period}, ${alarm.days || 'Once'}`}
        >
          <Text style={styles.time}>{alarm.time}</Text>
          <Text style={styles.period}>{alarm.period}</Text>
        </View>
        <Switch
          accessibilityLabel={`Alarm ${alarm.time} ${alarm.period}`}
          value={alarm.enabled}
          onValueChange={onToggle}
          trackColor={{ false: COLORS.softBorder, true: COLORS.accentSoft }}
          thumbColor={alarm.enabled ? COLORS.accent : COLORS.surface}
        />
      </View>

      <View style={styles.daysRow}>
        <Text style={styles.days}>{alarm.days || 'Once'}</Text>
        <View style={[styles.badge, !alarm.enabled && styles.badgeOff]}>
          <Text style={[styles.badgeText, !alarm.enabled && styles.badgeTextOff]}>
            {alarm.enabled ? 'ACTIVE' : 'OFF'}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <InfoRow icon="✓" label="MISSION" value={alarm.mission?.title ?? 'Math Mission'} />
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

const styles = StyleSheet.create({
  card: { marginBottom: SPACING.md },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeRow: { flexDirection: 'row', alignItems: 'baseline' },
  time: { fontSize: 38, fontWeight: '700', color: COLORS.text },
  period: { marginLeft: 6, fontSize: FONT.bodyLg, fontWeight: '700', color: COLORS.accent },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  days: { fontSize: FONT.body, color: COLORS.muted },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.accentTint,
  },
  badgeOff: { backgroundColor: COLORS.divider },
  badgeText: { fontSize: FONT.caption, fontWeight: '700', color: COLORS.accent },
  badgeTextOff: { color: COLORS.muted },
  divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: SPACING.md },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  status: { fontSize: FONT.caption, color: COLORS.muted },
  buttons: { flexDirection: 'row', alignItems: 'center' },
  link: { minHeight: TOUCH_MIN, paddingHorizontal: 10, justifyContent: 'center' },
  edit: { fontSize: FONT.body, fontWeight: '700', color: COLORS.accent },
  delete: { fontSize: FONT.body, fontWeight: '700', color: COLORS.danger },
  test: { fontSize: FONT.body, fontWeight: '700', color: COLORS.muted },
});

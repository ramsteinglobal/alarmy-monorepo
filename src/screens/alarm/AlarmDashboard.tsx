import React, { useCallback, useState } from 'react';

// checks
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import AlarmListItem from '../../components/AlarmListItem';
import Card from '../../components/Card';
import PrimaryButton from '../../components/PrimaryButton';
import Screen from '../../components/Screen';
import { deleteAlarm, getAlarms, StoredAlarm, updateAlarm } from '../../storage/alarmStorage';
import { COLORS, FONT, SPACING, TOUCH_MIN } from '../../theme';
import type { AlarmScreenProps } from '../../types/navigation';

export default function AlarmDashboard({ navigation }: AlarmScreenProps<'AlarmDashboard'>) {
  const [alarms, setAlarms] = useState<StoredAlarm[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadAlarms = useCallback(async () => {
    try {
      setAlarms(await getAlarms());
    } catch (error) {
      console.error('Error loading alarms:', error);
    }
  }, []);

  // Reload every time the tab / screen comes back into focus (covers first load too).
  useFocusEffect(
    useCallback(() => {
      loadAlarms();
    }, [loadAlarms]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAlarms();
    setRefreshing(false);
  };

  const handleToggle = async (alarm: StoredAlarm, enabled: boolean) => {
    const apply = (value: boolean) =>
      setAlarms(cur => cur.map(a => (a.id === alarm.id ? { ...a, enabled: value } : a)));

    apply(enabled); // optimistic
    try {
      await updateAlarm({ ...alarm, enabled });
    } catch (error) {
      console.error('Error updating alarm:', error);
      apply(!enabled); // roll back if saving failed
    }
  };

  const handleDelete = (alarm: StoredAlarm) => {
    Alert.alert('Delete Alarm', `Delete the ${alarm.time} ${alarm.period} alarm?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteAlarm(alarm.id);
          setAlarms(cur => cur.filter(a => a.id !== alarm.id));
        },
      },
    ]);
  };

  const nextAlarm = alarms.find(a => a.enabled);

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSmall}>ALL / ACTIVE</Text>
            <Text accessibilityRole="header" style={styles.headerTitle}>Alarm</Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Refresh alarms"
            style={styles.menuButton}
            onPress={handleRefresh}>
            <Text style={styles.menuText}>•••</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.greeting}>
          <View style={styles.greetingRow}>
            <View style={styles.greetingIcon}>
              <Text style={styles.greetingIconText}>☀</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.greetingTitle}>Good morning</Text>
              <Text style={styles.greetingText}>Stay consistent with your wake-up routine.</Text>
            </View>
          </View>
        </Card>

        <View style={styles.next}>
          <Text style={styles.caption}>NEXT ALARM</Text>
          {nextAlarm ? (
            <View style={styles.nextRow}>
              <View>
                <Text style={styles.nextTime}>{nextAlarm.time}</Text>
                <Text style={styles.nextPeriod}>{nextAlarm.period}</Text>
              </View>
              <View style={styles.nextInfo}>
                <Text style={styles.nextDays}>{nextAlarm.days}</Text>
                <Text style={styles.nextMission}>{nextAlarm.mission?.title ?? 'Wake-up Mission'}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noNext}>No active alarm</Text>
          )}
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>My Alarms</Text>
          <Text style={styles.count}>{alarms.length}</Text>
        </View>

        {alarms.length === 0 ? (
          <Card style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>+</Text>
            </View>
            <Text style={styles.emptyTitle}>No alarms yet</Text>
            <Text style={styles.emptyText}>
              Create your first alarm and build your wake-up routine.
            </Text>
            <View style={styles.emptyButton}>
              <PrimaryButton label="CREATE ALARM" onPress={() => navigation.navigate('CreateAlarm')} />
            </View>
          </Card>
        ) : (
          alarms.map(alarm => (
            <AlarmListItem
              key={alarm.id}
              alarm={alarm}
              onToggle={enabled => handleToggle(alarm, enabled)}
              onEdit={() => navigation.navigate('CreateAlarm', { editAlarm: alarm })}
              onDelete={() => handleDelete(alarm)}
              onTestRing={__DEV__ ? () => navigation.navigate('AlarmRinging', { alarm }) : undefined}
            />
          ))
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Create new alarm"
        activeOpacity={0.85}
        style={styles.fab}
        onPress={() => navigation.navigate('CreateAlarm')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: SPACING.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerSmall: { fontSize: FONT.caption, fontWeight: '700', letterSpacing: 1.5, color: COLORS.muted },
  headerTitle: { fontSize: 32, fontWeight: '700', color: COLORS.text },
  menuButton: { width: TOUCH_MIN, height: TOUCH_MIN, alignItems: 'center', justifyContent: 'center' },
  menuText: { fontSize: FONT.title, color: COLORS.muted },
  greeting: { marginTop: SPACING.md, backgroundColor: COLORS.accentSoft, borderColor: COLORS.accentTint },
  greetingRow: { flexDirection: 'row', alignItems: 'center' },
  greetingIcon: {
    width: 44, height: 44, borderRadius: 22, marginRight: 12,
    backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center',
  },
  greetingIconText: { fontSize: FONT.title, color: COLORS.onAccent },
  greetingTitle: { fontSize: FONT.bodyLg, fontWeight: '700', color: COLORS.text },
  greetingText: { marginTop: 2, fontSize: FONT.body, color: COLORS.muted },
  next: { marginTop: SPACING.lg },
  caption: { fontSize: FONT.caption, fontWeight: '700', letterSpacing: 1.5, color: COLORS.muted },
  nextRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm },
  nextTime: { fontSize: 44, fontWeight: '700', color: COLORS.text },
  nextPeriod: { fontSize: FONT.bodyLg, fontWeight: '700', color: COLORS.accent },
  nextInfo: { marginLeft: SPACING.lg },
  nextDays: { fontSize: FONT.body, color: COLORS.muted },
  nextMission: { marginTop: 2, fontSize: FONT.bodyLg, fontWeight: '700', color: COLORS.text },
  noNext: { marginTop: SPACING.sm, fontSize: FONT.bodyLg, color: COLORS.muted },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.lg, marginBottom: SPACING.sm },
  listTitle: { fontSize: FONT.title, fontWeight: '700', color: COLORS.text },
  count: { fontSize: FONT.body, fontWeight: '700', color: COLORS.muted },
  empty: { alignItems: 'center', paddingVertical: SPACING.xl },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.accentTint, alignItems: 'center', justifyContent: 'center' },
  emptyIconText: { fontSize: 28, color: COLORS.accent },
  emptyTitle: { marginTop: SPACING.md, fontSize: FONT.title, fontWeight: '700', color: COLORS.text },
  emptyText: { marginTop: 4, fontSize: FONT.body, textAlign: 'center', color: COLORS.muted },
  emptyButton: { alignSelf: 'stretch', marginTop: SPACING.lg },
  bottomSpace: { height: 90 },
  fab: {
    position: 'absolute', right: 20, bottom: 20,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  fabText: { fontSize: 30, lineHeight: 34, color: COLORS.onAccent, fontWeight: '700' },
});

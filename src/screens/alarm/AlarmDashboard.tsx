import React, { useCallback, useState } from 'react';

// checks
import {
  ActivityIndicator,
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
import { cancelAlarm, promptFixPermissions, scheduleAlarm } from '../../services/alarmScheduler';
import { pushAlarm, pushAlarmDelete } from '../../services/cloudSync';
import { deleteAlarm, getAlarms, StoredAlarm, updateAlarm } from '../../storage/alarmStorage';
import {
  getAlarmReliabilityStatus,
  openExactAlarmSettings,
  openSystemNotificationSettings,
  type ReliabilityStatus,
} from '../../services/permissionsService';
import { useThemeColors } from '../../store/ThemeContext';
import { FONT, SPACING, TOUCH_MIN, type ThemeColors } from '../../theme';
import type { AlarmScreenProps } from '../../types/navigation';
import { buildTriggers } from '../../utils/nextTrigger';
import { formatTimeUntil } from '../../utils/time';
import { missionChainTitle } from '../../storage/alarmStorage';

export default function AlarmDashboard({ navigation }: AlarmScreenProps<'AlarmDashboard'>) {
  const [alarms, setAlarms] = useState<StoredAlarm[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reliability, setReliability] = useState<ReliabilityStatus | null>(null);
  const [now, setNow] = useState(() => new Date());
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const loadAlarms = useCallback(async () => {
    try {
      setAlarms(await getAlarms());
      setLoadError(false);
    } catch (error) {
      console.error('Error loading alarms:', error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
    try {
      setReliability(await getAlarmReliabilityStatus());
    } catch (error) {
      console.error('Error checking alarm permissions:', error);
    }
  }, []);

  // Reload every time the tab / screen comes back into focus (covers first load too).
  // The countdown also ticks every 30s while visible.
  useFocusEffect(
    useCallback(() => {
      loadAlarms();
      setNow(new Date());
      const timer = setInterval(() => setNow(new Date()), 30000);
      return () => clearInterval(timer);
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
      const updated = { ...alarm, enabled };
      await updateAlarm(updated);
      const result = await scheduleAlarm(updated);
      promptFixPermissions(result);
      pushAlarm(updated).catch(error => console.error('Cloud push failed:', error));
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
          try {
            await cancelAlarm(alarm.id);
            await deleteAlarm(alarm.id);
            setAlarms(cur => cur.filter(a => a.id !== alarm.id));
            pushAlarmDelete(alarm.id).catch(error => console.error('Cloud push failed:', error));
          } catch (error) {
            console.error('Error deleting alarm:', error);
            Alert.alert('Could not delete alarm', 'Please try again.');
          }
        },
      },
    ]);
  };

  const upcoming = [...alarms]
    .filter(a => a.enabled)
    .map(a => ({ alarm: a, at: buildTriggers(a, now)[0]?.at ?? null }))
    .filter((x): x is { alarm: StoredAlarm; at: Date } => x.at !== null)
    .sort((x, y) => x.at.getTime() - y.at.getTime());
  const next = upcoming[0] ?? null;

  const hour = now.getHours();
  const greeting =
    hour < 5
      ? 'Good night'
      : hour < 12
      ? 'Good morning'
      : hour < 18
      ? 'Good afternoon'
      : 'Good evening';
  const greetingIcon = hour < 5 || hour >= 18 ? '☾' : '☀';

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSmall}>
              {alarms.filter(a => a.enabled).length} ACTIVE · {alarms.length} TOTAL
            </Text>
            <Text accessibilityRole="header" style={styles.headerTitle}>
              Alarm
            </Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Refresh alarms"
            style={styles.menuButton}
            onPress={handleRefresh}
          >
            <Text style={styles.menuText}>↻</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.greeting}>
          <View style={styles.greetingRow}>
            <View style={styles.greetingIcon}>
              <Text style={styles.greetingIconText}>{greetingIcon}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.greetingTitle}>{greeting}</Text>
              <Text style={styles.greetingText}>
                {next
                  ? `${
                      next.alarm.label ? `${next.alarm.label} rings ` : 'Next alarm rings '
                    }${formatTimeUntil(next.at, now)}`
                  : 'Stay consistent with your wake-up routine.'}
              </Text>
            </View>
          </View>
        </Card>

        {next ? (
          <View style={styles.next}>
            <Text style={styles.caption}>NEXT ALARM</Text>
            <View style={styles.nextRow}>
              <View>
                <Text style={styles.nextTime}>{next.alarm.time}</Text>
                <Text style={styles.nextPeriod}>{next.alarm.period}</Text>
              </View>
              <View style={styles.nextInfo}>
                <Text style={styles.nextCountdown}>{formatTimeUntil(next.at, now)}</Text>
                <Text style={styles.nextDays}>
                  {[next.alarm.label, next.alarm.days].filter(Boolean).join(' · ')}
                </Text>
                <Text style={styles.nextMission}>{missionChainTitle(next.alarm)}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {alarms.some(a => a.enabled) &&
        (reliability?.notifications === 'denied' || reliability?.exactAlarm === 'denied') ? (
          <Card style={styles.warnCard}>
            <Text style={styles.warnTitle}>⚠ Alarm may not ring</Text>
            <Text style={styles.warnText}>
              {reliability?.notifications === 'denied'
                ? 'Notifications are off — alarms ring through notifications.'
                : 'Exact alarms are off — Android needs this to ring on time.'}
            </Text>
            <TouchableOpacity
              style={styles.warnButton}
              onPress={
                reliability?.notifications === 'denied'
                  ? openSystemNotificationSettings
                  : openExactAlarmSettings
              }
            >
              <Text style={styles.warnButtonText}>Fix now</Text>
            </TouchableOpacity>
          </Card>
        ) : null}

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>My Alarms</Text>
          <Text style={styles.count}>{alarms.length}</Text>
        </View>

        {!alarms.some(a => a.enabled) && alarms.length > 0 ? (
          <Text style={styles.noNext}>No active alarm — turn one on.</Text>
        ) : null}

        {loading ? (
          <Card style={styles.empty}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.emptyText}>Loading your alarms…</Text>
          </Card>
        ) : loadError && alarms.length === 0 ? (
          <Card style={styles.empty}>
            <Text style={styles.emptyTitle}>Couldn't load alarms</Text>
            <Text style={styles.emptyText}>Check your phone storage and try again.</Text>
            <View style={styles.emptyButton}>
              <PrimaryButton label="Try again" onPress={handleRefresh} />
            </View>
          </Card>
        ) : alarms.length === 0 ? (
          <Card style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>+</Text>
            </View>
            <Text style={styles.emptyTitle}>No alarms yet</Text>
            <Text style={styles.emptyText}>
              Create your first alarm and build your wake-up routine.
            </Text>
            <View style={styles.emptyButton}>
              <PrimaryButton
                label="Create alarm"
                onPress={() => navigation.navigate('CreateAlarm')}
              />
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
              onTestRing={
                __DEV__ ? () => navigation.navigate('AlarmRinging', { alarm }) : undefined
              }
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
        onPress={() => navigation.navigate('CreateAlarm')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    content: { paddingHorizontal: 20, paddingTop: SPACING.sm },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerSmall: {
      fontSize: FONT.caption,
      fontWeight: '700',
      letterSpacing: 1.5,
      color: colors.muted,
    },
    headerTitle: { fontSize: 32, fontWeight: '700', color: colors.text },
    menuButton: {
      width: TOUCH_MIN,
      height: TOUCH_MIN,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuText: { fontSize: FONT.title, color: colors.muted },
    greeting: {
      marginTop: SPACING.md,
      backgroundColor: colors.accentSoft,
      borderColor: colors.accentTint,
    },
    greetingRow: { flexDirection: 'row', alignItems: 'center' },
    greetingIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      marginRight: 12,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    greetingIconText: { fontSize: FONT.title, color: colors.onAccent },
    greetingTitle: { fontSize: FONT.bodyLg, fontWeight: '700', color: colors.text },
    greetingText: { marginTop: 2, fontSize: FONT.body, color: colors.muted },
    next: { marginTop: SPACING.lg },
    caption: {
      fontSize: FONT.caption,
      fontWeight: '700',
      letterSpacing: 1.5,
      color: colors.muted,
    },
    nextRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm },
    nextTime: { fontSize: 44, fontWeight: '700', color: colors.text },
    nextPeriod: { fontSize: FONT.bodyLg, fontWeight: '700', color: colors.accent },
    nextInfo: { marginLeft: SPACING.lg },
    nextCountdown: { fontSize: 22, fontWeight: '800', color: colors.accent },
    nextDays: { fontSize: FONT.body, color: colors.muted },
    nextMission: { marginTop: 2, fontSize: FONT.bodyLg, fontWeight: '700', color: colors.text },
    noNext: { marginTop: SPACING.sm, fontSize: FONT.bodyLg, color: colors.muted },
    listHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: SPACING.lg,
      marginBottom: SPACING.sm,
    },
    listTitle: { fontSize: FONT.title, fontWeight: '700', color: colors.text },
    count: { fontSize: FONT.body, fontWeight: '700', color: colors.muted },
    empty: { alignItems: 'center', paddingVertical: SPACING.xl },
    emptyIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.accentTint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyIconText: { fontSize: 28, color: colors.accent },
    emptyTitle: {
      marginTop: SPACING.md,
      fontSize: FONT.title,
      fontWeight: '700',
      color: colors.text,
    },
    emptyText: { marginTop: 4, fontSize: FONT.body, textAlign: 'center', color: colors.muted },
    emptyButton: { alignSelf: 'stretch', marginTop: SPACING.lg },
    warnCard: {
      marginTop: SPACING.md,
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
    },
    warnTitle: { fontSize: FONT.bodyLg, fontWeight: '700', color: colors.text },
    warnText: { marginTop: 4, fontSize: FONT.body, color: colors.muted },
    warnButton: {
      marginTop: SPACING.sm,
      alignSelf: 'flex-start',
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: colors.accent,
    },
    warnButtonText: { fontSize: FONT.body, fontWeight: '700', color: colors.onAccent },
    bottomSpace: { height: 90 },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 20,
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
    },
    fabText: { fontSize: 30, lineHeight: 34, color: colors.onAccent, fontWeight: '700' },
  });

import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { FONT, type ThemeColors } from '../../theme';
import { useThemeColors } from '../../store/ThemeContext';
import Card from '../../components/Card';
import PrimaryButton from '../../components/PrimaryButton';
import TimeStepper from '../../components/TimeStepper';
import LoginWall from '../../components/LoginWall';
import { useAuth } from '../../store/AuthContext';
import { pushSleepLog } from '../../services/cloudSync';
import {
  dateKey,
  formatDuration,
  getSleepGoalHours,
  getSleepLogs,
  saveSleepLog,
  sleepDurationMinutes,
  type SleepLog,
} from '../../storage/sleepStorage';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SleepDashboardScreen = () => {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { user } = useAuth();
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [goalHours, setGoalHours] = useState(8);
  const [bedHour, setBedHour] = useState(11);
  const [bedMinute, setBedMinute] = useState(15);
  const [bedPeriod, setBedPeriod] = useState<'AM' | 'PM'>('PM');
  const [wakeHour, setWakeHour] = useState(7);
  const [wakeMinute, setWakeMinute] = useState(0);
  const [wakePeriod, setWakePeriod] = useState<'AM' | 'PM'>('AM');
  const [saving, setSaving] = useState(false);

  const reload = useCallback(() => {
    getSleepLogs().then(setLogs);
    getSleepGoalHours().then(setGoalHours);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getSleepLogs().then(data => active && setLogs(data));
      getSleepGoalHours().then(h => active && setGoalHours(h));
      return () => {
        active = false;
      };
    }, []),
  );

  if (!user) {
    return (
      <LoginWall
        icon="☾"
        title="Sleep tracking needs an account"
        message="Sign in free to track sleep, keep your history, and sync across devices."
      />
    );
  }

  const last = logs[0] ?? null;
  const avg =
    logs.length > 0
      ? Math.round(
          logs.slice(0, 7).reduce((sum, l) => sum + l.durationMinutes, 0) /
            Math.min(logs.length, 7),
        )
      : 0;

  const stepHour = (
    setter: React.Dispatch<React.SetStateAction<number>>,
  ): { inc: () => void; dec: () => void } => ({
    inc: () => setter(h => ((h - 1 + 1 + 12) % 12) + 1),
    dec: () => setter(h => ((h - 1 - 1 + 12) % 12) + 1),
  });
  const stepMinute = (setter: React.Dispatch<React.SetStateAction<number>>) => ({
    inc: () => setter(m => (m + 5 + 60) % 60),
    dec: () => setter(m => (m - 5 + 60) % 60),
  });
  const bedH = stepHour(setBedHour);
  const bedM = stepMinute(setBedMinute);
  const wakeH = stepHour(setWakeHour);
  const wakeM = stepMinute(setWakeMinute);
  const previewMinutes = sleepDurationMinutes(
    bedHour,
    bedMinute,
    bedPeriod,
    wakeHour,
    wakeMinute,
    wakePeriod,
  );

  const handleSaveLog = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const pad = (n: number) => String(n).padStart(2, '0');
      const log = {
        date: dateKey(yesterday),
        bedtime: `${bedHour}:${pad(bedMinute)} ${bedPeriod}`,
        wakeTime: `${wakeHour}:${pad(wakeMinute)} ${wakePeriod}`,
        durationMinutes: previewMinutes,
      };
      await saveSleepLog(log);
      pushSleepLog(log).catch(error => console.error('Cloud push failed:', error));
      setLogs(await getSleepLogs());
      Alert.alert('Logged', `Last night: ${formatDuration(previewMinutes)} of sleep.`);
    } catch (error) {
      console.error('Failed to save sleep log:', error);
      Alert.alert('Could not save', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const weekDays = (() => {
    const out: { day: string; minutes: number }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const key = dateKey(d);
      const log = logs.find(l => l.date === key);
      out.push({ day: WEEKDAYS[d.getDay()].slice(0, 2), minutes: log?.durationMinutes ?? 0 });
    }
    return out;
  })();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSmall}>TODAY</Text>

            <Text style={styles.headerTitle}>Sleep</Text>
          </View>

          <TouchableOpacity
            style={styles.menuButton}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Refresh sleep"
            onPress={reload}
          >
            <Text style={styles.menuText}>↻</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Sleep Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>7-DAY AVERAGE</Text>

            <Text style={styles.duration}>{logs.length > 0 ? formatDuration(avg) : '--'}</Text>

            <Text style={styles.durationSubtitle}>of {goalHours}h goal</Text>

            {/* Progress */}
            <View style={styles.progressBackground}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${
                      logs.length > 0 ? Math.min((avg / (goalHours * 60)) * 100, 100) : 0
                    }%`,
                  },
                ]}
              />
            </View>

            <View style={styles.sleepTimes}>
              <View>
                <Text style={styles.timeLabel}>LOGGED NIGHTS</Text>

                <Text style={styles.timeValue}>{logs.length}</Text>
              </View>

              <View style={styles.timeRight}>
                <Text style={styles.timeLabel}>LAST NIGHT</Text>

                <Text style={styles.timeValue}>
                  {last ? formatDuration(last.durationMinutes) : '--'}
                </Text>
              </View>
            </View>
          </View>

          {/* Log Last Night */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Log Last Night</Text>

            <Text style={styles.sectionValue}>{formatDuration(previewMinutes)}</Text>
          </View>

          <Card>
            <Text style={styles.timeLabel}>BEDTIME</Text>
            <View style={styles.logRow}>
              <TimeStepper
                label="bed hour"
                value={String(bedHour).padStart(2, '0')}
                onIncrement={bedH.inc}
                onDecrement={bedH.dec}
              />
              <Text style={styles.colon}>:</Text>
              <TimeStepper
                label="bed minute"
                value={String(bedMinute).padStart(2, '0')}
                onIncrement={bedM.inc}
                onDecrement={bedM.dec}
              />
              <View style={styles.periodColumn} accessibilityRole="radiogroup">
                {(['AM', 'PM'] as const).map(p => (
                  <TouchableOpacity
                    key={p}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: bedPeriod === p }}
                    onPress={() => setBedPeriod(p)}
                    style={[styles.periodButton, bedPeriod === p && styles.periodSelected]}
                  >
                    <Text style={[styles.periodText, bedPeriod === p && styles.periodSelectedText]}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Text style={[styles.timeLabel, styles.logGap]}>WAKE TIME</Text>
            <View style={styles.logRow}>
              <TimeStepper
                label="wake hour"
                value={String(wakeHour).padStart(2, '0')}
                onIncrement={wakeH.inc}
                onDecrement={wakeH.dec}
              />
              <Text style={styles.colon}>:</Text>
              <TimeStepper
                label="wake minute"
                value={String(wakeMinute).padStart(2, '0')}
                onIncrement={wakeM.inc}
                onDecrement={wakeM.dec}
              />
              <View style={styles.periodColumn} accessibilityRole="radiogroup">
                {(['AM', 'PM'] as const).map(p => (
                  <TouchableOpacity
                    key={p}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: wakePeriod === p }}
                    onPress={() => setWakePeriod(p)}
                    style={[styles.periodButton, wakePeriod === p && styles.periodSelected]}
                  >
                    <Text
                      style={[styles.periodText, wakePeriod === p && styles.periodSelectedText]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.logAction}>
              <PrimaryButton
                label={saving ? 'Saving…' : 'SAVE SLEEP LOG'}
                loading={saving}
                onPress={handleSaveLog}
              />
            </View>
          </Card>

          {/* Sleep Details */}
          <Text style={styles.detailsTitle}>Recent Nights</Text>

          <View style={styles.detailsCard}>
            {logs.length === 0 ? (
              <Text style={styles.emptyText}>
                No logs yet. Log last night above and your week fills in here.
              </Text>
            ) : (
              logs.slice(0, 7).map((log, i) => (
                <View key={log.date}>
                  {i > 0 ? <View style={styles.divider} /> : null}
                  <SleepDetail
                    icon="☾"
                    label={log.date}
                    value={`${formatDuration(log.durationMinutes)} (${log.bedtime} → ${
                      log.wakeTime
                    })`}
                  />
                </View>
              ))
            )}
          </View>

          {/* Weekly History */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>This Week</Text>

            <Text style={styles.viewAll}>
              {weekDays.filter(d => d.minutes > 0).length} / 7 logged
            </Text>
          </View>

          <View style={styles.weekCard}>
            {weekDays.map((d, i) => (
              <WeekDay key={`${d.day}-${i}`} day={d.day} minutes={d.minutes} />
            ))}
          </View>

          {/* Sleep Goal */}
          <View style={styles.goalCard}>
            <View style={styles.goalIcon}>
              <Text style={styles.goalIconText}>☾</Text>
            </View>

            <View style={styles.goalContent}>
              <Text style={styles.goalTitle}>Sleep Goal</Text>

              <Text style={styles.goalText}>
                {goalHours} hours nightly. Change it in Settings → Sleep Goal.
              </Text>
            </View>
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

/* ============================================================
   SLEEP DETAIL
============================================================ */

type SleepDetailProps = {
  icon: string;
  label: string;
  value: string;
};

const SleepDetail = ({ icon, label, value }: SleepDetailProps) => {
  const styles = createStyles(useThemeColors());
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Text style={styles.detailIconText}>{icon}</Text>
      </View>

      <Text style={styles.detailLabel}>{label}</Text>

      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
};

/* ============================================================
   WEEK DAY
============================================================ */

type WeekDayProps = {
  day: string;
  minutes: number;
};

const WeekDay = ({ day, minutes }: WeekDayProps) => {
  const styles = createStyles(useThemeColors());
  const active = minutes > 0;
  return (
    <View style={styles.weekDay}>
      <Text style={styles.weekDayName}>{day}</Text>

      <View style={[styles.weekBarContainer, !active && styles.weekBarInactive]}>
        {active && (
          <View
            style={[
              styles.weekBar,
              {
                height: Math.max(8, Math.min(70, Math.round((minutes / 600) * 70))),
              },
            ]}
          />
        )}
      </View>

      <Text style={styles.weekHours}>{active ? (minutes / 60).toFixed(1) : '--'}</Text>
    </View>
  );
};

/* ============================================================
   STYLES
============================================================ */

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },

    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 15,
    },

    headerSmall: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.muted,
      letterSpacing: 1,
    },

    headerTitle: {
      fontSize: FONT.headline,
      fontWeight: '700',
      color: colors.text,
      marginTop: 3,
    },

    menuButton: {
      width: 44,
      height: 44,
      borderRadius: 21,
      backgroundColor: colors.divider,
      alignItems: 'center',
      justifyContent: 'center',
    },

    menuText: {
      fontSize: 25,
      color: colors.text,
    },

    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 25,
    },

    /* Summary */

    summaryCard: {
      backgroundColor: colors.accentSoft,
      borderRadius: 18,
      padding: 16,
    },

    summaryLabel: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1,
      color: colors.muted,
    },

    duration: {
      fontSize: 38,
      fontWeight: '700',
      color: colors.text,
      marginTop: 5,
    },

    durationSubtitle: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
    },

    progressBackground: {
      height: 7,
      backgroundColor: colors.softBorder,
      borderRadius: 4,
      overflow: 'hidden',
      marginTop: 17,
    },

    progressFill: {
      height: '100%',
      backgroundColor: colors.accent,
      borderRadius: 4,
    },

    sleepTimes: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 17,
    },

    timeRight: {
      alignItems: 'flex-end',
    },

    timeLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.muted,
      letterSpacing: 0.8,
    },

    timeValue: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
      marginTop: 3,
    },

    /* Section */

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 23,
      marginBottom: 10,
    },

    sectionTitle: {
      fontSize: FONT.bodyLg,
      fontWeight: '700',
      color: colors.text,
    },

    sectionValue: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.accent,
    },

    viewAll: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.accent,
    },

    /* Details */

    detailsTitle: {
      fontSize: FONT.bodyLg,
      fontWeight: '700',
      color: colors.text,
      marginTop: 23,
      marginBottom: 10,
    },

    detailsCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      paddingHorizontal: 15,
    },

    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 13,
    },

    detailIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.iconBg,
      alignItems: 'center',
      justifyContent: 'center',
    },

    detailIconText: {
      fontSize: 15,
      color: colors.accent,
    },

    detailLabel: {
      flex: 1,
      fontSize: 12,
      color: colors.text,
      marginLeft: 11,
    },

    detailValue: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },

    divider: {
      height: 1,
      backgroundColor: colors.divider,
    },

    /* Week */

    weekCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      paddingHorizontal: 12,
      paddingTop: 15,
      paddingBottom: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },

    weekDay: {
      alignItems: 'center',
      flex: 1,
    },

    weekDayName: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.muted,
      marginBottom: 7,
    },

    weekBarContainer: {
      width: 19,
      height: 70,
      borderRadius: 10,
      backgroundColor: colors.accentSoft,
      justifyContent: 'flex-end',
      overflow: 'hidden',
    },

    weekBar: {
      width: '100%',
      backgroundColor: colors.accent,
      borderRadius: 10,
    },

    weekBarInactive: {
      backgroundColor: colors.divider,
    },

    weekHours: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 6,
    },

    /* Goal */

    goalCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 15,
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },

    goalIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },

    goalIconText: {
      fontSize: 19,
      color: colors.accent,
    },

    goalContent: {
      flex: 1,
      marginLeft: 12,
    },

    goalTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },

    goalText: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 3,
    },

    goalArrow: {
      fontSize: 23,
      color: colors.muted,
    },

    logRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    colon: { fontSize: 32, fontWeight: '700', color: colors.text, marginHorizontal: 2 },
    periodButton: {
      marginLeft: 12,
      minWidth: 56,
      height: 44,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.softBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    periodColumn: {
      marginLeft: 8,
      justifyContent: 'center',
    },
    periodSelected: {
      backgroundColor: colors.accent,
    },
    periodSelectedText: {
      color: '#FFFFFF',
    },
    periodText: { fontSize: 14, fontWeight: '700', color: colors.accent },
    logGap: { marginTop: 14 },
    logAction: { marginTop: 16 },
    emptyText: { fontSize: 13, color: colors.muted, lineHeight: 19, paddingVertical: 12 },

    bottomSpace: {
      height: 30,
    },
  });

export default SleepDashboardScreen;

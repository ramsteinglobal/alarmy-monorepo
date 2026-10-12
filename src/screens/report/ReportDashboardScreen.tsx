import React, { useCallback, useState } from 'react';

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFocusEffect } from '@react-navigation/native';

import { FONT, type ThemeColors } from '../../theme';
import { useThemeColors } from '../../store/ThemeContext';
import { AlarmHistoryItem, getAlarmHistory } from '../../storage/alarmHistory';
import {
  formatDuration,
  getSleepGoalHours,
  getSleepLogs,
  type SleepLog,
} from '../../storage/sleepStorage';
import LoginWall from '../../components/LoginWall';
import { useAuth } from '../../store/AuthContext';

type WeekData = {
  day: string;
  value: number;
  height: number;
};

const ReportDashboardScreen = () => {
  const [history, setHistory] = useState<AlarmHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [sleepGoalHours, setSleepGoalHours] = useState(8);
  const { user } = useAuth();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  // ============================================================
  // LOAD HISTORY
  // ============================================================

  const loadHistory = async () => {
    try {
      setLoading(true);

      const data = await getAlarmHistory();

      setHistory(data);
      setSleepLogs(await getSleepLogs());
      setSleepGoalHours(await getSleepGoalHours());
      setLoadError(false);
    } catch (error) {
      console.error('Error loading alarm history:', error);
      setHistory([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, []),
  );

  // ============================================================
  // DATE HELPERS
  // ============================================================

  const getDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate(),
    ).padStart(2, '0')}`;
  };

  const isWithinLast7Days = (dateString: string) => {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return false;
    }

    const now = new Date();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const difference = today.getTime() - target.getTime();

    const days = difference / (1000 * 60 * 60 * 24);

    return days >= 0 && days < 7;
  };

  // ============================================================
  // WEEKLY DATA
  // ============================================================

  const getWeekData = (): WeekData[] => {
    const now = new Date();

    const days: WeekData[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);

      const dateKey = getDateKey(date);

      const completedCount = history.filter(item => {
        if (!item.completed) {
          return false;
        }

        const itemDate = new Date(item.completedAt);

        if (Number.isNaN(itemDate.getTime())) {
          return false;
        }

        return getDateKey(itemDate) === dateKey;
      }).length;

      /*
       * Since the current history model only records completed
       * alarms, a day with a completed alarm is represented as
       * 100% consistency.
       *
       * A day without history is represented as 0%.
       */
      const value = completedCount > 0 ? 100 : 0;

      days.push({
        day: date
          .toLocaleDateString('en-US', {
            weekday: 'short',
          })
          .charAt(0),
        value,
        height: value > 0 ? 75 : 0,
      });
    }

    return days;
  };

  const weekData = getWeekData();

  // ============================================================
  // WEEKLY HISTORY
  // ============================================================

  const weeklyHistory = history.filter(item => isWithinLast7Days(item.completedAt));

  const completedAlarms = weeklyHistory.filter(item => item.completed).length;

  /*
   * There is no failed-alarm record in the current
   * AlarmHistoryItem model, so mission success is based
   * on completed history entries.
   */
  const missionSuccess =
    weeklyHistory.length > 0
      ? Math.round(
          (weeklyHistory.filter(item => item.completed).length / weeklyHistory.length) * 100,
        )
      : 0;

  // ============================================================
  // CURRENT STREAK
  // ============================================================

  const calculateStreak = () => {
    if (history.length === 0) {
      return 0;
    }

    const completedDates = new Set(
      history
        .filter(item => item.completed)
        .map(item => {
          const date = new Date(item.completedAt);

          if (Number.isNaN(date.getTime())) {
            return '';
          }

          return getDateKey(date);
        })
        .filter(Boolean),
    );

    let streak = 0;

    const today = new Date();

    /*
     * Start from today.
     * If there is no completion today, check from yesterday.
     */
    let checkDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (!completedDates.has(getDateKey(checkDate))) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (completedDates.has(getDateKey(checkDate))) {
      streak += 1;

      checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
  };

  const currentStreak = calculateStreak();

  // ============================================================
  // MISSION PERFORMANCE
  // ============================================================

  const getMissionStats = (missionId: string) => {
    const missionHistory = weeklyHistory.filter(
      item => item.missionId === missionId || item.chainIds?.includes(missionId),
    );

    const completed = missionHistory.filter(item => item.completed).length;

    const total = missionHistory.length;

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      completed,
      total,
      percentage,
    };
  };

  const mathStats = getMissionStats('math');
  const typingStats = getMissionStats('typing');
  const photoStats = getMissionStats('photo');
  const memoryStats = getMissionStats('memory');
  const shakeStats = getMissionStats('shake');
  const squatStats = getMissionStats('squat');
  const barcodeStats = getMissionStats('barcode');
  const tapStats = getMissionStats('tap');

  // ============================================================
  // SLEEP (from real sleep logs, never invented)
  // ============================================================

  const recentSleep = sleepLogs.slice(0, 7);
  const avgSleepMinutes =
    recentSleep.length > 0
      ? Math.round(recentSleep.reduce((sum, l) => sum + l.durationMinutes, 0) / recentSleep.length)
      : 0;
  const sleepGoalMinutes = sleepGoalHours * 60;
  const sleepGoalPct =
    avgSleepMinutes > 0 ? Math.min(100, Math.round((avgSleepMinutes / sleepGoalMinutes) * 100)) : 0;

  // ============================================================
  // MOOD (from wake-up check-ins)
  // ============================================================

  const moodCounts = {
    great: weeklyHistory.filter(item => item.mood === 'great').length,
    ok: weeklyHistory.filter(item => item.mood === 'ok').length,
    tired: weeklyHistory.filter(item => item.mood === 'tired').length,
  };
  const moodTotal = moodCounts.great + moodCounts.ok + moodCounts.tired;

  const wokeEarly = (time: string, period: string): boolean => {
    const [h] = time.split(':').map(n => parseInt(n, 10));
    if (!Number.isInteger(h)) return false;
    const hour24 = (h % 12) + (period === 'PM' ? 12 : 0);
    return hour24 < 7;
  };
  const isEarlyBird = weeklyHistory.some(item => wokeEarly(item.alarmTime, item.period));

  // ============================================================
  // OVERALL CONSISTENCY
  // ============================================================

  const completedDays = weekData.filter(item => item.value > 0).length;

  const weeklyConsistency = completedDays > 0 ? Math.round((completedDays / 7) * 100) : 0;

  // ============================================================
  // INSIGHT
  // ============================================================

  const getInsight = () => {
    if (history.length === 0) {
      return {
        title: 'Start building your wake-up routine',
        text: 'Complete your first alarm mission and your progress will appear here.',
      };
    }

    if (currentStreak >= 5) {
      return {
        title: 'You are building a strong routine',
        text: `You have successfully completed alarms for ${currentStreak} consecutive days. Keep going!`,
      };
    }

    if (completedAlarms > 0) {
      return {
        title: 'Good progress',
        text: 'Keep completing your wake-up missions to build a consistent routine.',
      };
    }

    return {
      title: 'Keep working on consistency',
      text: 'Complete your scheduled missions to improve your wake-up routine.',
    };
  };

  const insight = getInsight();

  if (!user) {
    return (
      <LoginWall
        icon="▥"
        title="Reports need an account"
        message="Sign in free to keep your wake-up history, streaks, and progress across devices."
      />
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}

        <View style={styles.header}>
          <View>
            <Text style={styles.headerSmall}>YOUR PROGRESS</Text>

            <Text style={styles.headerTitle}>Report</Text>
          </View>

          <TouchableOpacity
            style={styles.menuButton}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Refresh report"
            onPress={loadHistory}
          >
            <Text style={styles.menuText}>↻</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Weekly Overview */}

          {loading ? (
            <View style={styles.overviewCard}>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.overviewDescription}>Loading your progress…</Text>
            </View>
          ) : loadError && history.length === 0 ? (
            <View style={styles.overviewCard}>
              <Text style={styles.overviewTitle}>Couldn't load report</Text>
              <Text style={styles.overviewDescription}>
                Check your phone storage and try again.
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadHistory}>
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.overviewCard}>
              <View style={styles.overviewHeader}>
                <View>
                  <Text style={styles.overviewLabel}>THIS WEEK</Text>

                  <Text style={styles.overviewTitle}>
                    {loading
                      ? 'Loading progress…'
                      : history.length > 0
                      ? 'Great progress'
                      : 'Start your journey'}
                  </Text>
                </View>

                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreBadgeText}>{weeklyConsistency}%</Text>
                </View>
              </View>

              <Text style={styles.overviewDescription}>
                {history.length > 0
                  ? 'Your wake-up consistency based on completed missions.'
                  : 'Complete an alarm mission to start tracking your progress.'}
              </Text>

              <View style={styles.progressBackground}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${weeklyConsistency}%`,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Key Stats */}

          <Text style={styles.sectionTitle}>Weekly Stats</Text>

          <View style={styles.statsGrid}>
            <StatCard
              icon="◷"
              value={avgSleepMinutes > 0 ? formatDuration(avgSleepMinutes) : '--'}
              label="Avg. Sleep"
            />

            <StatCard icon="✓" value={`${completedAlarms} / 7`} label="Alarms Completed" />

            <StatCard icon="🔥" value={`${currentStreak} days`} label="Current Streak" />

            <StatCard icon="◎" value={`${missionSuccess}%`} label="Mission Success" />
          </View>

          {/* Wake-up Consistency */}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderTitle}>Wake-Up Consistency</Text>

            <Text style={styles.sectionAction}>This week</Text>
          </View>

          <View style={styles.chartCard}>
            <View style={styles.chartTop}>
              <View>
                <Text style={styles.chartValue}>{weeklyConsistency}%</Text>

                <Text style={styles.chartDescription}>Average consistency</Text>
              </View>

              <Text style={styles.chartTrend}>{weeklyConsistency > 0 ? 'Active' : '--'}</Text>
            </View>

            <View style={styles.chart}>
              {weekData.map((item, index) => (
                <View key={`${item.day}-${index}`} style={styles.chartColumn}>
                  <View style={styles.chartBarArea}>
                    {item.value > 0 && (
                      <View
                        style={[
                          styles.chartBar,
                          {
                            height: item.height,
                          },
                        ]}
                      />
                    )}
                  </View>

                  <Text style={styles.chartDay}>{item.day}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Sleep Overview */}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderTitle}>Sleep Overview</Text>

            <Text style={styles.sectionAction}>7 days</Text>
          </View>

          <View style={styles.sleepCard}>
            {recentSleep.length === 0 ? (
              <View style={styles.sleepMain}>
                <Text style={styles.sleepDuration}>No sleep logs yet</Text>

                <Text style={styles.sleepSubtitle}>Log nights on the Sleep tab</Text>
              </View>
            ) : (
              <>
                <View style={styles.sleepMain}>
                  <Text style={styles.sleepDuration}>{formatDuration(avgSleepMinutes)}</Text>

                  <Text style={styles.sleepSubtitle}>average sleep duration</Text>
                </View>

                <View style={styles.sleepGoal}>
                  <View style={styles.sleepGoalCircle}>
                    <Text style={styles.sleepGoalNumber}>{sleepGoalPct}</Text>
                  </View>

                  <View>
                    <Text style={styles.sleepGoalTitle}>Goal progress</Text>

                    <Text style={styles.sleepGoalText}>
                      {sleepGoalPct}% of {sleepGoalHours}h target
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Mood This Week */}

          <Text style={styles.sectionTitle}>Mood This Week</Text>

          <View style={styles.missionCard}>
            {moodTotal === 0 ? (
              <Text style={styles.moodEmpty}>
                No check-ins yet. Rate your morning on the success screen after waking up.
              </Text>
            ) : (
              <>
                <MissionRow
                  icon="😄"
                  name="Great mornings"
                  completed={String(moodCounts.great)}
                  total={String(moodTotal)}
                  percentage={`${Math.round((moodCounts.great / moodTotal) * 100)}%`}
                />

                <View style={styles.divider} />

                <MissionRow
                  icon="🙂"
                  name="OK mornings"
                  completed={String(moodCounts.ok)}
                  total={String(moodTotal)}
                  percentage={`${Math.round((moodCounts.ok / moodTotal) * 100)}%`}
                />

                <View style={styles.divider} />

                <MissionRow
                  icon="🥱"
                  name="Tired mornings"
                  completed={String(moodCounts.tired)}
                  total={String(moodTotal)}
                  percentage={`${Math.round((moodCounts.tired / moodTotal) * 100)}%`}
                />
              </>
            )}
          </View>

          {/* Mission Performance */}

          <Text style={styles.sectionTitle}>Mission Performance</Text>

          <View style={styles.missionCard}>
            <MissionRow
              icon="➗"
              name="Math Mission"
              completed={String(mathStats.completed)}
              total={String(mathStats.total)}
              percentage={`${mathStats.percentage}%`}
            />

            <View style={styles.divider} />

            <MissionRow
              icon="⌨"
              name="Typing Mission"
              completed={String(typingStats.completed)}
              total={String(typingStats.total)}
              percentage={`${typingStats.percentage}%`}
            />

            <View style={styles.divider} />

            <MissionRow
              icon="📷"
              name="Photo Mission"
              completed={String(photoStats.completed)}
              total={String(photoStats.total)}
              percentage={`${photoStats.percentage}%`}
            />

            <View style={styles.divider} />

            <MissionRow
              icon="◆"
              name="Memory Mission"
              completed={String(memoryStats.completed)}
              total={String(memoryStats.total)}
              percentage={`${memoryStats.percentage}%`}
            />

            <View style={styles.divider} />

            <MissionRow
              icon="↔"
              name="Shake Mission"
              completed={String(shakeStats.completed)}
              total={String(shakeStats.total)}
              percentage={`${shakeStats.percentage}%`}
            />

            <View style={styles.divider} />

            <MissionRow
              icon="↕"
              name="Squat Mission"
              completed={String(squatStats.completed)}
              total={String(squatStats.total)}
              percentage={`${squatStats.percentage}%`}
            />

            <View style={styles.divider} />

            <MissionRow
              icon="▥"
              name="Barcode Mission"
              completed={String(barcodeStats.completed)}
              total={String(barcodeStats.total)}
              percentage={`${barcodeStats.percentage}%`}
            />

            <View style={styles.divider} />

            <MissionRow
              icon="👆"
              name="Tap Challenge"
              completed={String(tapStats.completed)}
              total={String(tapStats.total)}
              percentage={`${tapStats.percentage}%`}
            />
          </View>

          {/* Achievements */}

          <Text style={styles.sectionTitle}>Achievements</Text>

          <View style={styles.achievementCard}>
            <Achievement
              icon="🔥"
              title="5 Day Streak"
              description="Woke up successfully for 5 days"
              completed={currentStreak >= 5}
            />

            <View style={styles.divider} />

            <Achievement
              icon="☀"
              title="Early Bird"
              description="Wake up before 7:00 AM"
              completed={isEarlyBird}
            />

            <View style={styles.divider} />

            <Achievement
              icon="★"
              title="Mission Master"
              description="Complete 10 missions"
              completed={history.length >= 10}
            />
          </View>

          {/* Insight */}

          <View style={styles.insightCard}>
            <Text style={styles.insightLabel}>YOUR INSIGHT</Text>

            <Text style={styles.insightTitle}>{insight.title}</Text>

            <Text style={styles.insightText}>{insight.text}</Text>
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

/* ============================================================
   STAT CARD
============================================================ */

type StatCardProps = {
  icon: string;
  value: string;
  label: string;
};

const StatCard = ({ icon, value, label }: StatCardProps) => {
  const styles = createStyles(useThemeColors());
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Text style={styles.statIconText}>{icon}</Text>
      </View>

      <Text style={styles.statValue}>{value}</Text>

      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

/* ============================================================
   MISSION ROW
============================================================ */

type MissionRowProps = {
  icon: string;
  name: string;
  completed: string;
  total: string;
  percentage: `${number}%`;
};

const MissionRow = ({ icon, name, completed, total, percentage }: MissionRowProps) => {
  const styles = createStyles(useThemeColors());
  return (
    <View style={styles.missionRow}>
      <View style={styles.missionIcon}>
        <Text style={styles.missionIconText}>{icon}</Text>
      </View>

      <View style={styles.missionContent}>
        <View style={styles.missionHeader}>
          <Text style={styles.missionName}>{name}</Text>

          <Text style={styles.missionPercentage}>{percentage}</Text>
        </View>

        <View style={styles.missionProgressBackground}>
          <View
            style={[
              styles.missionProgress,
              {
                width: percentage,
              },
            ]}
          />
        </View>

        <Text style={styles.missionAttempts}>
          {completed} of {total} completed
        </Text>
      </View>
    </View>
  );
};

/* ============================================================
   ACHIEVEMENT
============================================================ */

type AchievementProps = {
  icon: string;
  title: string;
  description: string;
  completed: boolean;
};

const Achievement = ({ icon, title, description, completed }: AchievementProps) => {
  const styles = createStyles(useThemeColors());
  return (
    <View style={[styles.achievementRow, !completed && styles.achievementDisabled]}>
      <View style={styles.achievementIcon}>
        <Text style={styles.achievementIconText}>{icon}</Text>
      </View>

      <View style={styles.achievementContent}>
        <Text style={styles.achievementTitle}>{title}</Text>

        <Text style={styles.achievementDescription}>{description}</Text>
      </View>

      <View style={[styles.achievementCheck, !completed && styles.achievementCheckDisabled]}>
        <Text style={styles.achievementCheckText}>{completed ? '✓' : '•'}</Text>
      </View>
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

    overviewCard: {
      backgroundColor: colors.accentSoft,
      borderRadius: 18,
      padding: 18,
    },

    overviewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    overviewLabel: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1,
      color: colors.muted,
    },

    overviewTitle: {
      fontSize: FONT.title,
      fontWeight: '700',
      color: colors.text,
      marginTop: 4,
    },

    scoreBadge: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },

    scoreBadgeText: {
      fontSize: FONT.body,
      fontWeight: '800',
      color: colors.accent,
    },

    overviewDescription: {
      fontSize: 12,
      color: colors.muted,
      lineHeight: 17,
      marginTop: 9,
    },

    retryButton: {
      marginTop: 15,
      alignSelf: 'flex-start',
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 18,
      borderRadius: 10,
      backgroundColor: colors.accent,
    },

    retryText: { fontSize: FONT.body, fontWeight: '700', color: colors.onAccent },

    progressBackground: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.softBorder,
      overflow: 'hidden',
      marginTop: 15,
    },

    progressFill: {
      height: '100%',
      backgroundColor: colors.accent,
    },

    sectionTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      marginTop: 23,
      marginBottom: 10,
    },

    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },

    statCard: {
      width: '48%',
      backgroundColor: colors.surface,
      borderRadius: 17,
      padding: 15,
    },

    statIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 9,
    },

    statIconText: {
      fontSize: FONT.body,
      color: colors.accent,
    },

    statValue: {
      fontSize: FONT.title,
      fontWeight: '700',
      color: colors.text,
    },

    statLabel: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 3,
    },

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 23,
      marginBottom: 10,
    },

    sectionHeaderTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
    },

    sectionAction: {
      fontSize: 12,
      color: colors.accent,
      fontWeight: '600',
    },

    chartCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 18,
    },

    chartTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    chartValue: {
      fontSize: FONT.headline,
      fontWeight: '700',
      color: colors.text,
    },

    chartDescription: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
    },

    chartTrend: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.accent,
    },

    chart: {
      height: 115,
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginTop: 15,
    },

    chartColumn: {
      flex: 1,
      alignItems: 'center',
    },

    chartBarArea: {
      height: 82,
      justifyContent: 'flex-end',
    },

    chartBar: {
      width: 17,
      borderRadius: 9,
      backgroundColor: colors.accent,
    },

    chartDay: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 8,
    },

    sleepCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 18,
    },

    sleepMain: {
      marginBottom: 18,
    },

    sleepDuration: {
      fontSize: FONT.headline,
      fontWeight: '700',
      color: colors.text,
    },

    sleepSubtitle: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
    },

    sleepGoal: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    sleepGoalCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.accentSoft,
      borderWidth: 3,
      borderColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },

    sleepGoalNumber: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },

    sleepGoalTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
    },

    sleepGoalText: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 3,
    },

    missionCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      paddingHorizontal: 15,
    },

    missionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
    },

    missionIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },

    missionIconText: {
      fontSize: 16,
    },

    missionContent: {
      flex: 1,
      marginLeft: 11,
    },

    missionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },

    missionName: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },

    missionPercentage: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.accent,
    },

    missionProgressBackground: {
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.divider,
      marginTop: 7,
      overflow: 'hidden',
    },

    missionProgress: {
      height: '100%',
      backgroundColor: colors.accent,
      borderRadius: 3,
    },

    missionAttempts: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 4,
    },

    moodEmpty: {
      fontSize: 12,
      color: colors.muted,
      lineHeight: 18,
      paddingVertical: 14,
    },

    divider: {
      height: 1,
      backgroundColor: colors.divider,
    },

    achievementCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      paddingHorizontal: 15,
    },

    achievementRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 13,
    },

    achievementDisabled: {
      opacity: 0.55,
    },

    achievementIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },

    achievementIconText: {
      fontSize: 18,
    },

    achievementContent: {
      flex: 1,
      marginLeft: 11,
    },

    achievementTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
    },

    achievementDescription: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 3,
    },

    achievementCheck: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },

    achievementCheckDisabled: {
      backgroundColor: colors.divider,
    },

    achievementCheckText: {
      fontSize: 13,
      color: colors.surface,
      fontWeight: '700',
    },

    insightCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 16,
      marginTop: 12,
    },

    insightLabel: {
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1,
      color: colors.accent,
    },

    insightTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      marginTop: 6,
    },

    insightText: {
      fontSize: 12,
      lineHeight: 18,
      color: colors.muted,
      marginTop: 5,
    },

    bottomSpace: {
      height: 30,
    },
  });

export default ReportDashboardScreen;

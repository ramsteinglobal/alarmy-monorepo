import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { FONT, type ThemeColors } from '../../theme';
import { useThemeColors } from '../../store/ThemeContext';
import LoginWall from '../../components/LoginWall';
import { useAuth } from '../../store/AuthContext';
import { getAlarmHistory, type AlarmHistoryItem } from '../../storage/alarmHistory';
import { dateKey, getHabits, setHabit } from '../../storage/sleepStorage';
import {
  fetchCurrentWeather,
  getCachedWeather,
  type WeatherData,
} from '../../services/weatherService';

const HABITS = [
  { id: 'water', icon: '💧', title: 'Drink Water', description: 'Start your morning hydrated' },
  { id: 'stretch', icon: '🧘', title: 'Morning Stretch', description: 'Take 5 minutes to stretch' },
  {
    id: 'sunlight',
    icon: '☀',
    title: 'Get Some Sunlight',
    description: 'Spend a few minutes outside',
  },
  { id: 'plan', icon: '✓', title: 'Plan Your Day', description: 'Review your priorities' },
];

const dayKeyOf = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : dateKey(d);
};

const streakOf = (history: AlarmHistoryItem[]): number => {
  const days = new Set(
    history
      .filter(h => h.completed)
      .map(h => dayKeyOf(h.completedAt))
      .filter(Boolean),
  );
  if (days.size === 0) return 0;
  const today = new Date();
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!days.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

const MorningDashboardScreen = () => {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { user } = useAuth();
  const [history, setHistory] = useState<AlarmHistoryItem[]>([]);
  const [habitState, setHabitState] = useState<Record<string, boolean>>({});
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getAlarmHistory().then(h => active && setHistory(h));
      getHabits().then(s => active && setHabitState(s));
      getCachedWeather().then(w => active && w && setWeather(w));
      fetchCurrentWeather().then(w => active && w && setWeather(w));
      return () => {
        active = false;
      };
    }, []),
  );

  if (!user) {
    return (
      <LoginWall
        icon="☀"
        title="Morning routines need an account"
        message="Sign in free to build routines, earn streaks, and personalize your mornings."
      />
    );
  }

  const toggleHabit = (id: string, done: boolean) => {
    setHabitState(cur => ({ ...cur, [id]: done }));
    setHabit(id, done).catch(error => console.error('Failed to save habit:', error));
  };

  const last = history.find(h => h.completed) ?? null;
  const streak = streakOf(history);
  const doneCount = HABITS.filter(h => habitState[h.id]).length;
  const habits = HABITS.map(h => ({ ...h, completed: !!habitState[h.id] }));
  const greeting = 'TODAY';

  const reload = () => {
    getAlarmHistory().then(setHistory);
    getHabits().then(setHabitState);
    fetchCurrentWeather().then(w => w && setWeather(w));
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSmall}>{greeting}</Text>

            <Text style={styles.headerTitle}>Morning</Text>
          </View>

          <TouchableOpacity
            style={styles.menuButton}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Refresh morning"
            onPress={reload}
          >
            <Text style={styles.menuText}>↻</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Weather Briefing Card */}
          <View style={styles.weatherCard}>
            <View style={styles.weatherMain}>
              <View style={styles.weatherTempRow}>
                <Text style={styles.weatherIcon}>{weather?.icon ?? '🌤️'}</Text>
                <Text style={styles.weatherTemp}>
                  {weather ? `${weather.temperature}°` : '--°'}
                </Text>
              </View>

              <View style={styles.weatherInfo}>
                <Text style={styles.weatherCity} numberOfLines={1}>
                  {weather?.city ?? 'Detecting location…'}
                </Text>
                <Text style={styles.weatherCondition}>
                  {weather?.condition ?? 'Fetching weather…'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.weatherRefreshBtn}
                activeOpacity={0.7}
                onPress={() => {
                  fetchCurrentWeather().then(w => w && setWeather(w));
                }}
              >
                <Text style={styles.weatherRefreshIcon}>↻</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.weatherDivider} />

            <View style={styles.weatherFooter}>
              <Text style={styles.weatherMeta}>
                H: {weather ? `${weather.high}°` : '--'} · L: {weather ? `${weather.low}°` : '--'}
              </Text>
              <Text style={styles.weatherMeta}>
                💨 {weather ? `${weather.windSpeed} km/h` : '--'}
              </Text>
              {weather?.lastUpdated ? (
                <Text style={styles.weatherUpdated}>Updated {weather.lastUpdated}</Text>
              ) : null}
            </View>
          </View>

          {/* Wake-up Summary */}
          <Text style={styles.sectionTitle}>Today's Wake-Up</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryMain}>
              <Text style={styles.summaryTime}>
                {last?.alarmTime ?? '--:--'}
                <Text style={styles.summaryPeriod}> {last?.period ?? ''}</Text>
              </Text>

              <View style={styles.completedBadge}>
                <Text style={styles.completedBadgeText}>
                  {last ? '✓ COMPLETED' : 'NO WAKE-UPS YET'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryDetails}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>MISSION</Text>

                <Text style={styles.summaryValue}>{last?.missionTitle ?? '—'}</Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>RESULT</Text>

                <Text style={styles.summaryValue}>
                  {last ? (last.mood ? `Felt ${last.mood}` : 'Successful') : '—'}
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>STREAK</Text>

                <Text style={styles.summaryValue}>{streak === 1 ? '1 day' : `${streak} days`}</Text>
              </View>
            </View>
          </View>

          {/* Morning Score */}
          <Text style={styles.sectionTitle}>Morning Score</Text>

          <View style={styles.scoreCard}>
            <View style={styles.scoreBadgeWrap}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreNumber}>{streak}</Text>
              </View>
              <Text style={styles.scoreOutOf}>day streak</Text>
            </View>

            <View style={styles.scoreContent}>
              <Text style={styles.scoreTitle}>
                {streak >= 5 ? 'Unstoppable!' : streak >= 2 ? 'Great start!' : 'Day one energy!'}
              </Text>

              <Text style={styles.scoreDescription}>
                {history.length > 0
                  ? "You're building a consistent morning routine."
                  : 'Wake up with Wakely to start your streak.'}
              </Text>

              <View style={styles.scoreProgressBackground}>
                <View
                  style={[
                    styles.scoreProgress,
                    { width: `${Math.min(100, Math.round((streak / 7) * 100))}%` },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Morning Routine */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderTitle}>Morning Routine</Text>

            <Text style={styles.routineCount}>
              {doneCount} / {HABITS.length}
            </Text>
          </View>

          <View style={styles.habitsCard}>
            {habits.map((habit, index) => (
              <React.Fragment key={habit.id}>
                <TouchableOpacity
                  style={styles.habitRow}
                  activeOpacity={0.7}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: habit.completed }}
                  accessibilityLabel={habit.title}
                  onPress={() => toggleHabit(habit.id, !habit.completed)}
                >
                  <View style={[styles.habitIcon, habit.completed && styles.habitIconCompleted]}>
                    <Text style={styles.habitIconText}>{habit.icon}</Text>
                  </View>

                  <View style={styles.habitContent}>
                    <Text
                      style={[styles.habitTitle, habit.completed && styles.habitTitleCompleted]}
                    >
                      {habit.title}
                    </Text>

                    <Text style={styles.habitDescription}>{habit.description}</Text>
                  </View>

                  <View style={[styles.checkbox, habit.completed && styles.checkboxCompleted]}>
                    {habit.completed && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>

                {index < habits.length - 1 && <View style={styles.habitDivider} />}
              </React.Fragment>
            ))}
          </View>

          {/* Streak */}
          <View style={styles.streakCard}>
            <View style={styles.streakIcon}>
              <Text style={styles.streakIconText}>🔥</Text>
            </View>

            <View style={styles.streakContent}>
              <Text style={styles.streakTitle}>
                {streak > 0 ? `${streak} Day Wake-Up Streak` : 'Start Your Streak'}
              </Text>

              <Text style={styles.streakDescription}>
                {streak > 0
                  ? "Keep going! You're creating a healthy habit."
                  : 'Complete a morning alarm to begin.'}
              </Text>
            </View>
          </View>

          {/* Tip */}
          <View style={styles.tipCard}>
            <Text style={styles.tipLabel}>MORNING TIP</Text>

            <Text style={styles.tipText}>
              Avoid checking your phone immediately after waking up. Give yourself a few minutes to
              start your day calmly.
            </Text>
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

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

    weatherCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 16,
      marginTop: 6,
      borderWidth: 1,
      borderColor: colors.divider,
    },

    weatherMain: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    weatherTempRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    weatherIcon: {
      fontSize: 32,
      marginRight: 8,
    },

    weatherTemp: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
    },

    weatherInfo: {
      flex: 1,
      marginLeft: 12,
    },

    weatherCity: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },

    weatherCondition: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
    },

    weatherRefreshBtn: {
      padding: 8,
      borderRadius: 12,
      backgroundColor: colors.card,
    },

    weatherRefreshIcon: {
      fontSize: 14,
      color: colors.muted,
    },

    weatherDivider: {
      height: 1,
      backgroundColor: colors.divider,
      marginVertical: 12,
    },

    weatherFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    weatherMeta: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.muted,
    },

    weatherUpdated: {
      fontSize: 10,
      color: colors.muted,
    },

    sectionTitle: {
      fontSize: FONT.bodyLg,
      fontWeight: '700',
      color: colors.text,
      marginTop: 23,
      marginBottom: 10,
    },

    summaryCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 18,
    },

    summaryMain: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    summaryTime: {
      fontSize: 34,
      fontWeight: '700',
      color: colors.text,
    },

    summaryPeriod: {
      fontSize: 13,
      fontWeight: '700',
    },

    completedBadge: {
      backgroundColor: colors.accentSoft,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
    },

    completedBadgeText: {
      fontSize: FONT.caption,
      fontWeight: '800',
      color: colors.success,
      letterSpacing: 0.6,
    },

    divider: {
      height: 1,
      backgroundColor: colors.divider,
      marginVertical: 15,
    },

    summaryDetails: {
      flexDirection: 'row',
    },

    summaryItem: {
      flex: 1,
    },

    summaryLabel: {
      fontSize: FONT.caption,
      fontWeight: '700',
      color: colors.muted,
      letterSpacing: 0.7,
    },

    summaryValue: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
      marginTop: 4,
    },

    scoreCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
    },

    scoreBadgeWrap: {
      alignItems: 'center',
      justifyContent: 'center',
    },

    scoreCircle: {
      width: 90,
      height: 90,
      borderRadius: 45,
      borderWidth: 5,
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },

    scoreNumber: {
      fontSize: 25,
      fontWeight: '700',
      color: colors.text,
    },

    scoreOutOf: {
      fontSize: 10,
      color: colors.accent,
      fontWeight: '700',
      marginTop: 2,
      letterSpacing: 0.5,
    },

    scoreContent: {
      flex: 1,
      marginLeft: 15,
    },

    scoreTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },

    scoreDescription: {
      fontSize: 12,
      color: colors.muted,
      lineHeight: 17,
      marginTop: 4,
    },

    scoreProgressBackground: {
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.divider,
      marginTop: 10,
      overflow: 'hidden',
    },

    scoreProgress: {
      width: '82%',
      height: '100%',
      backgroundColor: colors.accent,
    },

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 23,
      marginBottom: 10,
    },

    sectionHeaderTitle: {
      fontSize: FONT.bodyLg,
      fontWeight: '700',
      color: colors.text,
    },

    routineCount: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.accent,
    },

    habitsCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      paddingHorizontal: 15,
    },

    habitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 13,
    },

    habitIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.divider,
      alignItems: 'center',
      justifyContent: 'center',
    },

    habitIconCompleted: {
      backgroundColor: colors.accentSoft,
    },

    habitIconText: {
      fontSize: 17,
    },

    habitContent: {
      flex: 1,
      marginLeft: 11,
    },

    habitTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },

    habitTitleCompleted: {
      textDecorationLine: 'line-through',
      color: colors.muted,
    },

    habitDescription: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 3,
    },

    checkbox: {
      width: 23,
      height: 23,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.softBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },

    checkboxCompleted: {
      borderColor: colors.accent,
      backgroundColor: colors.accent,
    },

    checkmark: {
      color: colors.onAccent,
      fontSize: 13,
      fontWeight: '700',
    },

    habitDivider: {
      height: 1,
      backgroundColor: colors.divider,
    },

    streakCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 15,
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },

    streakIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },

    streakIconText: {
      fontSize: 20,
    },

    streakContent: {
      flex: 1,
      marginLeft: 12,
    },

    streakTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },

    streakDescription: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 3,
    },

    tipCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 16,
      marginTop: 12,
    },

    tipLabel: {
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1,
      color: colors.accent,
    },

    tipText: {
      fontSize: 12,
      lineHeight: 18,
      color: colors.muted,
      marginTop: 7,
    },

    bottomSpace: {
      height: 120,
    },
  });

export default MorningDashboardScreen;

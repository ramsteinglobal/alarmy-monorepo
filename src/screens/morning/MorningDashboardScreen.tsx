import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { COLORS } from '../../theme';
import type { MainTabParamList } from '../../types/navigation';

type Props = BottomTabScreenProps<MainTabParamList, 'Morning'>;

const MorningDashboardScreen = ({ navigation }: Props) => {
  const habits = [
    {
      id: 'water',
      icon: '💧',
      title: 'Drink Water',
      description: 'Start your morning hydrated',
      completed: true,
    },
    {
      id: 'stretch',
      icon: '🧘',
      title: 'Morning Stretch',
      description: 'Take 5 minutes to stretch',
      completed: false,
    },
    {
      id: 'sunlight',
      icon: '☀',
      title: 'Get Some Sunlight',
      description: 'Spend a few minutes outside',
      completed: false,
    },
    {
      id: 'plan',
      icon: '✓',
      title: 'Plan Your Day',
      description: 'Review your priorities',
      completed: false,
    },
  ];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSmall}>
              GOOD MORNING
            </Text>

            <Text style={styles.headerTitle}>
              Morning
            </Text>
          </View>

          <TouchableOpacity
            style={styles.menuButton}
            activeOpacity={0.7}
          >
            <Text style={styles.menuText}>⋮</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          {/* Greeting Card */}
          <View style={styles.greetingCard}>
            <View style={styles.greetingIcon}>
              <Text style={styles.greetingIconText}>
                ☀
              </Text>
            </View>

            <View style={styles.greetingContent}>
              <Text style={styles.greetingTitle}>
                Good morning!
              </Text>

              <Text style={styles.greetingText}>
                You completed your alarm. Great start
                to the day.
              </Text>
            </View>
          </View>

          {/* Wake-up Summary */}
          <Text style={styles.sectionTitle}>
            Today's Wake-Up
          </Text>

          <View style={styles.summaryCard}>

            <View style={styles.summaryMain}>
              <Text style={styles.summaryTime}>
                7:52
                <Text style={styles.summaryPeriod}>
                  {' '}AM
                </Text>
              </Text>

              <View style={styles.completedBadge}>
                <Text style={styles.completedBadgeText}>
                  ✓ COMPLETED
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryDetails}>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>
                  MISSION
                </Text>

                <Text style={styles.summaryValue}>
                  Math Mission
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>
                  RESULT
                </Text>

                <Text style={styles.summaryValue}>
                  Successful
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>
                  STREAK
                </Text>

                <Text style={styles.summaryValue}>
                  5 days
                </Text>
              </View>

            </View>
          </View>

          {/* Morning Score */}
          <Text style={styles.sectionTitle}>
            Morning Score
          </Text>

          <View style={styles.scoreCard}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreNumber}>
                82
              </Text>

              <Text style={styles.scoreOutOf}>
                /100
              </Text>
            </View>

            <View style={styles.scoreContent}>
              <Text style={styles.scoreTitle}>
                Great start!
              </Text>

              <Text style={styles.scoreDescription}>
                You're building a consistent morning
                routine.
              </Text>

              <View style={styles.scoreProgressBackground}>
                <View style={styles.scoreProgress} />
              </View>
            </View>
          </View>

          {/* Morning Routine */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Morning Routine
            </Text>

            <Text style={styles.routineCount}>
              1 / 4
            </Text>
          </View>

          <View style={styles.habitsCard}>
            {habits.map((habit, index) => (
              <React.Fragment key={habit.id}>
                <TouchableOpacity
                  style={styles.habitRow}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.habitIcon,
                      habit.completed &&
                        styles.habitIconCompleted,
                    ]}
                  >
                    <Text style={styles.habitIconText}>
                      {habit.icon}
                    </Text>
                  </View>

                  <View style={styles.habitContent}>
                    <Text
                      style={[
                        styles.habitTitle,
                        habit.completed &&
                          styles.habitTitleCompleted,
                      ]}
                    >
                      {habit.title}
                    </Text>

                    <Text style={styles.habitDescription}>
                      {habit.description}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.checkbox,
                      habit.completed &&
                        styles.checkboxCompleted,
                    ]}
                  >
                    {habit.completed && (
                      <Text style={styles.checkmark}>
                        ✓
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>

                {index < habits.length - 1 && (
                  <View style={styles.habitDivider} />
                )}
              </React.Fragment>
            ))}
          </View>

          {/* Streak */}
          <View style={styles.streakCard}>
            <View style={styles.streakIcon}>
              <Text style={styles.streakIconText}>
                🔥
              </Text>
            </View>

            <View style={styles.streakContent}>
              <Text style={styles.streakTitle}>
                5 Day Wake-Up Streak
              </Text>

              <Text style={styles.streakDescription}>
                Keep going! You're creating a healthy
                habit.
              </Text>
            </View>

            <Text style={styles.streakArrow}>
              ›
            </Text>
          </View>

          {/* Tip */}
          <View style={styles.tipCard}>
            <Text style={styles.tipLabel}>
              MORNING TIP
            </Text>

            <Text style={styles.tipText}>
              Avoid checking your phone immediately
              after waking up. Give yourself a few
              minutes to start your day calmly.
            </Text>
          </View>

          <View style={styles.bottomSpace} />

        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    color: COLORS.muted,
    letterSpacing: 1,
  },

  headerTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 3,
  },

  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuText: {
    fontSize: 25,
    color: COLORS.text,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 25,
  },

  greetingCard: {
    backgroundColor: '#FFF8E8',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  greetingIcon: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#F5E4B7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  greetingIconText: {
    fontSize: 23,
    color: COLORS.accent,
  },

  greetingContent: {
    flex: 1,
    marginLeft: 12,
  },

  greetingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },

  greetingText: {
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 17,
    marginTop: 3,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 23,
    marginBottom: 10,
  },

  summaryCard: {
    backgroundColor: COLORS.surface,
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
    color: COLORS.text,
  },

  summaryPeriod: {
    fontSize: 13,
    fontWeight: '700',
  },

  completedBadge: {
    backgroundColor: '#EAF7E9',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
  },

  completedBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#4CAF50',
    letterSpacing: 0.6,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: 15,
  },

  summaryDetails: {
    flexDirection: 'row',
  },

  summaryItem: {
    flex: 1,
  },

  summaryLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.muted,
    letterSpacing: 0.7,
  },

  summaryValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 4,
  },

  scoreCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  scoreCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 5,
    borderColor: COLORS.accent,
    backgroundColor: '#FFF8E8',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  scoreNumber: {
    fontSize: 25,
    fontWeight: '700',
    color: COLORS.text,
  },

  scoreOutOf: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 11,
  },

  scoreContent: {
    flex: 1,
    marginLeft: 15,
  },

  scoreTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },

  scoreDescription: {
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 17,
    marginTop: 4,
  },

  scoreProgressBackground: {
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.divider,
    marginTop: 10,
    overflow: 'hidden',
  },

  scoreProgress: {
    width: '82%',
    height: '100%',
    backgroundColor: COLORS.accent,
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
    color: COLORS.text,
  },

  routineCount: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },

  habitsCard: {
    backgroundColor: COLORS.surface,
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
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  habitIconCompleted: {
    backgroundColor: '#FFF8E8',
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
    color: COLORS.text,
  },

  habitTitleCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.muted,
  },

  habitDescription: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 3,
  },

  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D5D5D5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxCompleted: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent,
  },

  checkmark: {
    color: COLORS.surface,
    fontSize: 13,
    fontWeight: '700',
  },

  habitDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
  },

  streakCard: {
    backgroundColor: COLORS.surface,
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
    backgroundColor: '#FFF3E5',
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
    color: COLORS.text,
  },

  streakDescription: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 3,
  },

  streakArrow: {
    fontSize: 23,
    color: COLORS.muted,
  },

  tipCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
  },

  tipLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    color: COLORS.accent,
  },

  tipText: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.muted,
    marginTop: 7,
  },

  bottomSpace: {
    height: 30,
  },
});

export default MorningDashboardScreen;
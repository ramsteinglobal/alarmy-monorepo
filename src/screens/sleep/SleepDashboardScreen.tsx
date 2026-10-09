import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../theme';

const SleepDashboardScreen = () => {
  const sleepData = useMemo(
    () => ({
      bedtime: '11:15 PM',
      wakeTime: '7:00 AM',
      duration: '7h 45m',
      goal: '8h 00m',
      quality: 86,
    }),
    [],
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSmall}>
              TODAY
            </Text>

            <Text style={styles.headerTitle}>
              Sleep
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

          {/* Sleep Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              LAST NIGHT
            </Text>

            <Text style={styles.duration}>
              {sleepData.duration}
            </Text>

            <Text style={styles.durationSubtitle}>
              of {sleepData.goal} goal
            </Text>

            {/* Progress */}
            <View style={styles.progressBackground}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      (465 / 480) * 100,
                      100,
                    )}%`,
                  },
                ]}
              />
            </View>

            <View style={styles.sleepTimes}>
              <View>
                <Text style={styles.timeLabel}>
                  BEDTIME
                </Text>

                <Text style={styles.timeValue}>
                  {sleepData.bedtime}
                </Text>
              </View>

              <View style={styles.timeRight}>
                <Text style={styles.timeLabel}>
                  WAKE UP
                </Text>

                <Text style={styles.timeValue}>
                  {sleepData.wakeTime}
                </Text>
              </View>
            </View>
          </View>

          {/* Sleep Quality */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Sleep Quality
            </Text>

            <Text style={styles.sectionValue}>
              {sleepData.quality}%
            </Text>
          </View>

          <View style={styles.qualityCard}>
            <View style={styles.qualityCircle}>
              <Text style={styles.qualityNumber}>
                {sleepData.quality}
              </Text>

              <Text style={styles.qualityPercent}>
                %
              </Text>
            </View>

            <View style={styles.qualityContent}>
              <Text style={styles.qualityTitle}>
                Good sleep
              </Text>

              <Text style={styles.qualityDescription}>
                Your sleep duration was close to your
                target last night.
              </Text>
            </View>
          </View>

          {/* Sleep Details */}
          <Text style={styles.detailsTitle}>
            Sleep Details
          </Text>

          <View style={styles.detailsCard}>

            <SleepDetail
              icon="◷"
              label="Time asleep"
              value="7h 45m"
            />

            <View style={styles.divider} />

            <SleepDetail
              icon="☾"
              label="Bedtime"
              value="11:15 PM"
            />

            <View style={styles.divider} />

            <SleepDetail
              icon="☀"
              label="Wake up"
              value="7:00 AM"
            />

            <View style={styles.divider} />

            <SleepDetail
              icon="↗"
              label="Sleep consistency"
              value="Good"
            />

          </View>

          {/* Weekly History */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              This Week
            </Text>

            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.viewAll}>
                View all
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekCard}>
            <WeekDay
              day="M"
              hours="7.5"
              active
            />

            <WeekDay
              day="T"
              hours="7.8"
              active
            />

            <WeekDay
              day="W"
              hours="6.9"
              active
            />

            <WeekDay
              day="T"
              hours="7.7"
              active
            />

            <WeekDay
              day="F"
              hours="7.2"
              active
            />

            <WeekDay
              day="S"
              hours="8.0"
              active
            />

            <WeekDay
              day="S"
              hours="--"
            />
          </View>

          {/* Sleep Goal */}
          <View style={styles.goalCard}>
            <View style={styles.goalIcon}>
              <Text style={styles.goalIconText}>
                ☾
              </Text>
            </View>

            <View style={styles.goalContent}>
              <Text style={styles.goalTitle}>
                Sleep Goal
              </Text>

              <Text style={styles.goalText}>
                Try to get at least 8 hours tonight.
              </Text>
            </View>

            <Text style={styles.goalArrow}>
              ›
            </Text>
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

const SleepDetail = ({
  icon,
  label,
  value,
}: SleepDetailProps) => {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Text style={styles.detailIconText}>
          {icon}
        </Text>
      </View>

      <Text style={styles.detailLabel}>
        {label}
      </Text>

      <Text style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
};

/* ============================================================
   WEEK DAY
============================================================ */

type WeekDayProps = {
  day: string;
  hours: string;
  active?: boolean;
};

const WeekDay = ({
  day,
  hours,
  active = false,
}: WeekDayProps) => {
  return (
    <View style={styles.weekDay}>
      <Text style={styles.weekDayName}>
        {day}
      </Text>

      <View
        style={[
          styles.weekBarContainer,
          !active && styles.weekBarInactive,
        ]}
      >
        {active && (
          <View
            style={[
              styles.weekBar,
              {
                height:
                  hours === '8.0'
                    ? 68
                    : hours === '7.8'
                    ? 64
                    : hours === '7.7'
                    ? 62
                    : hours === '7.5'
                    ? 59
                    : hours === '7.2'
                    ? 55
                    : 51,
              },
            ]}
          />
        )}
      </View>

      <Text style={styles.weekHours}>
        {hours}
      </Text>
    </View>
  );
};

/* ============================================================
   STYLES
============================================================ */

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

  /* Summary */

  summaryCard: {
    backgroundColor: '#FFF8E8',
    borderRadius: 18,
    padding: 20,
  },

  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.muted,
  },

  duration: {
    fontSize: 38,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 5,
  },

  durationSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },

  progressBackground: {
    height: 7,
    backgroundColor: '#EADDBF',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 17,
  },

  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
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
    color: COLORS.muted,
    letterSpacing: 0.8,
  },

  timeValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
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
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },

  sectionValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },

  viewAll: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accent,
  },

  /* Quality */

  qualityCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  qualityCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFF8E8',
    borderWidth: 5,
    borderColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  qualityNumber: {
    fontSize: 23,
    fontWeight: '700',
    color: COLORS.text,
  },

  qualityPercent: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 9,
  },

  qualityContent: {
    flex: 1,
    marginLeft: 15,
  },

  qualityTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },

  qualityDescription: {
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 17,
    marginTop: 4,
  },

  /* Details */

  detailsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 23,
    marginBottom: 10,
  },

  detailsCard: {
    backgroundColor: COLORS.surface,
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
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  detailIconText: {
    fontSize: 15,
    color: COLORS.accent,
  },

  detailLabel: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
    marginLeft: 11,
  },

  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
  },

  /* Week */

  weekCard: {
    backgroundColor: COLORS.surface,
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
    color: COLORS.muted,
    marginBottom: 7,
  },

  weekBarContainer: {
    width: 19,
    height: 70,
    borderRadius: 10,
    backgroundColor: '#FFF8E8',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },

  weekBar: {
    width: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 10,
  },

  weekBarInactive: {
    backgroundColor: '#F2F2F2',
  },

  weekHours: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 6,
  },

  /* Goal */

  goalCard: {
    backgroundColor: COLORS.surface,
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
    backgroundColor: '#FFF8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  goalIconText: {
    fontSize: 19,
    color: COLORS.accent,
  },

  goalContent: {
    flex: 1,
    marginLeft: 12,
  },

  goalTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },

  goalText: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 3,
  },

  goalArrow: {
    fontSize: 23,
    color: COLORS.muted,
  },

  bottomSpace: {
    height: 30,
  },
});

export default SleepDashboardScreen;

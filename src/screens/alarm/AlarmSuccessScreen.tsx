import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Card from '../../components/Card';
import InfoRow from '../../components/InfoRow';
import PrimaryButton from '../../components/PrimaryButton';
import Screen from '../../components/Screen';
import { addAlarmHistory } from '../../storage/alarmHistory';
import { COLORS, FONT, RADIUS, SPACING } from '../../theme';
import type { AlarmScreenProps } from '../../types/navigation';

export default function AlarmSuccessScreen({
  navigation,
  route,
}: AlarmScreenProps<'AlarmSuccess'>) {
  const alarm = route.params?.alarm;
  const [leaving, setLeaving] = useState(false);
  const recorded = useRef(false);

  // Record the wake-up as soon as the screen opens, so closing the app
  // before tapping DONE no longer loses it (it used to be saved on DONE only).
  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    const startedAt = route.params?.startedAt;
    const durationSeconds =
      typeof startedAt === 'number' ? Math.max(0, Math.round((Date.now() - startedAt) / 1000)) : 0;
    addAlarmHistory({
      id: Date.now().toString(),
      alarmId: alarm?.id ?? '',
      alarmTime: alarm?.time ?? '--:--',
      period: alarm?.period ?? '',
      missionId: alarm?.mission?.id ?? '',
      missionTitle: alarm?.mission?.title ?? 'Wake Up Mission',
      completed: true,
      completedAt: new Date().toISOString(),
      durationSeconds,
    });
  }, [alarm, route.params?.startedAt]);

  const goToDashboard = () => {
    setLeaving(true);
    navigation.reset({ index: 0, routes: [{ name: 'AlarmDashboard' }] });
  };

  const handleViewReport = () => {
    // Alarm stack -> tab navigator
    navigation.getParent()?.navigate('Report' as never);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.circle} accessibilityElementsHidden importantForAccessibility="no">
          <Text style={styles.check}>✓</Text>
        </View>

        <Text accessibilityRole="header" style={styles.title}>
          You're Awake!
        </Text>
        <Text style={styles.subtitle}>Mission completed successfully.</Text>

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>ALARM COMPLETED</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>SUCCESS</Text>
            </View>
          </View>
          <View style={styles.divider} />

          <InfoRow
            icon="◷"
            label="WAKE UP TIME"
            value={`${alarm?.time ?? '--:--'} ${alarm?.period ?? ''}`.trim()}
          />
          <InfoRow
            icon="✓"
            label="MISSION"
            value={alarm?.mission?.title ?? 'Wake Up Mission'}
            description="Completed successfully"
          />
          <InfoRow icon="♪" label="ALARM SOUND" value={alarm?.sound?.name ?? 'Classic Alarm'} />
        </Card>

        <View style={styles.message}>
          <Text style={styles.messageTitle}>Great start!</Text>
          <Text style={styles.messageText}>
            You completed your wake-up mission. Keep building your morning routine.
          </Text>
        </View>

        <View style={styles.actions}>
          <PrimaryButton label="DONE" variant="dark" loading={leaving} onPress={goToDashboard} />
          <PrimaryButton
            label="VIEW REPORT"
            variant="ghost"
            disabled={leaving}
            onPress={handleViewReport}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: SPACING.lg, paddingBottom: SPACING.xl },
  circle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentTint,
    marginBottom: 18,
  },
  check: { fontSize: 38, fontWeight: '700', color: COLORS.accent },
  title: {
    textAlign: 'center',
    fontSize: FONT.headline + 4,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: { textAlign: 'center', marginTop: 6, fontSize: FONT.body, color: COLORS.muted },
  card: { marginTop: SPACING.lg, paddingBottom: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel: { fontSize: FONT.caption, fontWeight: '700', letterSpacing: 1.5, color: COLORS.muted },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.success,
  },
  badgeText: { fontSize: FONT.caption, fontWeight: '700', color: COLORS.onDark },
  divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: SPACING.md },
  message: { marginTop: SPACING.lg, alignItems: 'center', paddingHorizontal: 8 },
  messageTitle: { fontSize: FONT.bodyLg, fontWeight: '700', color: COLORS.text },
  messageText: {
    marginTop: 4,
    fontSize: FONT.body,
    lineHeight: 20,
    textAlign: 'center',
    color: COLORS.muted,
  },
  actions: { marginTop: SPACING.lg, gap: SPACING.sm },
});

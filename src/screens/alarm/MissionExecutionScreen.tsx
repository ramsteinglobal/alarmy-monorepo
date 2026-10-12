import React, { useCallback, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import PrimaryButton from '../../components/PrimaryButton';
import Screen from '../../components/Screen';
import useBlockBack from '../../hooks/useBlockBack';
import CounterMission from '../../missions/CounterMission';
import DemoMission from '../../missions/DemoMission';
import MathMission from '../../missions/MathMission';
import MemoryMission from '../../missions/MemoryMission';
import TypingMission from '../../missions/TypingMission';
import { COLORS, FONT, RADIUS, SPACING } from '../../theme';
import type { AlarmScreenProps } from '../../types/navigation';

export default function MissionExecutionScreen({
  navigation,
  route,
}: AlarmScreenProps<'MissionExecution'>) {
  const alarm = route.params?.alarm;
  const startedAt = route.params?.startedAt;
  const missionId = alarm?.mission?.id ?? 'math';

  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const done = useRef(false);

  // The alarm cannot be escaped with the Android back button.
  useBlockBack();

  // Guard: a mission may only complete once, even if two taps arrive together.
  const complete = useCallback(() => {
    if (done.current) return;
    done.current = true;
    setCompleted(true);
    setProgress(1);
    navigation.replace('AlarmSuccess', { alarm, startedAt });
  }, [alarm, navigation, startedAt]);

  const renderMission = () => {
    switch (missionId) {
      case 'math':
        return <MathMission onComplete={complete} />;
      case 'typing':
        return <TypingMission onComplete={complete} />;
      case 'memory':
        return <MemoryMission onComplete={complete} />;
      case 'shake':
        return (
          <CounterMission
            icon="↔"
            title="Shake Your Phone"
            description="Shake your phone 10 times to stop the alarm."
            buttonLabel="SHAKE"
            onComplete={complete}
            onProgress={setProgress}
          />
        );
      case 'squat':
        return (
          <CounterMission
            icon="●"
            title="Complete Squats"
            description="Complete 10 squats to stop the alarm."
            buttonLabel="SQUAT"
            onComplete={complete}
            onProgress={setProgress}
          />
        );
      case 'photo':
        return (
          <DemoMission
            icon="▣"
            title="Photo Mission"
            description="Take a photo of your registered object to stop the alarm."
            buttonLabel="OPEN CAMERA"
            onComplete={complete}
          />
        );
      case 'barcode':
        return (
          <DemoMission
            icon="▥"
            title="Barcode Mission"
            description="Scan your registered barcode to stop the alarm."
            buttonLabel="SCAN BARCODE"
            onComplete={complete}
          />
        );
      default:
        return <PrimaryButton label="COMPLETE MISSION" onPress={complete} />;
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerLabel}>MISSION</Text>
            <Text accessibilityRole="header" style={styles.headerTitle}>
              {alarm?.mission?.title ?? 'Wake Up Mission'}
            </Text>
            <Text style={styles.headerDescription}>
              {alarm?.mission?.description ?? 'Complete the mission to stop the alarm.'}
            </Text>
          </View>

          <View
            style={styles.progressTrack}
            accessible
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
          >
            <View
              style={[
                styles.progressFill,
                completed && styles.progressComplete,
                { width: `${progress * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {completed ? 'Mission completed' : 'Complete the mission to continue'}
          </Text>

          <View style={styles.mission}>{renderMission()}</View>

          <Text style={styles.bottomInfo}>
            Alarm: {alarm?.time ?? '--:--'} {alarm?.period ?? ''}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: SPACING.lg, paddingBottom: SPACING.xl },
  header: { alignItems: 'center' },
  headerLabel: {
    fontSize: FONT.caption,
    fontWeight: '700',
    letterSpacing: 2,
    color: COLORS.accent,
  },
  headerTitle: {
    marginTop: 6,
    fontSize: FONT.headline,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  headerDescription: {
    marginTop: 6,
    fontSize: FONT.body,
    color: COLORS.muted,
    textAlign: 'center',
  },
  progressTrack: {
    height: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.divider,
    marginTop: SPACING.lg,
    overflow: 'hidden',
  },
  progressFill: { height: 8, borderRadius: RADIUS.pill, backgroundColor: COLORS.accent },
  progressComplete: { backgroundColor: COLORS.success },
  progressText: { marginTop: 8, textAlign: 'center', fontSize: FONT.caption, color: COLORS.muted },
  mission: { marginTop: SPACING.lg },
  bottomInfo: {
    marginTop: SPACING.xl,
    textAlign: 'center',
    fontSize: FONT.caption,
    color: COLORS.muted,
  },
});

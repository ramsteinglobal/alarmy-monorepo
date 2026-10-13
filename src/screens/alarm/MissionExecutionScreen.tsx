import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Screen from '../../components/Screen';
import Card from '../../components/Card';
import PrimaryButton from '../../components/PrimaryButton';
import useBlockBack from '../../hooks/useBlockBack';
import CounterMission from '../../missions/CounterMission';
import MathMission from '../../missions/MathMission';
import MemoryMission from '../../missions/MemoryMission';
import PhotoCaptureMission from '../../missions/PhotoCaptureMission';
import ShakeMission from '../../missions/ShakeMission';
import TypingMission from '../../missions/TypingMission';
import { getMissionChain, getMissionConfig, type MissionRef } from '../../storage/alarmStorage';
import { cancelBackup } from '../../services/alarmScheduler';
import { useThemeColors } from '../../store/ThemeContext';
import { FONT, RADIUS, SPACING, type ThemeColors } from '../../theme';
import type { RootScreenProps } from '../../types/navigation';

const FALLBACK_MISSION: MissionRef = {
  id: 'math',
  title: 'Math Mission',
  description: 'Complete the mission to stop the alarm.',
};

export default function MissionExecutionScreen({
  navigation,
  route,
}: RootScreenProps<'MissionExecution'>) {
  const alarm = route.params?.alarm;
  const startedAt = route.params?.startedAt;
  const snoozeCount = route.params?.snoozeCount ?? 0;
  const preview = route.params?.preview === true;
  const chain = alarm ? getMissionChain(alarm) : [FALLBACK_MISSION];
  const config = alarm ? getMissionConfig(alarm) : getMissionConfig({});

  const [step, setStep] = useState(0);
  const [partial, setPartial] = useState(0);
  const [completed, setCompleted] = useState(false);
  const done = useRef(false);
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const current = chain[Math.min(step, chain.length - 1)];
  const missionId = current?.id ?? 'math';
  const progress = chain.length > 1 ? Math.min(1, (step + partial) / chain.length) : partial;

  // The alarm cannot be escaped with the Android back button.
  useBlockBack();

  // Belt and suspenders: entering the mission always kills the backup blast.
  useEffect(() => {
    if (alarm?.id) {
      cancelBackup(alarm.id).catch(error => console.error('Failed to cancel backup:', error));
    }
  }, [alarm?.id]);

  // Guard: the chain may only complete once, even if two taps arrive together.
  // In preview (dry run from the editor) completion just goes back — no history.
  const completeAll = useCallback(() => {
    if (done.current) return;
    done.current = true;
    setCompleted(true);
    setPartial(1);
    if (preview) {
      Alert.alert('Preview complete', 'Nice — that is exactly what ringing will feel like.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
      return;
    }
    navigation.replace('AlarmSuccess', { alarm, startedAt, snoozeCount });
  }, [alarm, navigation, preview, startedAt, snoozeCount]);

  // Each step completion advances the chain; only the last step stops the alarm.
  const completeStep = useCallback(() => {
    if (done.current) return;
    if (step + 1 >= chain.length) {
      completeAll();
      return;
    }
    setStep(s => s + 1);
    setPartial(0);
  }, [chain.length, completeAll, step]);

  const handleProgress = useCallback(
    (p: number) => {
      if (done.current) return;
      if (chain.length > 1) setPartial(Math.max(0, Math.min(1, p)));
      else setPartial(Math.max(0, Math.min(1, p)));
    },
    [chain.length],
  );

  const renderMission = () => {
    const stepProps = { onComplete: completeStep, onProgress: handleProgress };
    switch (missionId) {
      case 'math':
        return (
          <MathMission
            {...stepProps}
            problems={config.mathProblems}
            difficulty={config.mathDifficulty}
          />
        );
      case 'typing':
        return <TypingMission {...stepProps} reps={config.typingReps} />;
      case 'memory':
        return <MemoryMission {...stepProps} length={config.memoryLength} />;
      case 'shake':
        return (
          <ShakeMission
            target={config.shakeTarget}
            onComplete={completeStep}
            onProgress={handleProgress}
          />
        );
      case 'tap':
        return (
          <CounterMission
            icon="👆"
            title="Tap Challenge"
            description={`Tap ${config.tapTarget} times as fast as you can.`}
            buttonLabel="TAP"
            target={config.tapTarget}
            onComplete={completeStep}
            onProgress={handleProgress}
          />
        );
      case 'squat':
        return (
          <CounterMission
            icon="●"
            title="Complete Squats"
            description={`Complete ${config.squatTarget} squats to stop the alarm.`}
            buttonLabel="SQUAT"
            target={config.squatTarget}
            onComplete={completeStep}
            onProgress={handleProgress}
          />
        );
      case 'photo':
        return <PhotoCaptureMission kind="photo" onComplete={completeStep} />;
      case 'barcode':
        return <PhotoCaptureMission kind="barcode" onComplete={completeStep} />;
      default:
        // Fail closed: unknown mission ids fall back to a real mission
        // instead of a free COMPLETE button.
        return <MathMission onComplete={completeStep} />;
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
            <Text style={styles.headerLabel}>
              {preview
                ? 'PREVIEW — NO HISTORY SAVED'
                : chain.length > 1
                ? `MISSION ${step + 1} OF ${chain.length}`
                : 'MISSION'}
            </Text>
            <Text accessibilityRole="header" style={styles.headerTitle}>
              {current?.title ?? alarm?.mission?.title ?? 'Wake Up Mission'}
            </Text>
            <Text style={styles.headerDescription}>
              {current?.description ??
                alarm?.mission?.description ??
                'Complete the mission to stop your alarm.'}
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
            {completed
              ? 'Mission completed'
              : chain.length > 1
              ? 'Complete all steps to stop your alarm'
              : 'Complete the mission to continue'}
          </Text>

          <View style={styles.mission}>
            {!alarm ? (
              <Card>
                <Text style={styles.errorText}>
                  This mission opened without its alarm, so there is nothing to complete. Your saved
                  alarms are safe.
                </Text>
                <View style={styles.errorAction}>
                  <PrimaryButton
                    label="Back to alarms"
                    onPress={() =>
                      navigation.reset({ index: 0, routes: [{ name: 'Main' }] })
                    }
                  />
                </View>
              </Card>
            ) : (
              renderMission()
            )}
          </View>

          <Text style={styles.bottomInfo}>
            Alarm: {alarm?.time ?? '--:--'} {alarm?.period ?? ''}
            {preview ? ' (preview)' : ''}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    content: { paddingHorizontal: 20, paddingTop: SPACING.md, paddingBottom: SPACING.xl },
    header: { alignItems: 'center' },
    headerLabel: {
      fontSize: FONT.caption,
      fontWeight: '700',
      letterSpacing: 2,
      color: colors.accent,
    },
    headerTitle: {
      marginTop: 6,
      fontSize: FONT.headline,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    headerDescription: {
      marginTop: 6,
      fontSize: FONT.body,
      color: colors.muted,
      textAlign: 'center',
    },
    progressTrack: {
      height: 8,
      borderRadius: RADIUS.pill,
      backgroundColor: colors.divider,
      marginTop: SPACING.lg,
      overflow: 'hidden',
    },
    progressFill: { height: 8, borderRadius: RADIUS.pill, backgroundColor: colors.accent },
    progressComplete: { backgroundColor: colors.success },
    progressText: {
      marginTop: 8,
      textAlign: 'center',
      fontSize: FONT.caption,
      color: colors.muted,
    },
    mission: { marginTop: SPACING.lg },
    errorText: { fontSize: FONT.body, lineHeight: 22, color: colors.text, textAlign: 'center' },
    errorAction: { marginTop: SPACING.md },
    bottomInfo: {
      marginTop: SPACING.xl,
      textAlign: 'center',
      fontSize: FONT.caption,
      color: colors.muted,
    },
  });

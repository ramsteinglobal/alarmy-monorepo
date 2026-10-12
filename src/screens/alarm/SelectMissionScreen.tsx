import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Card from '../../components/Card';
import OptionRow from '../../components/OptionRow';
import PrimaryButton from '../../components/PrimaryButton';
import Screen from '../../components/Screen';
import ScreenHeader from '../../components/ScreenHeader';
import { DEFAULT_MISSION, Difficulty, MISSIONS } from '../../data/options';
import { DEFAULT_MISSION_CONFIG, type MissionConfig } from '../../storage/alarmStorage';
import { useThemeColors } from '../../store/ThemeContext';
import { FONT, SPACING, type ThemeColors } from '../../theme';
import type { AlarmScreenProps } from '../../types/navigation';

const DIFFICULTY_COLOR_KEYS: Record<Difficulty, keyof ThemeColors> = {
  Easy: 'success',
  Medium: 'accent',
  Hard: 'danger',
} as const;

export default function SelectMissionScreen({
  navigation,
  route,
}: AlarmScreenProps<'SelectMission'>) {
  const draft = route.params.alarm;
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const initialIds =
    draft.missions && draft.missions.length > 0
      ? draft.missions.map(m => m.id)
      : [draft.mission?.id ?? DEFAULT_MISSION.id];
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);
  const [capNotice, setCapNotice] = useState(false);
  const capTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (capTimer.current) clearTimeout(capTimer.current);
    },
    [],
  );
  const saved = draft.missionConfig ?? {};
  const [mathDifficulty, setMathDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>(
    (saved.mathDifficulty as string) === 'Normal'
      ? 'Medium'
      : (saved.mathDifficulty as 'Easy' | 'Medium' | 'Hard' | undefined) ??
          DEFAULT_MISSION_CONFIG.mathDifficulty,
  );
  const [mathProblems, setMathProblems] = useState(
    saved.mathProblems ?? DEFAULT_MISSION_CONFIG.mathProblems,
  );
  const [shakeTarget, setShakeTarget] = useState(
    saved.shakeTarget ?? DEFAULT_MISSION_CONFIG.shakeTarget,
  );
  const [squatTarget, setSquatTarget] = useState(
    saved.squatTarget ?? DEFAULT_MISSION_CONFIG.squatTarget,
  );
  const [typingReps, setTypingReps] = useState(
    saved.typingReps ?? DEFAULT_MISSION_CONFIG.typingReps,
  );
  const [memoryLength, setMemoryLength] = useState(
    saved.memoryLength ?? DEFAULT_MISSION_CONFIG.memoryLength,
  );
  const [tapTarget, setTapTarget] = useState(saved.tapTarget ?? DEFAULT_MISSION_CONFIG.tapTarget);

  const selected = selectedIds
    .map(id => MISSIONS.find(m => m.id === id))
    .filter((m): m is (typeof MISSIONS)[number] => !!m);
  const chain = selected.length > 0 ? selected : [DEFAULT_MISSION];

  const toggle = (id: string) => {
    setSelectedIds(cur => {
      if (cur.includes(id)) {
        // Keep at least one mission — an alarm must never have zero.
        return cur.length > 1 ? cur.filter(x => x !== id) : cur;
      }
      // Cap the chain at 3 to keep wake-ups achievable — with feedback.
      if (cur.length >= 3) {
        setCapNotice(true);
        if (capTimer.current) clearTimeout(capTimer.current);
        capTimer.current = setTimeout(() => setCapNotice(false), 2000);
        return cur;
      }
      return [...cur, id];
    });
  };

  // The sound travels inside `draft`, so it is not passed separately any more.
  const handleContinue = () => {
    const missions = chain.map(m => ({
      id: m.id,
      title: m.title,
      description: m.description,
      difficulty: m.difficulty,
    }));
    const missionConfig: MissionConfig = {
      mathDifficulty,
      mathProblems,
      shakeTarget,
      squatTarget,
      typingReps,
      memoryLength,
      tapTarget,
    };
    navigation.navigate('AlarmSummary', {
      alarm: { ...draft, missions, mission: missions[0], missionConfig },
      mission: missions[0],
    });
  };

  const has = (id: string) => selectedIds.includes(id);
  const showTune =
    has('math') || has('shake') || has('squat') || has('typing') || has('memory') || has('tap');

  // Dry run the current chain: completes back here, saves no history.
  const handlePreview = () => {
    const missions = chain.map(m => ({
      id: m.id,
      title: m.title,
      description: m.description,
      difficulty: m.difficulty,
    }));
    navigation.navigate('MissionExecution', {
      alarm: {
        id: 'preview',
        time: '7:00',
        period: 'AM',
        days: 'Preview',
        dayNames: [],
        sound: { id: 'classic', name: 'Classic Alarm' },
        mission: missions[0],
        missions,
        missionConfig: {
          mathDifficulty,
          mathProblems,
          shakeTarget,
          squatTarget,
          typingReps,
          memoryLength,
          tapTarget,
        },
        enabled: false,
      },
      preview: true,
    });
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <ScreenHeader
          title="Wake-up Mission"
          subtitle="Choose a challenge that gets you fully awake"
          onBack={navigation.goBack}
        />

        <Card style={styles.selectedCard}>
          <View style={styles.selectedText}>
            <Text style={styles.selectedLabel}>
              SELECTED {chain.length > 1 ? `CHAIN (${chain.length})` : 'MISSION'}
            </Text>
            {chain.map((m, i) => (
              <Text key={m.id} style={styles.selectedTitle}>
                {chain.length > 1 ? `${i + 1}. ${m.title}` : m.title}
              </Text>
            ))}
            <Text style={styles.selectedDescription}>{chain[0]?.description ?? ''}</Text>
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Missions</Text>
          <Text style={styles.sectionHint}>
            {capNotice ? 'Max 3 missions' : `${selectedIds.length} of 3 selected`}
          </Text>
        </View>

        <View accessibilityRole="group">
          {MISSIONS.map(mission => {
            const order = selectedIds.indexOf(mission.id);
            return (
              <OptionRow
                key={mission.id}
                icon={order >= 0 ? `${order + 1}` : mission.icon}
                title={mission.title}
                description={mission.description}
                selected={order >= 0}
                badge={{
                  text: mission.difficulty,
                  color: colors[DIFFICULTY_COLOR_KEYS[mission.difficulty]],
                }}
                onPress={() => toggle(mission.id)}
              />
            );
          })}
        </View>

        {showTune ? (
          <Card style={styles.tuneCard}>
            <Text style={styles.tuneLabel}>ADJUST DIFFICULTY</Text>
            {has('math') ? (
              <>
                <Text style={styles.tuneTitle}>Math difficulty</Text>
                <View style={styles.pills}>
                  {(['Easy', 'Medium', 'Hard'] as const).map(level => (
                    <TouchableOpacity
                      key={level}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: mathDifficulty === level }}
                      accessibilityLabel={`Math difficulty ${level}`}
                      onPress={() => setMathDifficulty(level)}
                      style={[styles.pill, mathDifficulty === level && styles.pillSelected]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          mathDifficulty === level && styles.pillTextSelected,
                        ]}
                      >
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TuneStepper
                  label="Math problems"
                  value={mathProblems}
                  min={1}
                  max={5}
                  onChange={setMathProblems}
                />
              </>
            ) : null}
            {has('shake') ? (
              <TuneStepper
                label="Shake target"
                value={shakeTarget}
                min={10}
                max={100}
                step={10}
                onChange={setShakeTarget}
              />
            ) : null}
            {has('squat') ? (
              <TuneStepper
                label="Squat target"
                value={squatTarget}
                min={5}
                max={50}
                step={5}
                onChange={setSquatTarget}
              />
            ) : null}
            {has('typing') ? (
              <TuneStepper
                label="Typing reps"
                value={typingReps}
                min={1}
                max={3}
                onChange={setTypingReps}
              />
            ) : null}
            {has('memory') ? (
              <TuneStepper
                label="Memory length"
                value={memoryLength}
                min={3}
                max={6}
                onChange={setMemoryLength}
              />
            ) : null}
            {has('tap') ? (
              <TuneStepper
                label="Tap target"
                value={tapTarget}
                min={10}
                max={100}
                step={10}
                onChange={setTapTarget}
              />
            ) : null}
          </Card>
        ) : null}

        <View style={styles.actions}>
          <PrimaryButton
            label="Continue →"
            accessibilityLabel="Continue to summary"
            variant="dark"
            onPress={handleContinue}
          />
          <PrimaryButton label="Preview chain" variant="ghost" onPress={handlePreview} />
          <PrimaryButton label="Back" variant="ghost" onPress={navigation.goBack} />
        </View>
      </ScrollView>
    </Screen>
  );
}

function TuneStepper({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  const styles = createStyles(useThemeColors());
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
          onPress={() => onChange(Math.max(min, value - step))}
          style={styles.stepperButton}
          activeOpacity={0.7}
        >
          <Text style={styles.stepperGlyph}>−</Text>
        </TouchableOpacity>
        <Text style={styles.stepperValue}>{value}</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
          onPress={() => onChange(Math.min(max, value + step))}
          style={styles.stepperButton}
          activeOpacity={0.7}
        >
          <Text style={styles.stepperGlyph}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { paddingHorizontal: 20, paddingTop: SPACING.sm, paddingBottom: SPACING.xl },
    selectedCard: {
      marginTop: SPACING.md,
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
    },
    selectedRow: { flexDirection: 'row', alignItems: 'center' },
    selectedIcon: {
      width: 52,
      height: 52,
      borderRadius: 14,
      marginRight: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent,
    },
    selectedIconText: { fontSize: 24, color: colors.onAccent, fontWeight: '700' },
    selectedText: { flex: 1 },
    selectedLabel: {
      fontSize: FONT.caption,
      fontWeight: '700',
      letterSpacing: 1.5,
      color: colors.muted,
    },
    selectedTitle: { marginTop: 2, fontSize: FONT.title, fontWeight: '700', color: colors.text },
    selectedDescription: { marginTop: 2, fontSize: FONT.caption, color: colors.muted },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginTop: SPACING.lg,
      marginBottom: SPACING.sm,
    },
    sectionTitle: { fontSize: FONT.bodyLg, fontWeight: '700', color: colors.text },
    sectionHint: { fontSize: FONT.caption, color: colors.muted },
    tuneCard: { marginTop: SPACING.md },
    tuneLabel: {
      fontSize: FONT.caption,
      fontWeight: '700',
      letterSpacing: 1.5,
      color: colors.muted,
    },
    tuneTitle: {
      marginTop: SPACING.sm,
      fontSize: FONT.body,
      fontWeight: '700',
      color: colors.text,
    },
    pills: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
    pill: {
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 14,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.softBorder,
      overflow: 'hidden',
    },
    pillText: { fontSize: FONT.body, fontWeight: '700', color: colors.muted },
    pillSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    pillTextSelected: { color: colors.accent },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: SPACING.md,
    },
    stepperLabel: { fontSize: FONT.body, fontWeight: '700', color: colors.text },
    stepperControls: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    stepperButton: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepperGlyph: { fontSize: 22, fontWeight: '700', color: colors.accent },
    stepperValue: {
      fontSize: FONT.title,
      fontWeight: '700',
      color: colors.text,
      minWidth: 40,
      textAlign: 'center',
    },
    actions: { marginTop: SPACING.lg, gap: SPACING.sm },
  });

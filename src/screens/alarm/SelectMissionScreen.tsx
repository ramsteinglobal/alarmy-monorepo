import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Card from '../../components/Card';
import OptionRow from '../../components/OptionRow';
import PrimaryButton from '../../components/PrimaryButton';
import Screen from '../../components/Screen';
import ScreenHeader from '../../components/ScreenHeader';
import { DEFAULT_MISSION, Difficulty, MISSIONS } from '../../data/options';
import { COLORS, FONT, SPACING } from '../../theme';
import type { AlarmScreenProps } from '../../types/navigation';

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  Easy: COLORS.success,
  Medium: COLORS.accent,
  Hard: COLORS.danger,
};

export default function SelectMissionScreen({
  navigation,
  route,
}: AlarmScreenProps<'SelectMission'>) {
  const draft = route.params.alarm;
  const [selectedId, setSelectedId] = useState(draft.mission?.id ?? DEFAULT_MISSION.id);

  const selected = MISSIONS.find(m => m.id === selectedId) ?? DEFAULT_MISSION;

  // The sound travels inside `draft`, so it is not passed separately any more.
  const handleContinue = () => {
    navigation.navigate('AlarmSummary', {
      alarm: draft,
      mission: {
        id: selected.id,
        title: selected.title,
        description: selected.description,
        difficulty: selected.difficulty,
      },
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
          <View style={styles.selectedRow}>
            <View style={styles.selectedIcon}>
              <Text style={styles.selectedIconText}>{selected.icon}</Text>
            </View>
            <View style={styles.selectedText}>
              <Text style={styles.selectedLabel}>SELECTED MISSION</Text>
              <Text style={styles.selectedTitle}>{selected.title}</Text>
              <Text style={styles.selectedDescription}>{selected.description}</Text>
            </View>
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Missions</Text>
          <Text style={styles.sectionHint}>Choose one</Text>
        </View>

        <View accessibilityRole="radiogroup">
          {MISSIONS.map(mission => (
            <OptionRow
              key={mission.id}
              icon={mission.icon}
              title={mission.title}
              description={mission.description}
              selected={mission.id === selectedId}
              badge={{ text: mission.difficulty, color: DIFFICULTY_COLOR[mission.difficulty] }}
              onPress={() => setSelectedId(mission.id)}
            />
          ))}
        </View>

        <View style={styles.actions}>
          <PrimaryButton label="Continue →" variant="dark" onPress={handleContinue} />
          <PrimaryButton label="Back" variant="ghost" onPress={navigation.goBack} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: SPACING.sm, paddingBottom: SPACING.xl },
  selectedCard: { marginTop: SPACING.md, backgroundColor: COLORS.accentSoft, borderColor: COLORS.accent },
  selectedRow: { flexDirection: 'row', alignItems: 'center' },
  selectedIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
  },
  selectedIconText: { fontSize: 24, color: COLORS.onAccent, fontWeight: '700' },
  selectedText: { flex: 1 },
  selectedLabel: { fontSize: FONT.caption, fontWeight: '700', letterSpacing: 1.2, color: COLORS.muted },
  selectedTitle: { marginTop: 2, fontSize: FONT.title, fontWeight: '700', color: COLORS.text },
  selectedDescription: { marginTop: 2, fontSize: FONT.caption, color: COLORS.muted },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  sectionTitle: { fontSize: FONT.bodyLg, fontWeight: '700', color: COLORS.text },
  sectionHint: { fontSize: FONT.caption, color: COLORS.muted },
  actions: { marginTop: SPACING.lg, gap: SPACING.sm },
});

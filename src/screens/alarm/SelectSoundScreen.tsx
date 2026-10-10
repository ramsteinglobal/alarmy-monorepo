import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Card from '../../components/Card';
import OptionRow from '../../components/OptionRow';
import PrimaryButton from '../../components/PrimaryButton';
import Screen from '../../components/Screen';
import ScreenHeader from '../../components/ScreenHeader';
import { DEFAULT_SOUND, SOUNDS } from '../../data/options';
import { COLORS, FONT, SPACING } from '../../theme';
import type { AlarmScreenProps } from '../../types/navigation';

export default function SelectSoundScreen({ navigation, route }: AlarmScreenProps<'SelectSound'>) {
  const draft = route.params.alarm;
  const [selectedId, setSelectedId] = useState(draft.sound?.id ?? DEFAULT_SOUND.id);

  const current = SOUNDS.find(s => s.id === selectedId) ?? DEFAULT_SOUND;

  const handleContinue = () => {
    navigation.navigate('SelectMission', {
      alarm: {
        ...draft,
        sound: { id: current.id, name: current.name, description: current.description },
      },
    });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <ScreenHeader
          title="Select Sound"
          subtitle="Choose your wake-up sound"
          onBack={navigation.goBack}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>ALARM SOUND</Text>

        <View accessibilityRole="radiogroup">
          {SOUNDS.map(sound => (
            <OptionRow
              key={sound.id}
              icon={sound.icon}
              title={sound.name}
              description={sound.description}
              selected={sound.id === selectedId}
              onPress={() => setSelectedId(sound.id)}
            />
          ))}
        </View>

        <Card style={styles.preview}>
          <Text style={styles.previewLabel}>SELECTED SOUND</Text>
          <View style={styles.previewRow}>
            <Text style={styles.previewIcon}>{current.icon}</Text>
            <View>
              <Text style={styles.previewName}>{current.name}</Text>
              <Text style={styles.previewDescription}>{current.description}</Text>
            </View>
          </View>
        </Card>

        <View style={styles.actions}>
          <PrimaryButton label="Continue" variant="dark" onPress={handleContinue} />
          <PrimaryButton label="Cancel" variant="ghost" onPress={navigation.goBack} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: SPACING.sm },
  content: { paddingHorizontal: 20, paddingTop: SPACING.md, paddingBottom: SPACING.xl },
  sectionTitle: {
    fontSize: FONT.caption,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: COLORS.muted,
    marginBottom: SPACING.sm,
  },
  preview: { marginTop: SPACING.sm, backgroundColor: COLORS.card },
  previewLabel: {
    fontSize: FONT.caption,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: COLORS.muted,
  },
  previewRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm, gap: 12 },
  previewIcon: { fontSize: 28 },
  previewName: { fontSize: FONT.bodyLg, fontWeight: '700', color: COLORS.text },
  previewDescription: { fontSize: FONT.caption, color: COLORS.muted },
  actions: { marginTop: SPACING.lg, gap: SPACING.sm },
});

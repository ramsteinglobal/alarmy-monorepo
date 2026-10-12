import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Card from '../../components/Card';
import OptionRow from '../../components/OptionRow';
import PrimaryButton from '../../components/PrimaryButton';
import Screen from '../../components/Screen';
import ScreenHeader from '../../components/ScreenHeader';
import { DEFAULT_SOUND, SOUNDS } from '../../data/options';
import { getDefaultSoundId } from '../../storage/prefs';
import { previewSound } from '../../services/alarmScheduler';
import { FONT, SPACING, type ThemeColors } from '../../theme';
import { useThemeColors } from '../../store/ThemeContext';
import type { AlarmScreenProps } from '../../types/navigation';

export default function SelectSoundScreen({ navigation, route }: AlarmScreenProps<'SelectSound'>) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const draft = route.params.alarm;
  const [selectedId, setSelectedId] = useState(draft.sound?.id ?? DEFAULT_SOUND.id);

  // New alarms start on the user's default sound from Settings.
  useEffect(() => {
    if (draft.sound) return;
    getDefaultSoundId().then(id => {
      if (SOUNDS.some(s => s.id === id)) setSelectedId(id);
    });
  }, [draft.sound]);

  const current = SOUNDS.find(s => s.id === selectedId) ?? DEFAULT_SOUND;

  const handleContinue = () => {
    navigation.navigate('SelectMission', {
      alarm: {
        ...draft,
        sound: {
          id: current.id,
          name: current.name,
          description: current.description,
          file: current.file,
        },
      },
    });
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <ScreenHeader
          title="Select Sound"
          subtitle="Choose your wake-up sound"
          onBack={navigation.goBack}
        />

        <Text style={styles.sectionTitle}>Alarm sound</Text>

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
          <PrimaryButton
            label="Continue →"
            accessibilityLabel="Continue to missions"
            variant="dark"
            onPress={handleContinue}
          />
          <PrimaryButton
            label={current.file ? 'Preview sound' : 'Vibration only — no sound'}
            accessibilityLabel={
              current.file ? `Preview ${current.name} sound` : 'Vibration only, no sound to preview'
            }
            variant="ghost"
            disabled={!current.file}
            onPress={() => previewSound(current.id, current.name, current.file)}
          />
          <PrimaryButton label="Back" variant="ghost" onPress={navigation.goBack} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: { paddingHorizontal: 20, paddingTop: SPACING.sm, paddingBottom: SPACING.xl },
    sectionTitle: {
      fontSize: FONT.bodyLg,
      fontWeight: '700',
      color: colors.text,
      marginTop: SPACING.md,
      marginBottom: SPACING.sm,
    },
    preview: { marginTop: SPACING.sm, backgroundColor: colors.card },
    previewLabel: {
      fontSize: FONT.caption,
      fontWeight: '700',
      letterSpacing: 1.2,
      color: colors.muted,
    },
    previewRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm, gap: 12 },
    previewIcon: { fontSize: 28 },
    previewName: { fontSize: FONT.bodyLg, fontWeight: '700', color: colors.text },
    previewDescription: { fontSize: FONT.caption, color: colors.muted },
    actions: { marginTop: SPACING.lg, gap: SPACING.sm },
  });

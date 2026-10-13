import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Card from '../../components/Card';
import OptionRow from '../../components/OptionRow';
import PrimaryButton from '../../components/PrimaryButton';
import Screen from '../../components/Screen';
import ScreenHeader from '../../components/ScreenHeader';
import { DEFAULT_SOUND, SOUNDS, type Sound } from '../../data/options';
import { getDefaultSoundId } from '../../storage/prefs';
import {
  fetchSystemRingtones,
  playSoundPreview,
  stopSoundPreview,
  type SystemRingtone,
} from '../../services/nativeAudio';
import { FONT, RADIUS, SPACING, type ThemeColors } from '../../theme';
import { useThemeColors } from '../../store/ThemeContext';
import type { AlarmScreenProps } from '../../types/navigation';

export default function SelectSoundScreen({ navigation, route }: AlarmScreenProps<'SelectSound'>) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const draft = route.params.alarm;
  const [selectedId, setSelectedId] = useState(draft.sound?.id ?? DEFAULT_SOUND.id);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [systemRingtones, setSystemRingtones] = useState<SystemRingtone[]>([]);
  const [selectedSystemRingtone, setSelectedSystemRingtone] = useState<SystemRingtone | null>(null);

  // New alarms start on the user's default sound from Settings.
  useEffect(() => {
    if (draft.sound) return;
    getDefaultSoundId().then(id => {
      if (SOUNDS.some(s => s.id === id)) setSelectedId(id);
    });
  }, [draft.sound]);

  // Load system ringtones from device
  useEffect(() => {
    fetchSystemRingtones().then(ringtones => {
      if (ringtones.length > 0) {
        setSystemRingtones(ringtones);
      }
    });
    return () => {
      stopSoundPreview();
    };
  }, []);

  const currentBuiltin = SOUNDS.find(s => s.id === selectedId) ?? DEFAULT_SOUND;

  const handleSelectBuiltin = (sound: Sound) => {
    setSelectedId(sound.id);
    setSelectedSystemRingtone(null);
    handleTogglePlay(sound.id, sound.name, sound.file);
  };

  const handleSelectSystem = (ringtone: SystemRingtone) => {
    setSelectedId(`system:${ringtone.title}`);
    setSelectedSystemRingtone(ringtone);
    handleTogglePlay(`system:${ringtone.title}`, ringtone.title, undefined, ringtone.uri);
  };

  const handleTogglePlay = async (id: string, name: string, file?: string, uri?: string) => {
    if (playingId === id) {
      await stopSoundPreview();
      setPlayingId(null);
    } else {
      if (file || uri) {
        setPlayingId(id);
        await playSoundPreview(id, name, file, uri);
      } else {
        await stopSoundPreview();
        setPlayingId(null);
      }
    }
  };

  const handleContinue = () => {
    stopSoundPreview();
    const chosenSound = selectedSystemRingtone
      ? {
          id: `system_${selectedSystemRingtone.title}`,
          name: selectedSystemRingtone.title,
          description: 'Device Alarm Ringtone',
          file: selectedSystemRingtone.uri,
        }
      : {
          id: currentBuiltin.id,
          name: currentBuiltin.name,
          description: currentBuiltin.description,
          file: currentBuiltin.file,
        };

    navigation.navigate('SelectMission', {
      alarm: {
        ...draft,
        sound: chosenSound,
      },
    });
  };

  const handleBack = () => {
    stopSoundPreview();
    navigation.goBack();
  };

  const activeName = selectedSystemRingtone ? selectedSystemRingtone.title : currentBuiltin.name;
  const activeDesc = selectedSystemRingtone
    ? 'Device system alarm sound'
    : currentBuiltin.description;
  const activeIcon = selectedSystemRingtone ? '🎵' : currentBuiltin.icon;
  const isCurrentlyPlaying = playingId !== null;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <ScreenHeader
          title="Select Sound"
          subtitle="Choose your wake-up ringtone"
          onBack={handleBack}
        />

        <Text style={styles.sectionTitle}>Curated Alarm Sounds</Text>

        <View accessibilityRole="radiogroup">
          {SOUNDS.map(sound => {
            const isSelected = selectedSystemRingtone === null && sound.id === selectedId;
            const isPlayingThis = playingId === sound.id;
            return (
              <OptionRow
                key={sound.id}
                icon={isPlayingThis ? '🔊' : sound.icon}
                title={sound.name + (isPlayingThis ? ' (Playing...)' : '')}
                description={sound.description}
                selected={isSelected}
                onPress={() => handleSelectBuiltin(sound)}
              />
            );
          })}
        </View>

        {systemRingtones.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Device Alarm Ringtones</Text>
            <View accessibilityRole="radiogroup">
              {systemRingtones.slice(0, 8).map(ringtone => {
                const ringtoneId = `system:${ringtone.title}`;
                const isSelected = selectedId === ringtoneId;
                const isPlayingThis = playingId === ringtoneId;
                return (
                  <OptionRow
                    key={ringtone.uri || ringtone.title}
                    icon={isPlayingThis ? '🔊' : '🎵'}
                    title={ringtone.title + (isPlayingThis ? ' (Playing...)' : '')}
                    description="System ringtone"
                    selected={isSelected}
                    onPress={() => handleSelectSystem(ringtone)}
                  />
                );
              })}
            </View>
          </>
        )}

        <Card style={styles.preview}>
          <Text style={styles.previewLabel}>SELECTED SOUND</Text>
          <View style={styles.previewRow}>
            <Text style={styles.previewIcon}>{activeIcon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.previewName}>{activeName}</Text>
              <Text style={styles.previewDescription}>{activeDesc}</Text>
            </View>
            {(currentBuiltin.file || selectedSystemRingtone) && (
              <TouchableOpacity
                style={[styles.playButton, isCurrentlyPlaying && styles.playButtonActive]}
                onPress={() =>
                  handleTogglePlay(
                    selectedId,
                    activeName,
                    selectedSystemRingtone ? undefined : currentBuiltin.file,
                    selectedSystemRingtone?.uri,
                  )
                }
                activeOpacity={0.7}
              >
                <Text style={styles.playButtonText}>
                  {isCurrentlyPlaying ? '■ Stop' : '▶ Play'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        <View style={styles.actions}>
          <PrimaryButton
            label="Continue →"
            accessibilityLabel="Continue to missions"
            variant="dark"
            onPress={handleContinue}
          />
          <PrimaryButton label="Back" variant="ghost" onPress={handleBack} />
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
    playButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: RADIUS.md,
      backgroundColor: colors.accent,
    },
    playButtonActive: {
      backgroundColor: colors.danger,
    },
    playButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: FONT.body,
    },
    actions: { marginTop: SPACING.lg, gap: SPACING.sm },
  });

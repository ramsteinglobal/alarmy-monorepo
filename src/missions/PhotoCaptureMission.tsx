import React, { useState } from 'react';
import { Image, Linking, Text, View } from 'react-native';
import { launchCamera, type Asset } from 'react-native-image-picker';
import PrimaryButton from '../components/PrimaryButton';
import { useThemeColors } from '../store/ThemeContext';
import MissionCard, { createMissionStyles } from './MissionCard';
import type { MissionProps } from './types';

type Props = MissionProps & {
  /** 'photo' = registered object, 'barcode' = registered code. */
  kind: 'photo' | 'barcode';
};

/**
 * Proof-by-capture mission: photograph the registered object/code to stop
 * the alarm. The photo itself is the proof you got out of bed.
 */
export default function PhotoCaptureMission({ kind, onComplete }: Props) {
  const colors = useThemeColors();
  const missionStyles = createMissionStyles(colors);
  const [photo, setPhoto] = useState<Asset | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBarcode = kind === 'barcode';

  const openCamera = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.7,
        saveToPhotos: false,
        presentationStyle: 'fullScreen',
      });
      if (result.didCancel) return;
      if (result.errorCode) {
        if (result.errorCode === 'permission') {
          setError('Camera access is off. Turn it on to finish this mission.');
        } else {
          setError(result.errorMessage ?? 'Camera failed. Please try again.');
        }
        return;
      }
      const asset = result.assets?.[0];
      if (asset?.uri) setPhoto(asset);
      else setError('No photo captured. Please try again.');
    } catch {
      setError('Camera failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <MissionCard
        label={isBarcode ? 'SCAN YOUR CODE' : 'PHOTO PROOF'}
        hint={
          isBarcode
            ? 'Photograph your registered barcode or QR code.'
            : 'Get up and photograph your registered object.'
        }
      >
        {photo?.uri ? (
          <Image
            source={{ uri: photo.uri }}
            accessibilityLabel="Captured proof photo"
            style={{ width: 220, height: 220, borderRadius: 14, marginTop: 12 }}
          />
        ) : (
          <Text style={{ fontSize: 52, marginTop: 12 }}>{isBarcode ? '▥' : '▣'}</Text>
        )}
      </MissionCard>
      {error ? <Text style={missionStyles.error}>{error}</Text> : null}
      {error?.startsWith('Camera access') ? (
        <View style={{ marginTop: 8, alignItems: 'center' }}>
          <PrimaryButton
            label="OPEN SETTINGS"
            variant="ghost"
            onPress={() => Linking.openSettings()}
          />
        </View>
      ) : null}
      <View style={{ height: 16 }} />
      <PrimaryButton
        label={
          busy
            ? 'OPENING CAMERA…'
            : photo
            ? 'RETAKE PHOTO'
            : isBarcode
            ? 'SCAN BARCODE'
            : 'OPEN CAMERA'
        }
        loading={busy}
        onPress={openCamera}
      />
      {photo ? (
        <>
          <View style={{ height: 10 }} />
          <PrimaryButton label="USE THIS PHOTO →" variant="dark" onPress={onComplete} />
        </>
      ) : null}
    </>
  );
}

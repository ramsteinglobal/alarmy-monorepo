import React from 'react';
import { Alert, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import MissionCard from './MissionCard';
import type { MissionProps } from './types';

type Props = MissionProps & {
  icon: string;
  title: string;
  description: string;
  buttonLabel: string;
};

/**
 * Photo and barcode placeholder.
 * TODO: replace with react-native-vision-camera (photo match / barcode scan).
 * "Complete Demo" is kept so the flow can still be tested end to end.
 */
export default function DemoMission({ icon, title, description, buttonLabel, onComplete }: Props) {
  const open = () =>
    Alert.alert(title, 'Camera integration will be added later.', [
      { text: 'Complete Demo', onPress: onComplete },
      { text: 'Cancel', style: 'cancel' },
    ]);

  return (
    <>
      <MissionCard icon={icon} title={title} hint={description} />
      <View style={{ height: 16 }} />
      <PrimaryButton label={buttonLabel} onPress={open} />
    </>
  );
}

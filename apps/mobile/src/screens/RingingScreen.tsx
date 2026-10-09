import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Ringing'>;

// Ringing screen: alarm can ONLY be dismissed by completing the mission.
// Do NOT add a plain "Dismiss" button here — that defeats the Alarmy model.
export function RingingScreen({ route }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>⏰ Alarm ringing</Text>
      <Text>Alarm ID: {route.params.alarmId}</Text>
      <Text>TODO: render active mission (math / shake / photo / QR).</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
});

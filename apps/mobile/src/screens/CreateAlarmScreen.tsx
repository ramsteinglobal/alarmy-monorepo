import { View, Text, StyleSheet } from 'react-native';

export function CreateAlarmScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create alarm</Text>
      <Text>TODO: time picker + mission picker (math / shake / photo / QR).</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold' },
});

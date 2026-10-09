import { Text, StyleSheet } from 'react-native';

export function AlarmRow({ label, time }: { label: string; time: string }) {
  return (
    <Text style={styles.row}>
      {time} — {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  row: { fontSize: 16, paddingVertical: 8 },
});

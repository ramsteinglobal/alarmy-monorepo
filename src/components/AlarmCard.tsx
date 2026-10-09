import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { COLORS } from '../theme';

type Props = {
  time: string;
  period: string;
  days: string;
  label: string;
  mission?: string;
  enabled: boolean;
};

export default function AlarmCard({
  time,
  period,
  days,
  label,
  mission,
  enabled,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View>
          <View style={styles.timeRow}>
            <Text style={styles.time}>{time}</Text>
            <Text style={styles.period}>{period}</Text>
          </View>
          <Text style={styles.days}>{days}</Text>
        </View>
        <Switch
          value={enabled}
          trackColor={{ false: '#DDDDDD', true: '#D7A62A' }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={styles.bottom}>
        <Text style={styles.label}>◷ {label}</Text>
        {mission ? <Text style={styles.mission}>▣ {mission}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#555555',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeRow: { flexDirection: 'row', alignItems: 'baseline' },
  time: { fontSize: 32, fontWeight: '700', color: '#555555' },
  period: { fontSize: 12, fontWeight: '700', marginLeft: 4, color: '#555555' },
  days: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  bottom: {
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    marginTop: 12,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: { fontSize: 10, color: COLORS.text },
  mission: { fontSize: 10, color: COLORS.accent, fontWeight: '700' },
});

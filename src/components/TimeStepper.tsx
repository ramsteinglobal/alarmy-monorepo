import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONT, RADIUS, TOUCH_MIN } from '../theme';

type Props = {
  label: string; // "hour" | "minute" (used by screen readers)
  value: string;
  onIncrement: () => void;
  onDecrement: () => void;
};

/** ▲ value ▼ with press-and-hold to repeat, so 7:52 → 7:00 does not take 52 taps. */
export default function TimeStepper({ label, value, onIncrement, onDecrement }: Props) {
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const inc = useRef(onIncrement);
  const dec = useRef(onDecrement);
  inc.current = onIncrement;
  dec.current = onDecrement;

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };
  useEffect(() => stop, []);

  const hold = (action: React.MutableRefObject<() => void>) => () => {
    stop();
    timer.current = setInterval(() => action.current(), 90);
  };

  return (
    <View style={styles.column}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Increase ${label}`}
        onPress={onIncrement}
        onLongPress={hold(inc)}
        onPressOut={stop}
        delayLongPress={350}
        style={styles.arrowButton}
      >
        <Text style={styles.arrow}>▲</Text>
      </TouchableOpacity>

      <Text
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ text: value }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={e =>
          e.nativeEvent.actionName === 'increment' ? onIncrement() : onDecrement()
        }
        style={styles.value}
      >
        {value}
      </Text>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${label}`}
        onPress={onDecrement}
        onLongPress={hold(dec)}
        onPressOut={stop}
        delayLongPress={350}
        style={styles.arrowButton}
      >
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  column: { alignItems: 'center', minWidth: 72 },
  arrowButton: {
    width: 64,
    height: TOUCH_MIN + 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
  },
  arrow: { fontSize: FONT.title, color: COLORS.accent },
  value: { fontSize: 52, lineHeight: 60, fontWeight: '700', color: COLORS.text },
});

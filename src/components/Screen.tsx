import React from 'react';
import { StatusBar, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { COLORS } from '../theme';

type Props = {
  children: React.ReactNode;
  backgroundColor?: string;
  edges?: Edge[];
  style?: ViewStyle;
  lightContent?: boolean;
};

/** Safe-area aware screen wrapper. Use instead of View / react-native SafeAreaView. */
export default function Screen({
  children,
  backgroundColor = COLORS.background,
  edges = ['top', 'bottom', 'left', 'right'],
  style,
  lightContent = false,
}: Props) {
  return (
    <SafeAreaView edges={edges} style={[styles.fill, { backgroundColor }, style]}>
      <StatusBar
        barStyle={lightContent ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundColor}
      />
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });

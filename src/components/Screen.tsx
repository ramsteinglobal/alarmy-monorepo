import React from 'react';
import { StatusBar, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { useTheme } from '../store/ThemeContext';

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
  backgroundColor,
  edges = ['top', 'bottom', 'left', 'right'],
  style,
  lightContent,
}: Props) {
  const { colors, isDark } = useTheme();
  return (
    <SafeAreaView
      edges={edges}
      style={[styles.fill, { backgroundColor: backgroundColor ?? colors.background }, style]}
    >
      <StatusBar barStyle={lightContent || isDark ? 'light-content' : 'dark-content'} />
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});

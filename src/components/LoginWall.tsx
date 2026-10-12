import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import PrimaryButton from './PrimaryButton';
import Screen from './Screen';
import { FONT, SPACING, type ThemeColors } from '../theme';
import { useThemeColors } from '../store/ThemeContext';
import type { RootStackParamList } from '../types/navigation';

type Props = {
  icon: string;
  title: string;
  message: string;
};

/**
 * Shown on account-only tabs (Sleep, Morning, Report) when the user
 * is trying Wakely as a guest. Core alarms always work without login.
 */
export default function LoginWall({ icon, title, message }: Props) {
  const rootNavigation = useNavigation<NavigationProp<RootStackParamList>>();
  const styles = createStyles(useThemeColors());

  return (
    <Screen edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <View style={styles.icon}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.actions}>
          <PrimaryButton label="SIGN IN" onPress={() => rootNavigation.navigate('Login')} />
          <PrimaryButton
            label="CREATE FREE ACCOUNT"
            variant="ghost"
            onPress={() => rootNavigation.navigate('Signup')}
          />
        </View>
        <Text style={styles.note}>Alarms on the Alarm tab always work without an account.</Text>
      </View>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
    icon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.accentTint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconText: { fontSize: 32 },
    title: {
      marginTop: SPACING.md,
      fontSize: FONT.headline,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    message: {
      marginTop: 8,
      fontSize: FONT.body,
      lineHeight: 22,
      textAlign: 'center',
      color: colors.muted,
    },
    actions: { alignSelf: 'stretch', marginTop: SPACING.lg, gap: SPACING.sm },
    note: {
      marginTop: SPACING.md,
      fontSize: FONT.caption,
      textAlign: 'center',
      color: colors.muted,
    },
  });

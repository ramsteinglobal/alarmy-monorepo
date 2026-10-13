import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, type NavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { doc, getDoc, getFirestore, updateDoc } from '@react-native-firebase/firestore';

import Screen from '../../components/Screen';
import { FONT, type ThemeColors } from '../../theme';
import { useTheme, useThemeColors } from '../../store/ThemeContext';
import { firebaseAuth, getAuthErrorMessage, logOut } from '../../config/firebaseSetup';
import {
  getAlarmReliabilityStatus,
  needsFullScreenIntentRow,
  openAutostartSettings,
  openBatterySettings,
  openExactAlarmSettings,
  openFullScreenIntentSettings,
  openOverlaySettings,
  openSystemNotificationSettings,
  type ReliabilityStatus,
} from '../../services/permissionsService';
import { getAlarms } from '../../storage/alarmStorage';
import { applyVibrationPreference, rescheduleAll } from '../../services/alarmScheduler';
import { SOUNDS } from '../../data/options';
import {
  getDefaultAutoDismiss,
  getDefaultSoundId,
  getVibrationEnabled,
  setDefaultAutoDismiss,
  setDefaultSoundId,
  setVibrationEnabled,
} from '../../storage/prefs';
import { getSleepGoalHours, setSleepGoalHours } from '../../storage/sleepStorage';
import type { MainTabParamList, RootStackParamList } from '../../types/navigation';

type UserProfile = {
  fullName: string;
  email: string;
  sleepPersona?: string;
  provider: string;
};

const personaLabels: Record<string, string> = {
  early: 'Early Bird',
  deep: 'Deep Sleeper',
  napper: 'Power Napper',
};

export default function SettingsDashboardScreen() {
  const tabNavigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const rootNavigation = tabNavigation.getParent<NavigationProp<RootStackParamList>>();
  const [vibration, setVibration] = useState(true);
  const [defaultSoundName, setDefaultSoundName] = useState('Classic Alarm');
  const [sleepGoal, setSleepGoal] = useState(8);
  const [autoDismissDefault, setAutoDismissDefault] = useState(30);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [reliability, setReliability] = useState<ReliabilityStatus | null>(null);
  const { colors, mode: themeMode, setMode: setThemeMode } = useTheme();
  const styles = createStyles(colors);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const loadProfile = async () => {
        const user = firebaseAuth.currentUser;
        if (!user) {
          if (active) {
            setProfile(null);
            setProfileLoading(false);
          }
          return;
        }

        setProfileLoading(true);
        try {
          const profileSnapshot = await getDoc(doc(getFirestore(), 'users', user.uid));
          const savedProfile = profileSnapshot.exists() ? profileSnapshot.data() : {};
          const providerId = user.providerData[0]?.providerId;
          if (active) {
            setProfile({
              fullName: savedProfile.fullName ?? user.displayName ?? 'Alarm User',
              email: savedProfile.email ?? user.email ?? '',
              sleepPersona: savedProfile.sleepPersona,
              provider:
                savedProfile.provider === 'google'
                  ? 'Google'
                  : savedProfile.provider === 'password'
                  ? 'Email and password'
                  : savedProfile.provider ??
                    (providerId === 'google.com' ? 'Google' : 'Email and password'),
            });
          }
        } catch {
          if (active) {
            setProfile({
              fullName: user.displayName ?? 'Alarm User',
              email: user.email ?? '',
              provider:
                user.providerData[0]?.providerId === 'google.com' ? 'Google' : 'Email and password',
            });
          }
        } finally {
          if (active) setProfileLoading(false);
        }
      };

      loadProfile();
      return () => {
        active = false;
      };
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getAlarmReliabilityStatus().then(status => {
        if (active) setReliability(status);
      });
      getVibrationEnabled().then(v => active && setVibration(v));
      getDefaultSoundId().then(id => {
        if (!active) return;
        setDefaultSoundName(SOUNDS.find(s => s.id === id)?.name ?? 'Classic Alarm');
      });
      getSleepGoalHours().then(h => active && setSleepGoal(h));
      getDefaultAutoDismiss().then(m => active && setAutoDismissDefault(m));
      return () => {
        active = false;
      };
    }, []),
  );

  const handleVibrationChange = (enabled: boolean) => {
    setVibration(enabled);
    setVibrationEnabled(enabled).catch(error => console.error('Failed to save vibration:', error));
    applyVibrationPreference(enabled).catch(error =>
      console.error('Failed to apply vibration:', error),
    );
    // Rebuild triggers so future rings use the new channel setting.
    getAlarms()
      .then(alarms =>
        rescheduleAll(
          alarms.filter(a => a.enabled),
          { vibration: enabled },
        ),
      )
      .catch(error => console.error('Failed to reschedule after vibration change:', error));
  };

  const pickDefaultSound = () => {
    Alert.alert('Default Sound', 'Used for new alarms. Existing alarms keep their sound.', [
      ...SOUNDS.map(s => ({
        text: s.name,
        onPress: () => {
          setDefaultSoundId(s.id).catch(error =>
            console.error('Failed to save default sound:', error),
          );
          setDefaultSoundName(s.name);
        },
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const pickSleepGoal = () => {
    Alert.alert('Sleep Goal', 'Nightly target used across Sleep and Report.', [
      ...[6, 7, 8, 9, 10].map(h => ({
        text: `${h} hours`,
        onPress: () => {
          setSleepGoalHours(h).catch(error => console.error('Failed to save sleep goal:', error));
          setSleepGoal(h);
        },
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const pickAutoDismissDefault = () => {
    const options = [0, 15, 30, 60];
    Alert.alert(
      'Auto-Dismiss Default',
      'New alarms silence themselves after this long if untouched. 0 = off.',
      [
        ...options.map(m => ({
          text: m === 0 ? 'Off' : `${m} min`,
          onPress: () => {
            setDefaultAutoDismiss(m).catch(error =>
              console.error('Failed to save auto-dismiss default:', error),
            );
            setAutoDismissDefault(m);
          },
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ],
    );
  };

  const showHelp = () => {
    Alert.alert(
      'Help & Support',
      'Alarms not ringing?\n\n1. Settings → Alarm Reliability: all rows should say ON.\n2. On Android 14+, allow "Pop-up over lock screen".\n3. On Xiaomi/Oppo/Vivo, enable "Autostart" (FIX row) and lock Wakely in recent apps.\n4. Disable battery optimization for Wakely.\n5. Test with an alarm 1 minute away.',
    );
  };

  const pickSleepPersona = () => {
    if (isGuest) {
      goToLogin();
      return;
    }
    const user = firebaseAuth.currentUser;
    if (!user) return;
    Alert.alert('Sleep persona', 'Used to personalize your mornings.', [
      ...(['early', 'deep', 'napper'] as const).map(id => ({
        text: personaLabels[id],
        onPress: () => {
          updateDoc(doc(getFirestore(), 'users', user.uid), { sleepPersona: id })
            .then(() => setProfile(cur => (cur ? { ...cur, sleepPersona: id } : cur)))
            .catch(() => Alert.alert('Could not save', 'Please try again.'));
        },
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const confirmLogout = () => {
    Alert.alert('Log out?', 'Your alarms stay on this phone. Sign in again anytime to sync.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            // Guest flow: stay in Main, Settings re-renders as guest.
            await logOut();
            Alert.alert('Signed out', 'Your alarms are still saved on this phone.');
          } catch (error) {
            Alert.alert('Log out failed', getAuthErrorMessage(error));
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  const isGuest = !profileLoading && !profile;

  const goToLogin = () => rootNavigation.navigate('Login');
  const goToSignup = () => rootNavigation.navigate('Signup');

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header */}

        <View style={styles.header}>
          <Text style={styles.headerSmall}>APP PREFERENCES</Text>

          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Profile */}

        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {(
                profile?.fullName?.trim().charAt(0) ||
                profile?.email?.charAt(0) ||
                'A'
              ).toUpperCase()}
            </Text>
          </View>

          <View style={styles.profileContent}>
            <Text style={styles.profileName}>
              {profileLoading ? 'Loading profile…' : profile?.fullName ?? 'Trying Wakely'}
            </Text>

            <Text style={styles.profileSubtitle}>
              {profileLoading ? 'Please wait…' : profile?.email || 'Alarms work without an account'}
            </Text>
            {isGuest ? (
              <View style={styles.guestActions}>
                <TouchableOpacity
                  style={styles.signInButton}
                  onPress={goToLogin}
                  activeOpacity={0.8}
                >
                  <Text style={styles.signInText}>Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={goToSignup} activeOpacity={0.7}>
                  <Text style={styles.signUpText}>Create free account</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>

        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.card}>
          <AccountInfoRow label="Sign-in method" value={profile?.provider ?? '—'} />
          <View style={styles.divider} />
          <TouchableOpacity onPress={pickSleepPersona} activeOpacity={0.7}>
            <AccountInfoRow
              label="Sleep persona"
              value={
                profile?.sleepPersona
                  ? personaLabels[profile.sleepPersona] ?? profile.sleepPersona
                  : isGuest
                  ? 'Sign in to set'
                  : 'Not set · tap to choose'
              }
            />
          </TouchableOpacity>
        </View>

        {/* Appearance */}

        <Text style={styles.sectionTitle}>APPEARANCE</Text>

        <View style={styles.card}>
          <ThemeRow
            title="Light"
            subtitle="Bright white theme"
            selected={themeMode === 'light'}
            onPress={() => setThemeMode('light')}
          />

          <View style={styles.divider} />

          <ThemeRow
            title="Dark"
            subtitle="Easy on the eyes at night"
            selected={themeMode === 'dark'}
            onPress={() => setThemeMode('dark')}
          />

          <View style={styles.divider} />

          <ThemeRow
            title="System"
            subtitle="Follow phone settings"
            selected={themeMode === 'system'}
            onPress={() => setThemeMode('system')}
          />
        </View>

        {/* Alarm Settings */}

        <Text style={styles.sectionTitle}>ALARM SETTINGS</Text>

        <View style={styles.card}>
          <SettingRow
            icon="♪"
            title="Default Sound"
            subtitle={`${defaultSoundName} · for new alarms`}
            onPress={pickDefaultSound}
          />

          <View style={styles.divider} />

          <SettingRow
            icon="✓"
            title="Missions"
            subtitle="Missions are set per alarm"
            onPress={() => tabNavigation.navigate('Alarm', { screen: 'AlarmDashboard' })}
          />

          <View style={styles.divider} />

          <SettingRow
            icon="◷"
            title="Alarm Behavior"
            subtitle={`Auto-dismiss after ${
              autoDismissDefault === 0 ? 'off' : `${autoDismissDefault} min`
            }`}
            onPress={pickAutoDismissDefault}
          />
        </View>

        {/* Alarm Reliability */}

        <Text style={styles.sectionTitle}>ALARM RELIABILITY</Text>

        <View style={styles.card}>
          <ReliabilityRow
            title="Notifications"
            subtitle="Alarms ring through notifications"
            state={reliability?.notifications}
            onFix={openSystemNotificationSettings}
          />

          <View style={styles.divider} />

          <ReliabilityRow
            title="Exact alarms"
            subtitle="Ring at the exact time (Android 12+)"
            state={reliability?.exactAlarm}
            onFix={openExactAlarmSettings}
          />

          <View style={styles.divider} />

          <ReliabilityRow
            title="Battery unrestricted"
            subtitle="Prevents the system delaying alarms"
            state={
              reliability?.batteryUnrestricted == null
                ? 'unknown'
                : reliability.batteryUnrestricted
                ? 'granted'
                : 'denied'
            }
            onFix={openBatterySettings}
          />

          {Platform.OS === 'android' && needsFullScreenIntentRow() ? (
            <>
              <View style={styles.divider} />

              <ReliabilityRow
                title="Pop-up over lock screen"
                subtitle="Android 14+ needs this to show the alarm — tap CHECK to allow"
                state="unknown"
                onFix={() => {
                  openFullScreenIntentSettings().catch(error =>
                    console.error('Failed to open full-screen settings:', error),
                  );
                }}
              />
            </>
          ) : null}

          {Platform.OS === 'android' ? (
            <>
              <View style={styles.divider} />

              <ReliabilityRow
                title="Display over other apps"
                subtitle="Lets alarm take over screen while using phone — tap CHECK"
                state="unknown"
                onFix={() => {
                  openOverlaySettings().catch(error =>
                    console.error('Failed to open overlay settings:', error),
                  );
                }}
              />
            </>
          ) : null}

          {Platform.OS === 'android' && reliability?.autostartNeeded ? (
            <>
              <View style={styles.divider} />

              <ReliabilityRow
                title="Autostart"
                subtitle="Lets alarms fire after reboot and in background — tap FIX"
                state="denied"
                onFix={() => {
                  openAutostartSettings().catch(error =>
                    console.error('Failed to open autostart settings:', error),
                  );
                }}
              />
            </>
          ) : null}
        </View>

        {/* Notifications */}

        <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>

        <View style={styles.card}>
          <SettingRow
            icon="●"
            title="Notifications"
            subtitle={
              reliability?.notifications === 'denied'
                ? 'Off — tap to fix'
                : 'On — alarms ring through these'
            }
            onPress={openSystemNotificationSettings}
          />

          <View style={styles.divider} />

          <ToggleRow
            icon="◉"
            title="Vibration"
            subtitle="Vibrate when the alarm rings"
            value={vibration}
            onValueChange={handleVibrationChange}
          />
        </View>

        {/* Sleep Preferences */}

        <Text style={styles.sectionTitle}>SLEEP PREFERENCES</Text>

        <View style={styles.card}>
          <SettingRow
            icon="☾"
            title="Sleep Goal"
            subtitle={`${sleepGoal} hours nightly`}
            onPress={pickSleepGoal}
          />

          <View style={styles.divider} />

          <SettingRow
            icon="☀"
            title="Morning Routine"
            subtitle="Open your morning checklist"
            onPress={() => tabNavigation.navigate('Morning')}
          />
        </View>

        {/* Support */}

        <Text style={styles.sectionTitle}>SUPPORT</Text>

        <View style={styles.card}>
          <SettingRow
            icon="?"
            title="Help & Support"
            subtitle="Alarms not ringing? Start here"
            onPress={showHelp}
          />

          <View style={styles.divider} />

          <SettingRow
            icon="i"
            title="About"
            subtitle="Wakely App"
            onPress={() => Alert.alert('About', 'Wakely\nVersion 1.0.0')}
          />
        </View>

        {/* Version */}

        <Text style={styles.version}>Version 1.0.0</Text>

        {isGuest ? (
          <TouchableOpacity style={styles.signInFullButton} onPress={goToLogin} activeOpacity={0.8}>
            <Text style={styles.signInFullText}>Sign In to Sync & Personalize</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.logoutButton, loggingOut && styles.logoutButtonDisabled]}
            onPress={confirmLogout}
            disabled={loggingOut}
            activeOpacity={0.8}
          >
            {loggingOut ? (
              <ActivityIndicator color={colors.danger} />
            ) : (
              <Text style={styles.logoutText}>Log Out</Text>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </Screen>
  );
}

function AccountInfoRow({ label, value }: { label: string; value: string }) {
  const styles = createStyles(useThemeColors());
  return (
    <View style={styles.accountRow}>
      <Text style={styles.accountLabel}>{label}</Text>
      <Text style={styles.accountValue}>{value}</Text>
    </View>
  );
}

// ======================================================
// SETTING ROW
// ======================================================

function SettingRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const styles = createStyles(useThemeColors());
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconBox}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>

      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{title}</Text>

        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>

      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

// ======================================================
// RELIABILITY ROW
// ======================================================

function ReliabilityRow({
  title,
  subtitle,
  state,
  onFix,
}: {
  title: string;
  subtitle: string;
  state: 'granted' | 'denied' | 'unknown' | undefined;
  onFix: () => void;
}) {
  const styles = createStyles(useThemeColors());
  const label = state === 'granted' ? 'ON' : state === 'denied' ? 'FIX' : 'CHECK';
  // CHECK rows (e.g. full-screen overlay, whose OS state can't be read from
  // JS) are actionable too — only a confirmed ON row is inert.
  const actionable = state !== 'granted';
  return (
    <View style={styles.row}>
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{title}</Text>

        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.stateBadge,
          state === 'granted' && styles.stateBadgeOk,
          state === 'denied' && styles.stateBadgeFix,
        ]}
        onPress={actionable ? onFix : undefined}
        disabled={!actionable}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.stateBadgeText,
            state === 'granted' && styles.stateBadgeTextOk,
            state === 'denied' && styles.stateBadgeTextFix,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ======================================================
// TOGGLE ROW
// ======================================================

function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
}: {
  icon: string;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  return (
    <View style={styles.row}>
      <View style={styles.iconBox}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>

      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{title}</Text>

        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: colors.softBorder,
          true: colors.accentSoft,
        }}
        thumbColor={value ? colors.accent : colors.surface}
      />
    </View>
  );
}

// ======================================================
// THEME ROW
// ======================================================

function ThemeRow({
  title,
  subtitle,
  selected,
  onPress,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}) {
  const styles = createStyles(useThemeColors());
  return (
    <TouchableOpacity
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{title}</Text>

        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>

      <View style={[styles.themeRadio, selected && styles.themeRadioSelected]}>
        {selected ? <Text style={styles.themeCheck}>✓</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

// ======================================================
// STYLES
// ======================================================

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    content: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 32,
    },

    // Header

    header: {
      marginBottom: 20,
    },

    headerSmall: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1.5,
      color: colors.muted,
    },

    headerTitle: {
      marginTop: 3,
      fontSize: 30,
      fontWeight: '700',
      color: colors.text,
    },

    // Profile

    profileCard: {
      minHeight: 76,
      padding: 13,
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.softBorder,
      flexDirection: 'row',
      alignItems: 'center',
    },

    profileAvatar: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },

    profileAvatarText: {
      fontSize: 19,
      fontWeight: '700',
      color: colors.onAccent,
    },

    profileContent: {
      flex: 1,
      marginLeft: 12,
    },

    profileName: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },

    profileSubtitle: {
      marginTop: 3,
      fontSize: 12,
      color: colors.muted,
    },

    accountRow: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },

    accountLabel: {
      fontSize: 12,
      color: colors.muted,
    },

    accountValue: {
      flexShrink: 1,
      textAlign: 'right',
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },

    arrow: {
      fontSize: 23,
      color: colors.muted,
    },

    // Sections

    sectionTitle: {
      marginTop: 25,
      marginBottom: 9,
      fontSize: FONT.body,
      fontWeight: '800',
      letterSpacing: 1.4,
      color: colors.muted,
    },

    card: {
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.divider,
      paddingHorizontal: 13,
    },

    // Rows

    row: {
      minHeight: 68,
      flexDirection: 'row',
      alignItems: 'center',
    },

    iconBox: {
      width: 38,
      height: 38,
      borderRadius: 11,
      backgroundColor: colors.iconBg,
      alignItems: 'center',
      justifyContent: 'center',
    },

    iconText: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.accent,
    },

    rowContent: {
      flex: 1,
      marginLeft: 11,
      marginRight: 8,
    },

    rowTitle: {
      fontSize: FONT.body,
      fontWeight: '700',
      color: colors.text,
    },

    rowSubtitle: {
      marginTop: 3,
      fontSize: 12,
      lineHeight: 14,
      color: colors.muted,
    },

    divider: {
      height: 1,
      backgroundColor: colors.divider,
    },

    version: {
      marginTop: 25,
      textAlign: 'center',
      fontSize: 12,
      color: colors.muted,
    },

    logoutButton: {
      minHeight: 48,
      marginTop: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.danger,
      backgroundColor: colors.dangerSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },

    logoutButtonDisabled: {
      opacity: 0.6,
    },

    logoutText: {
      color: colors.danger,
      fontSize: 14,
      fontWeight: '700',
    },

    guestActions: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      gap: 12,
    },

    signInButton: {
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.accent,
    },

    signInText: {
      color: colors.onAccent,
      fontSize: 12,
      fontWeight: '700',
    },

    signUpText: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: '700',
    },

    signInFullButton: {
      minHeight: 48,
      marginTop: 16,
      borderRadius: 12,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },

    signInFullText: {
      color: colors.onAccent,
      fontSize: 14,
      fontWeight: '700',
    },

    stateBadge: {
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.divider,
    },

    stateBadgeOk: {
      backgroundColor: colors.success,
    },

    stateBadgeFix: {
      backgroundColor: colors.accent,
    },

    stateBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.muted,
    },

    stateBadgeTextOk: {
      color: colors.onDark,
    },

    stateBadgeTextFix: {
      color: colors.onAccent,
    },

    themeRadio: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 2,
      borderColor: colors.softBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },

    themeRadioSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accent,
    },

    themeCheck: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.onAccent,
    },

    bottomSpace: {
      height: 20,
    },
  });

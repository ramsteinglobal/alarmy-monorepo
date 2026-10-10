import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CommonActions, useFocusEffect, useNavigation, type NavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { doc, getDoc, getFirestore } from '@react-native-firebase/firestore';

import Screen from '../../components/Screen';
import { COLORS } from '../../theme';
import { firebaseAuth, getAuthErrorMessage, logOut } from '../../config/firebaseSetup';
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
  const [notifications, setNotifications] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [gradualVolume, setGradualVolume] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

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
              provider: savedProfile.provider === 'google'
                ? 'Google'
                : savedProfile.provider === 'password'
                  ? 'Email and password'
                  : savedProfile.provider ?? (providerId === 'google.com' ? 'Google' : 'Email and password'),
            });
          }
        } catch {
          if (active) {
            setProfile({
              fullName: user.displayName ?? 'Alarm User',
              email: user.email ?? '',
              provider: user.providerData[0]?.providerId === 'google.com' ? 'Google' : 'Email and password',
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

  const confirmLogout = () => {
    Alert.alert('Log out?', 'You will need to sign in again to use your account.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logOut();
            rootNavigation.dispatch(
              CommonActions.reset({index: 0, routes: [{name: 'Login'}]}),
            );
          } catch (error) {
            Alert.alert('Log out failed', getAuthErrorMessage(error));
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  const showComingSoon = (title: string) => {
    Alert.alert(
      title,
      `${title} settings will be available soon.`,
    );
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}

        <View style={styles.header}>
          <Text style={styles.headerSmall}>
            APP PREFERENCES
          </Text>

          <Text style={styles.headerTitle}>
            Settings
          </Text>
        </View>

        {/* Profile */}

        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {(profile?.fullName?.trim().charAt(0) || profile?.email?.charAt(0) || 'A').toUpperCase()}
            </Text>
          </View>

          <View style={styles.profileContent}>
            <Text style={styles.profileName}>
              {profileLoading ? 'Loading profile…' : profile?.fullName ?? 'Alarm User'}
            </Text>

            <Text style={styles.profileSubtitle}>
              {profile?.email || 'Account details unavailable'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.card}>
          <AccountInfoRow label="Sign-in method" value={profile?.provider ?? '—'} />
          <View style={styles.divider} />
          <AccountInfoRow
            label="Sleep persona"
            value={profile?.sleepPersona ? personaLabels[profile.sleepPersona] ?? profile.sleepPersona : 'Not set'}
          />
        </View>

        {/* Alarm Settings */}

        <Text style={styles.sectionTitle}>
          ALARM SETTINGS
        </Text>

        <View style={styles.card}>
          <SettingRow
            icon="♪"
            title="Default Sound"
            subtitle="Choose your default alarm sound"
            onPress={() =>
              showComingSoon('Default Sound')
            }
          />

          <View style={styles.divider} />

          <SettingRow
            icon="✓"
            title="Missions"
            subtitle="Manage wake-up missions"
            onPress={() =>
              showComingSoon('Missions')
            }
          />

          <View style={styles.divider} />

          <SettingRow
            icon="◷"
            title="Alarm Behavior"
            subtitle="Configure alarm behavior"
            onPress={() =>
              showComingSoon('Alarm Behavior')
            }
          />
        </View>

        {/* Notifications */}

        <Text style={styles.sectionTitle}>
          NOTIFICATIONS
        </Text>

        <View style={styles.card}>
          <ToggleRow
            icon="●"
            title="Notifications"
            subtitle="Receive alarm reminders"
            value={notifications}
            onValueChange={setNotifications}
          />

          <View style={styles.divider} />

          <ToggleRow
            icon="◉"
            title="Vibration"
            subtitle="Vibrate when the alarm rings"
            value={vibration}
            onValueChange={setVibration}
          />

          <View style={styles.divider} />

          <ToggleRow
            icon="↗"
            title="Gradual Volume"
            subtitle="Slowly increase alarm volume"
            value={gradualVolume}
            onValueChange={setGradualVolume}
          />
        </View>

        {/* Sleep Preferences */}

        <Text style={styles.sectionTitle}>
          SLEEP PREFERENCES
        </Text>

        <View style={styles.card}>
          <SettingRow
            icon="☾"
            title="Sleep Goal"
            subtitle="Set your target sleep duration"
            onPress={() =>
              showComingSoon('Sleep Goal')
            }
          />

          <View style={styles.divider} />

          <SettingRow
            icon="☀"
            title="Morning Routine"
            subtitle="Customize your morning routine"
            onPress={() =>
              showComingSoon('Morning Routine')
            }
          />
        </View>

        {/* Support */}

        <Text style={styles.sectionTitle}>
          SUPPORT
        </Text>

        <View style={styles.card}>
          <SettingRow
            icon="?"
            title="Help & Support"
            subtitle="Get help with the app"
            onPress={() =>
              showComingSoon('Help & Support')
            }
          />

          <View style={styles.divider} />

          <SettingRow
            icon="i"
            title="About"
            subtitle="Alarmy Clone App"
            onPress={() =>
              Alert.alert(
                'About',
                'Alarmy Clone App\nVersion 1.0.0',
              )
            }
          />
        </View>

        {/* Version */}

        <Text style={styles.version}>
          Version 1.0.0
        </Text>

        <TouchableOpacity
          style={[styles.logoutButton, loggingOut && styles.logoutButtonDisabled]}
          onPress={confirmLogout}
          disabled={loggingOut}
          activeOpacity={0.8}
        >
          {loggingOut ? (
            <ActivityIndicator color={COLORS.danger} />
          ) : (
            <Text style={styles.logoutText}>Log Out</Text>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </Screen>
  );
}

function AccountInfoRow({label, value}: {label: string; value: string}) {
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
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconBox}>
        <Text style={styles.iconText}>
          {icon}
        </Text>
      </View>

      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>
          {title}
        </Text>

        <Text style={styles.rowSubtitle}>
          {subtitle}
        </Text>
      </View>

      <Text style={styles.arrow}>
        ›
      </Text>
    </TouchableOpacity>
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
  return (
    <View style={styles.row}>
      <View style={styles.iconBox}>
        <Text style={styles.iconText}>
          {icon}
        </Text>
      </View>

      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>
          {title}
        </Text>

        <Text style={styles.rowSubtitle}>
          {subtitle}
        </Text>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: '#D8D8D8',
          true: COLORS.accentSoft,
        }}
        thumbColor={
          value
            ? COLORS.accent
            : COLORS.surface
        }
      />
    </View>
  );
}


// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 100,
  },

  // Header

  header: {
    marginBottom: 20,
  },

  headerSmall: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: COLORS.muted,
  },

  headerTitle: {
    marginTop: 3,
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Profile

  profileCard: {
    minHeight: 76,
    padding: 13,
    borderRadius: 16,
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: '#E6D7B5',
    flexDirection: 'row',
    alignItems: 'center',
  },

  profileAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileAvatarText: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.surface,
  },

  profileContent: {
    flex: 1,
    marginLeft: 12,
  },

  profileName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },

  profileSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.muted,
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
    color: COLORS.muted,
  },

  accountValue: {
    flexShrink: 1,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },

  arrow: {
    fontSize: 23,
    color: COLORS.muted,
  },

  // Sections

  sectionTitle: {
    marginTop: 25,
    marginBottom: 9,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: COLORS.muted,
  },

  card: {
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.divider,
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
    backgroundColor: COLORS.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.accent,
  },

  rowContent: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },

  rowTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },

  rowSubtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 14,
    color: COLORS.muted,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
  },

  version: {
    marginTop: 25,
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.muted,
  },

  logoutButton: {
    minHeight: 48,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8C7C7',
    backgroundColor: '#FFF8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutButtonDisabled: {
    opacity: 0.6,
  },

  logoutText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '700',
  },

  bottomSpace: {
    height: 20,
  },
});

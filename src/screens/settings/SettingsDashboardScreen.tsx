import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Screen from '../../components/Screen';
import { COLORS } from '../../theme';

export default function SettingsDashboardScreen() {
  const [notifications, setNotifications] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [gradualVolume, setGradualVolume] = useState(true);

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
              I
            </Text>
          </View>

          <View style={styles.profileContent}>
            <Text style={styles.profileName}>
              Alarm User
            </Text>

            <Text style={styles.profileSubtitle}>
              Manage your wake-up experience
            </Text>
          </View>

          <Text style={styles.arrow}>
            ›
          </Text>
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

        <View style={styles.bottomSpace} />
      </ScrollView>
    </Screen>
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

  bottomSpace: {
    height: 20,
  },
});
import React from 'react';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useThemeColors } from '../store/ThemeContext';
import { FONT } from '../theme';
import type {
  AlarmStackParamList,
  MainTabParamList,
  RootStackParamList,
} from '../types/navigation';

// Auth
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';

// Alarm creation flow (inside tabs)
import AlarmDashboard from '../screens/alarm/AlarmDashboard';
import CreateAlarmScreen from '../screens/alarm/CreateAlarmScreen';
import SelectSoundScreen from '../screens/alarm/SelectSoundScreen';
import SelectMissionScreen from '../screens/alarm/SelectMissionScreen';
import AlarmSummaryScreen from '../screens/alarm/AlarmSummaryScreen';

// Alarm execution screens (full-screen, outside tabs — no tab bar escape)
import AlarmRingingScreen from '../screens/alarm/AlarmRingingScreen';
import MissionExecutionScreen from '../screens/alarm/MissionExecutionScreen';
import AlarmSuccessScreen from '../screens/alarm/AlarmSuccessScreen';
import WakeCheckScreen from '../screens/alarm/WakeCheckScreen';

// Other modules
import SleepDashboardScreen from '../screens/sleep/SleepDashboardScreen';
import MorningDashboardScreen from '../screens/morning/MorningDashboardScreen';
import ReportDashboardScreen from '../screens/report/ReportDashboardScreen';
import SettingsDashboardScreen from '../screens/settings/SettingsDashboardScreen';
import SplashScreen from '../screens/SplashScreen';
import { useAuth } from '../store/AuthContext';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AlarmStack = createNativeStackNavigator<AlarmStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// ── ALARM CREATION NAVIGATOR (inside tabs) ──────────────────────────────────
// Only contains the alarm setup flow. Execution screens live on the root stack.
function AlarmNavigator() {
  return (
    <AlarmStack.Navigator
      initialRouteName="AlarmDashboard"
      screenOptions={{
        headerShown: false,
      }}
    >
      <AlarmStack.Screen name="AlarmDashboard" component={AlarmDashboard} />
      <AlarmStack.Screen name="CreateAlarm" component={CreateAlarmScreen} />
      <AlarmStack.Screen name="SelectSound" component={SelectSoundScreen} />
      <AlarmStack.Screen name="SelectMission" component={SelectMissionScreen} />
      <AlarmStack.Screen name="AlarmSummary" component={AlarmSummaryScreen} />
    </AlarmStack.Navigator>
  );
}

// TAB ICON
function TabIcon({ text, color }: { text: string; color: string }) {
  return (
    <Text
      style={{
        fontSize: 18,
        color,
      }}
    >
      {text}
    </Text>
  );
}

// MAIN TABS
function MainTabs() {
  // Edge-to-edge: lift the tab bar above the system navigation bar (3-button or gesture).
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  return (
    <Tab.Navigator
      initialRouteName="Alarm"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingTop: 6,
          paddingBottom: 8 + insets.bottom,
          backgroundColor: colors.surface,
          borderTopColor: colors.divider,
        },
        tabBarLabelStyle: {
          fontSize: FONT.caption,
        },
      }}
    >
      <Tab.Screen
        name="Alarm"
        component={AlarmNavigator}
        options={{
          tabBarLabel: 'Alarm',
          tabBarIcon: ({ color }) => <TabIcon text="◷" color={color} />,
        }}
      />

      <Tab.Screen
        name="Sleep"
        component={SleepDashboardScreen}
        options={{
          tabBarLabel: 'Sleep',
          tabBarIcon: ({ color }) => <TabIcon text="☾" color={color} />,
        }}
      />

      <Tab.Screen
        name="Morning"
        component={MorningDashboardScreen}
        options={{
          tabBarLabel: 'Morning',
          tabBarIcon: ({ color }) => <TabIcon text="☀" color={color} />,
        }}
      />

      <Tab.Screen
        name="Report"
        component={ReportDashboardScreen}
        options={{
          tabBarLabel: 'Report',
          tabBarIcon: ({ color }) => <TabIcon text="▥" color={color} />,
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsDashboardScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => <TabIcon text="⚙" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ── ROOT NAVIGATOR ───────────────────────────────────────────────────────────
// Guest-first: Main (alarms) is always open. Login/Signup are pushed on top
// when a locked tab or Settings asks for an account.
//
// AlarmRinging, MissionExecution, AlarmSuccess, and WakeCheck are at the ROOT
// level as fullScreenModal so they:
//   1. Cover the entire screen (no bottom tab bar visible)
//   2. Cannot be dismissed by tab taps or swipe-back gestures
//   3. Appear above any other open screen, including lock screen (via MainActivity flags)
export default function AppNavigator() {
  const { loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <RootStack.Navigator
      initialRouteName="Main"
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* ── Normal app screens ─────────────────────────────────────── */}
      <RootStack.Screen name="Main" component={MainTabs} />
      <RootStack.Screen name="Login" component={LoginScreen} options={{ presentation: 'modal' }} />
      <RootStack.Screen
        name="Signup"
        component={SignupScreen}
        options={{ presentation: 'modal' }}
      />

      {/* ── Alarm execution: full-screen, no tab bar, no back escape ─ */}
      <RootStack.Screen
        name="AlarmRinging"
        component={AlarmRingingScreen}
        options={{
          presentation: 'fullScreenModal',
          gestureEnabled: false,
          animation: 'fade',
        }}
      />
      <RootStack.Screen
        name="MissionExecution"
        component={MissionExecutionScreen}
        options={{
          presentation: 'fullScreenModal',
          gestureEnabled: false,
          animation: 'slide_from_bottom',
        }}
      />
      <RootStack.Screen
        name="AlarmSuccess"
        component={AlarmSuccessScreen}
        options={{
          presentation: 'fullScreenModal',
          gestureEnabled: false,
          animation: 'fade',
        }}
      />
      <RootStack.Screen
        name="WakeCheck"
        component={WakeCheckScreen}
        options={{
          presentation: 'fullScreenModal',
          gestureEnabled: false,
          animation: 'slide_from_bottom',
        }}
      />
    </RootStack.Navigator>
  );
}

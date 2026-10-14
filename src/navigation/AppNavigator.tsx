import React from 'react';
import { Text, View, Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

// TAB ICON — soft rounded background when active
function TabIcon({ text, color, focused }: { text: string; color: string; focused: boolean }) {
  const colors = useThemeColors();
  return (
    <View
      style={[
        {
          width: 44,
          height: 28,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
        },
        focused && { backgroundColor: colors.accentSoft },
      ]}
    >
      <Text
        style={{
          fontSize: 18,
          color,
          lineHeight: 22,
        }}
      >
        {text}
      </Text>
    </View>
  );
}

// MAIN TABS
function MainTabs() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      initialRouteName="Alarm"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          height: 72 + insets.bottom,
          paddingTop: 8,
          paddingBottom: 10 + insets.bottom,
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: Platform.OS === 'ios' ? 0.08 : 0.12,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Alarm"
        component={AlarmNavigator}
        options={{
          tabBarLabel: 'Alarm',
          tabBarIcon: ({ color, focused }) => <TabIcon text="◷" color={color} focused={focused} />,
        }}
      />

      <Tab.Screen
        name="Sleep"
        component={SleepDashboardScreen}
        options={{
          tabBarLabel: 'Sleep',
          tabBarIcon: ({ color, focused }) => <TabIcon text="☾" color={color} focused={focused} />,
        }}
      />

      <Tab.Screen
        name="Morning"
        component={MorningDashboardScreen}
        options={{
          tabBarLabel: 'Morning',
          tabBarIcon: ({ color, focused }) => <TabIcon text="☀" color={color} focused={focused} />,
        }}
      />

      <Tab.Screen
        name="Report"
        component={ReportDashboardScreen}
        options={{
          tabBarLabel: 'Report',
          tabBarIcon: ({ color, focused }) => <TabIcon text="▥" color={color} focused={focused} />,
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsDashboardScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, focused }) => <TabIcon text="⚙" color={color} focused={focused} />,
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

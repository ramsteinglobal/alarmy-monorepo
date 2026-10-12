import React from 'react';
import { Text } from 'react-native';
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

// Alarm
import AlarmDashboard from '../screens/alarm/AlarmDashboard';
import CreateAlarmScreen from '../screens/alarm/CreateAlarmScreen';
import SelectSoundScreen from '../screens/alarm/SelectSoundScreen';
import SelectMissionScreen from '../screens/alarm/SelectMissionScreen';
import AlarmSummaryScreen from '../screens/alarm/AlarmSummaryScreen';
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

// ALARM NAVIGATOR
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

      <AlarmStack.Screen
        name="AlarmRinging"
        component={AlarmRingingScreen}
        options={{ gestureEnabled: false }}
      />

      <AlarmStack.Screen
        name="MissionExecution"
        component={MissionExecutionScreen}
        options={{ gestureEnabled: false }}
      />

      <AlarmStack.Screen name="AlarmSuccess" component={AlarmSuccessScreen} />

      <AlarmStack.Screen name="WakeCheck" component={WakeCheckScreen} />
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
  const colors = useThemeColors();
  return (
    <Tab.Navigator
      initialRouteName="Alarm"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          height: 68,
          paddingTop: 6,
          paddingBottom: 8,
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

// ROOT NAVIGATOR
// Guest-first: Main (alarms) is always open. Login/Signup are pushed on top
// when a locked tab or Settings asks for an account. logged-in users still
// land straight on the Alarm Dashboard after the Splash.
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
      <RootStack.Screen name="Main" component={MainTabs} />
      <RootStack.Screen name="Login" component={LoginScreen} options={{ presentation: 'modal' }} />
      <RootStack.Screen
        name="Signup"
        component={SignupScreen}
        options={{ presentation: 'modal' }}
      />
    </RootStack.Navigator>
  );
}

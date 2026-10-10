
import React from 'react';
import { Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { COLORS } from '../theme';
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

// Other modules
import SleepDashboardScreen from '../screens/sleep/SleepDashboardScreen';
import MorningDashboardScreen from '../screens/morning/MorningDashboardScreen';
import ReportDashboardScreen from '../screens/report/ReportDashboardScreen';
import SettingsDashboardScreen from '../screens/settings/SettingsDashboardScreen';

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
      <AlarmStack.Screen
        name="AlarmDashboard"
        component={AlarmDashboard}
      />

      <AlarmStack.Screen
        name="CreateAlarm"
        component={CreateAlarmScreen}
      />

      <AlarmStack.Screen
        name="SelectSound"
        component={SelectSoundScreen}
      />

      <AlarmStack.Screen
        name="SelectMission"
        component={SelectMissionScreen}
      />

      <AlarmStack.Screen
        name="AlarmSummary"
        component={AlarmSummaryScreen}
      />

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

      <AlarmStack.Screen
        name="AlarmSuccess"
        component={AlarmSuccessScreen}
      />
    </AlarmStack.Navigator>
  );
}

// TAB ICON
function TabIcon({ text }: { text: string }) {
  return (
    <Text
      style={{
        fontSize: 18,
      }}
    >
      {text}
    </Text>
  );
}

// MAIN TABS
function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Alarm"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.tabInactive,
        tabBarStyle: {
          height: 68,
          paddingTop: 6,
          paddingBottom: 8,
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.divider,
        },
        tabBarLabelStyle: {
          fontSize: 9,
        },
      }}
    >
      <Tab.Screen
        name="Alarm"
        component={AlarmNavigator}
        options={{
          tabBarLabel: 'Alarm',
          tabBarIcon: () => <TabIcon text="◷" />,
        }}
      />

      <Tab.Screen
        name="Sleep"
        component={SleepDashboardScreen}
        options={{
          tabBarLabel: 'Sleep',
          tabBarIcon: () => <TabIcon text="☾" />,
        }}
      />

      <Tab.Screen
        name="Morning"
        component={MorningDashboardScreen}
        options={{
          tabBarLabel: 'Morning',
          tabBarIcon: () => <TabIcon text="☀" />,
        }}
      />

      <Tab.Screen
        name="Report"
        component={ReportDashboardScreen}
        options={{
          tabBarLabel: 'Report',
          tabBarIcon: () => <TabIcon text="▥" />,
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsDashboardScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: () => <TabIcon text="⚙" />,
        }}
      />
    </Tab.Navigator>
  );
}

// ROOT NAVIGATOR
export default function AppNavigator() {
  return (
    <RootStack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}
    >
      <RootStack.Screen name="Login" component={LoginScreen} />
      <RootStack.Screen name="Signup" component={SignupScreen} />
      <RootStack.Screen name="Main" component={MainTabs} />
    </RootStack.Navigator>
  );
}

import React, { useEffect } from 'react';
import { NavigationContainer, type LinkingOptions } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import { flushPendingAlarm, startAlarmEvents } from './src/services/alarmEvents';
import { rescheduleAll } from './src/services/alarmScheduler';
import { getAlarms } from './src/storage/alarmStorage';
import { getVibrationEnabled } from './src/storage/prefs';
import { AuthProvider } from './src/store/AuthContext';
import { ThemeProvider } from './src/store/ThemeContext';
import type { RootStackParamList } from './src/types/navigation';

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['wakely://'],
  config: {
    screens: {
      AlarmRinging: 'alarm',
      Login: 'login',
      Signup: 'signup',
    },
  },
};

export default function App() {
  useEffect(() => {
    const unsubscribe = startAlarmEvents();
    // Rebuild OS schedules on every cold start (covers reboot / update).
    Promise.all([getAlarms(), getVibrationEnabled()])
      .then(([alarms, vibration]) => rescheduleAll(alarms, { vibration }))
      .catch(error => console.error('Failed to reschedule alarms on start:', error));
    return unsubscribe;
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <NavigationContainer ref={navigationRef} linking={linking} onReady={flushPendingAlarm}>
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

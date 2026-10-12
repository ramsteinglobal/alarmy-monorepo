/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('../src/config/firebaseSetup', () => ({
  getAuthErrorMessage: jest.fn(),
  signIn: jest.fn(),
  signInWithGoogle: jest.fn(),
}));

jest.mock('../src/navigation/AppNavigator', () => () => null);

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  createNavigationContainerRef: () => ({
    isReady: jest.fn(() => false),
    getCurrentRoute: jest.fn(() => undefined),
    navigate: jest.fn(),
  }),
}));

jest.mock('../src/store/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: jest.fn(() => ({ user: null, loading: false })),
}));

jest.mock('../src/store/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTheme: jest.fn(() => ({
    mode: 'light',
    setMode: jest.fn(),
    colors: {
      background: '#fff',
      surface: '#fff',
      text: '#000',
      muted: '#888',
      accent: '#D7A62A',
    },
    isDark: false,
  })),
  useThemeColors: jest.fn(() => ({
    background: '#fff',
    surface: '#fff',
    text: '#000',
    muted: '#888',
    accent: '#D7A62A',
  })),
}));

jest.mock('../src/services/alarmEvents', () => ({
  flushPendingAlarm: jest.fn(),
  startAlarmEvents: jest.fn(() => jest.fn()),
}));

jest.mock('../src/services/alarmScheduler', () => ({
  rescheduleAll: jest.fn(() => Promise.resolve()),
}));

jest.mock('../src/storage/alarmStorage', () => ({
  getAlarms: jest.fn(() => Promise.resolve([])),
}));

jest.mock('../src/storage/prefs', () => ({
  getVibrationEnabled: jest.fn(() => Promise.resolve(true)),
}));

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});

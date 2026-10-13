/**
 * @format
 */

import { Linking, Platform } from 'react-native';

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    getNotificationSettings: jest.fn(() =>
      Promise.resolve({ authorizationStatus: 1, android: { alarm: 1 } }),
    ),
    isBatteryOptimizationEnabled: jest.fn(() => Promise.resolve(false)),
    getPowerManagerInfo: jest.fn(() => Promise.resolve({ activity: null })),
    openNotificationSettings: jest.fn(() => Promise.resolve()),
    openAlarmPermissionSettings: jest.fn(() => Promise.resolve()),
    openBatteryOptimizationSettings: jest.fn(() => Promise.resolve()),
    openPowerManagerSettings: jest.fn(() => Promise.resolve()),
  },
  AndroidNotificationSetting: { DISABLED: 0, ENABLED: 1 },
  AuthorizationStatus: { AUTHORIZED: 1 },
}));

import notifee from '@notifee/react-native';
import {
  getAlarmReliabilityStatus,
  needsFullScreenIntentRow,
  openFullScreenIntentSettings,
} from '../src/services/permissionsService';

const mockNotifee = notifee as unknown as {
  getNotificationSettings: jest.Mock;
  isBatteryOptimizationEnabled: jest.Mock;
  getPowerManagerInfo: jest.Mock;
  openNotificationSettings: jest.Mock;
  openPowerManagerSettings: jest.Mock;
};

const linking = Linking as unknown as { sendIntent?: jest.Mock };

const realOS = Platform.OS;
const realVersionDescriptor = Object.getOwnPropertyDescriptor(Platform, 'Version');

const setAndroid = (apiLevel: number) => {
  Platform.OS = 'android';
  // NB: under jest, Platform resolves to the iOS implementation where
  // Version is a getter-only property — plain assignment silently fails,
  // so redefine it (literals create configurable properties).
  Object.defineProperty(Platform, 'Version', {
    value: apiLevel,
    writable: true,
    configurable: true,
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockNotifee.getNotificationSettings.mockResolvedValue({
    authorizationStatus: 1,
    android: { alarm: 1 },
  });
  mockNotifee.isBatteryOptimizationEnabled.mockResolvedValue(false);
  mockNotifee.getPowerManagerInfo.mockResolvedValue({ activity: null });
  linking.sendIntent = jest.fn(() => Promise.resolve());
});

afterAll(() => {
  Platform.OS = realOS;
  if (realVersionDescriptor) Object.defineProperty(Platform, 'Version', realVersionDescriptor);
});

describe('needsFullScreenIntentRow', () => {
  test('shown on Android 14+ (API 34)', () => {
    setAndroid(34);
    expect(needsFullScreenIntentRow()).toBe(true);
    setAndroid(35);
    expect(needsFullScreenIntentRow()).toBe(true);
  });

  test('hidden below Android 14', () => {
    setAndroid(33);
    expect(needsFullScreenIntentRow()).toBe(false);
  });

  test('hidden on iOS', () => {
    Platform.OS = 'ios';
    expect(needsFullScreenIntentRow()).toBe(false);
  });
});

describe('getAlarmReliabilityStatus overlay fields', () => {
  test('autostart needed when the OEM exposes a power-manager screen', async () => {
    setAndroid(34);
    mockNotifee.getPowerManagerInfo.mockResolvedValue({
      activity: 'com.miui.securitycenter.AutoStartManagementActivity',
    });

    const status = await getAlarmReliabilityStatus();

    expect(status.autostartNeeded).toBe(true);
    expect(status.fullScreenOverlay).toBe('unknown');
  });

  test('no autostart row when the device has no such screen', async () => {
    setAndroid(34);
    mockNotifee.getPowerManagerInfo.mockResolvedValue({ activity: null });

    const status = await getAlarmReliabilityStatus();

    expect(status.autostartNeeded).toBe(false);
  });

  test('iOS reports non-Android fields as not applicable', async () => {
    Platform.OS = 'ios';

    const status = await getAlarmReliabilityStatus();

    expect(status.exactAlarm).toBe('unknown');
    expect(status.batteryUnrestricted).toBeNull();
    expect(status.autostartNeeded).toBe(false);
    expect(status.fullScreenOverlay).toBe('na');
    expect(mockNotifee.getPowerManagerInfo).not.toHaveBeenCalled();
  });

  test('Notifee failure still returns safe defaults', async () => {
    setAndroid(34);
    mockNotifee.getNotificationSettings.mockRejectedValue(new Error('nope'));

    const status = await getAlarmReliabilityStatus();

    expect(status.notifications).toBe('unknown');
    expect(status.autostartNeeded).toBe(false);
    expect(status.fullScreenOverlay).toBe('unknown');
  });
});

describe('openFullScreenIntentSettings', () => {
  test('Android 14+ opens the full-screen-intent screen directly', async () => {
    setAndroid(34);

    await openFullScreenIntentSettings();

    expect(linking.sendIntent).toHaveBeenCalledWith(
      'android.settings.MANAGE_APP_USE_FULL_SCREEN_INTENT',
    );
    expect(mockNotifee.openNotificationSettings).not.toHaveBeenCalled();
  });

  test('falls back to notification settings when the intent fails', async () => {
    setAndroid(34);
    linking.sendIntent = jest.fn(() => Promise.reject(new Error('no activity')));

    await openFullScreenIntentSettings();

    expect(mockNotifee.openNotificationSettings).toHaveBeenCalled();
  });

  test('older Android goes straight to notification settings', async () => {
    setAndroid(33);

    await openFullScreenIntentSettings();

    expect(linking.sendIntent).not.toHaveBeenCalled();
    expect(mockNotifee.openNotificationSettings).toHaveBeenCalled();
  });

  test('no-op on iOS', async () => {
    Platform.OS = 'ios';

    await openFullScreenIntentSettings();

    expect(linking.sendIntent).not.toHaveBeenCalled();
    expect(mockNotifee.openNotificationSettings).not.toHaveBeenCalled();
  });
});

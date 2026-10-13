/**
 * @format
 */

import { Platform } from 'react-native';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Full mock: alarmScheduler imports many named Notifee enums at module load.
jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn(() => Promise.resolve('mock-channel-id')),
    getChannel: jest.fn(() => Promise.resolve(null)),
    deleteChannel: jest.fn(() => Promise.resolve()),
    displayNotification: jest.fn(() => Promise.resolve()),
    requestPermission: jest.fn(() =>
      Promise.resolve({ authorizationStatus: 1, android: { alarm: 1 } }),
    ),
    getNotificationSettings: jest.fn(() =>
      Promise.resolve({ authorizationStatus: 1, android: { alarm: 1 } }),
    ),
    openAlarmPermissionSettings: jest.fn(() => Promise.resolve()),
    openNotificationSettings: jest.fn(() => Promise.resolve()),
  },
  AndroidCategory: { ALARM: 'alarm' },
  AndroidImportance: { HIGH: 4, DEFAULT: 3 },
  AndroidNotificationSetting: { DISABLED: 0, ENABLED: 1 },
  AndroidVisibility: { PUBLIC: 1 },
  AuthorizationStatus: { AUTHORIZED: 1 },
  RepeatFrequency: { WEEKLY: 1 },
  TriggerType: { TIMESTAMP: 0 },
}));

import notifee, { AndroidImportance } from '@notifee/react-native';
import {
  channelIdForSound,
  channelMatchesSpec,
  previewSound,
} from '../src/services/alarmScheduler';

const mockNotifee = notifee as unknown as {
  createChannel: jest.Mock;
  getChannel: jest.Mock;
  deleteChannel: jest.Mock;
  displayNotification: jest.Mock;
};

const realOS = Platform.OS;

beforeEach(() => {
  jest.clearAllMocks();
  // Channel sync only runs on Android; the RN preset defaults to ios.
  Platform.OS = 'android';
  mockNotifee.getChannel.mockResolvedValue(null);
});

afterAll(() => {
  Platform.OS = realOS;
});

describe('channelIdForSound', () => {
  test('is stable per tone', () => {
    expect(channelIdForSound('classic')).toBe('wakely_classic');
    expect(channelIdForSound('backup')).toBe('wakely_backup');
  });
});

describe('channelMatchesSpec', () => {
  const matching = {
    id: 'wakely_classic',
    name: 'Wakely Classic Alarm',
    importance: AndroidImportance.HIGH,
    vibration: true,
    bypassDnd: true,
    soundURI: 'android.resource://com.alarmyapp/raw/classic_alarm',
    blocked: false,
  };

  test('matching channel (tone + vibration + importance + dnd) is kept', () => {
    expect(channelMatchesSpec(matching, 'classic_alarm', true)).toBe(true);
  });

  test('different tone file forces recreate', () => {
    expect(channelMatchesSpec(matching, 'morning_rise', true)).toBe(false);
  });

  test('missing sound forces recreate', () => {
    expect(channelMatchesSpec({ ...matching, soundURI: '' }, 'classic_alarm', true)).toBe(
      false,
    );
  });

  test('vibration flip forces recreate', () => {
    expect(channelMatchesSpec(matching, 'classic_alarm', false)).toBe(false);
  });

  test('lowered importance forces recreate', () => {
    expect(
      channelMatchesSpec({ ...matching, importance: AndroidImportance.DEFAULT }, 'classic_alarm', true),
    ).toBe(false);
  });

  test('revoked DND bypass forces recreate', () => {
    expect(channelMatchesSpec({ ...matching, bypassDnd: false }, 'classic_alarm', true)).toBe(
      false,
    );
  });
});

describe('previewSound channel sync (test-ring path)', () => {
  test('fresh channel is created once with the bundled tone', async () => {
    await previewSound('classic', 'Classic Alarm', 'classic_alarm');

    expect(mockNotifee.getChannel).toHaveBeenCalledWith('wakely_classic');
    expect(mockNotifee.deleteChannel).not.toHaveBeenCalled();
    expect(mockNotifee.createChannel).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'wakely_classic', sound: 'classic_alarm' }),
    );
    expect(mockNotifee.displayNotification).toHaveBeenCalledWith(
      expect.objectContaining({ android: expect.objectContaining({ channelId: 'wakely_classic' }) }),
    );
  });

  test('stale channel (old tone) is deleted and recreated so it can ring', async () => {
    mockNotifee.getChannel.mockResolvedValue({
      id: 'wakely_classic',
      name: 'Wakely Classic Alarm',
      importance: AndroidImportance.HIGH,
      vibration: false,
      bypassDnd: true,
      // Channel was created long ago without the tone — Android froze it.
      soundURI: '',
      blocked: false,
    });

    await previewSound('classic', 'Classic Alarm', 'classic_alarm');

    expect(mockNotifee.deleteChannel).toHaveBeenCalledWith('wakely_classic');
    expect(mockNotifee.createChannel).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'wakely_classic', sound: 'classic_alarm' }),
    );
    expect(mockNotifee.displayNotification).toHaveBeenCalled();
  });

  test('matching channel is reused without recreate', async () => {
    mockNotifee.getChannel.mockResolvedValue({
      id: 'wakely_classic',
      name: 'Wakely Classic Alarm',
      importance: AndroidImportance.HIGH,
      vibration: false,
      bypassDnd: true,
      soundURI: 'android.resource://com.alarmyapp/raw/classic_alarm',
      blocked: false,
    });

    await previewSound('classic', 'Classic Alarm', 'classic_alarm');

    expect(mockNotifee.deleteChannel).not.toHaveBeenCalled();
    expect(mockNotifee.createChannel).not.toHaveBeenCalled();
    expect(mockNotifee.displayNotification).toHaveBeenCalled();
  });
});

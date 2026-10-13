import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { StoredAlarm } from '../storage/alarmStorage';

/** The alarm being built while the user moves through the create flow. */
export type AlarmDraft = {
  id?: string;
  hour: number;
  minute: number;
  period: 'AM' | 'PM';
  selectedDays: string[];
  selectedDayNames: string[];
  label?: string;
  sound?: StoredAlarm['sound'];
  mission?: StoredAlarm['mission'];
  missions?: StoredAlarm['mission'][];
  missionConfig?: StoredAlarm['missionConfig'];
  snoozeMinutes?: number;
  maxSnoozes?: number;
  autoDismissMinutes?: number;
  wakeCheckMinutes?: number;
  enabled?: boolean;
  isEditing: boolean;
};

/** Screens inside the Alarm tab (all pre-alarm creation flow). */
export type AlarmStackParamList = {
  AlarmDashboard: undefined;
  CreateAlarm: { editAlarm?: StoredAlarm } | undefined;
  SelectSound: { alarm: AlarmDraft };
  SelectMission: { alarm: AlarmDraft };
  AlarmSummary: { alarm: AlarmDraft; mission?: StoredAlarm['mission'] };
};

/**
 * Root-level screens that render over the tab bar (no escape via tabs).
 * AlarmRinging, MissionExecution, AlarmSuccess, and WakeCheck live here
 * so the bottom tabs are completely hidden during alarm execution.
 */
export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  // ── Alarm execution screens (full-screen, no tab bar) ──────────────────
  AlarmRinging: { alarm?: StoredAlarm; startedAt?: number; snoozeCount?: number } | undefined;
  MissionExecution: {
    alarm?: StoredAlarm;
    startedAt?: number;
    snoozeCount?: number;
    preview?: boolean;
  };
  AlarmSuccess: { alarm?: StoredAlarm; startedAt?: number; snoozeCount?: number };
  WakeCheck: { alarm?: StoredAlarm };
};

export type MainTabParamList = {
  Alarm: NavigatorScreenParams<AlarmStackParamList>;
  Sleep: undefined;
  Morning: undefined;
  Report: undefined;
  Settings: undefined;
};

export type AlarmScreenProps<T extends keyof AlarmStackParamList> = NativeStackScreenProps<
  AlarmStackParamList,
  T
>;

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

// React Navigation requires this global namespace augmentation.
declare global {
  /* eslint-disable @typescript-eslint/no-namespace */
  namespace ReactNavigation {
    /* eslint-disable @typescript-eslint/no-empty-object-type */
    interface RootParamList extends RootStackParamList {}
    /* eslint-enable @typescript-eslint/no-empty-object-type */
  }
  /* eslint-enable @typescript-eslint/no-namespace */
}


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
  sound?: StoredAlarm['sound'];
  mission?: StoredAlarm['mission'];
  enabled?: boolean;
  isEditing: boolean;
};

export type AlarmStackParamList = {
  AlarmDashboard: undefined;
  CreateAlarm: { editAlarm?: StoredAlarm } | undefined;
  SelectSound: { alarm: AlarmDraft };
  SelectMission: { alarm: AlarmDraft };
  AlarmSummary: { alarm: AlarmDraft; mission?: StoredAlarm['mission'] };
  AlarmRinging: { alarm?: StoredAlarm } | undefined;
  MissionExecution: { alarm?: StoredAlarm };
  AlarmSuccess: { alarm?: StoredAlarm };
};

export type MainTabParamList = {
  Alarm: NavigatorScreenParams<AlarmStackParamList>;
  Sleep: undefined;
  Morning: undefined;
  Report: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
};

export type AlarmScreenProps<T extends keyof AlarmStackParamList> =
  NativeStackScreenProps<AlarmStackParamList, T>;

export type RootScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

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

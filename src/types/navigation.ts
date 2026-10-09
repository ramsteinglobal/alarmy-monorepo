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

// Makes useNavigation() know your routes everywhere.
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export type MissionType = 'math' | 'shake' | 'photo' | 'qr' | 'typing' | 'memory';

export type MissionConfig =
  | { type: 'math'; difficulty: 'easy' | 'normal' | 'hard'; problems: number }
  | { type: 'shake'; shakes: number }
  | { type: 'photo'; referencePhotoUrl: string }
  | { type: 'qr'; expectedValue: string }
  | { type: 'typing'; phrase: string }
  | { type: 'memory'; tiles: number };

export type Alarm = {
  id: string;
  userId: string;
  label: string;
  /** HH:mm 24h, e.g. "07:30" */
  time: string;
  /** 0 = Sun … 6 = Sat */
  repeatDays: number[];
  enabled: boolean;
  missions: MissionConfig[];
  soundId?: string;
  createdAt: number;
  updatedAt: number;
};

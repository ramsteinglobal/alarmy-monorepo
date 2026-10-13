// Sounds and missions live in one place so screens only render them.

export type Sound = {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** Bundled tone resource (Android res/raw + iOS bundle). Absent = silent/vibrate. */
  file?: string;
};

export const SOUNDS: Sound[] = [
  {
    id: 'classic',
    name: 'Classic Alarm',
    description: 'A traditional alarm sound',
    icon: '🔔',
    file: 'classic_alarm',
  },
  {
    id: 'morning',
    name: 'Morning Rise',
    description: 'Soft and refreshing',
    icon: '☀️',
    file: 'morning_rise',
  },
  {
    id: 'energy',
    name: 'Energy Boost',
    description: 'Loud and energetic',
    icon: '⚡',
    file: 'energy_boost',
  },
  {
    id: 'nature',
    name: 'Nature',
    description: 'Peaceful natural sounds',
    icon: '🌿',
    file: 'nature',
  },
  {
    id: 'extra_loud',
    name: 'Extra Loud Siren',
    description: 'High-intensity alarm for deep sleepers',
    icon: '🚨',
    file: 'extra_loud',
  },
  { id: 'vibrate', name: 'Vibration Only', description: 'Wake up silently', icon: '📳' },
];

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type Mission = {
  id: string;
  title: string;
  description: string;
  icon: string;
  difficulty: Difficulty;
};

export const MISSIONS: Mission[] = [
  {
    id: 'math',
    title: 'Math Mission',
    description: 'Solve a quick math problem',
    icon: '∑',
    difficulty: 'Medium',
  },
  {
    id: 'photo',
    title: 'Photo Mission',
    description: 'Take a photo of a registered object',
    icon: '▣',
    difficulty: 'Easy',
  },
  {
    id: 'barcode',
    title: 'Barcode Mission',
    description: 'Scan your registered barcode',
    icon: '▥',
    difficulty: 'Medium',
  },
  {
    id: 'memory',
    title: 'Memory Mission',
    description: 'Remember and repeat the sequence',
    icon: '◆',
    difficulty: 'Hard',
  },
  {
    id: 'typing',
    title: 'Typing Mission',
    description: 'Type the displayed sentence',
    icon: '⌨',
    difficulty: 'Medium',
  },
  {
    id: 'shake',
    title: 'Shake Mission',
    description: 'Shake your phone to wake up',
    icon: '↔',
    difficulty: 'Easy',
  },
  {
    id: 'squat',
    title: 'Squat Mission',
    description: 'Complete the required squats',
    icon: '↕',
    difficulty: 'Hard',
  },
  {
    id: 'tap',
    title: 'Tap Challenge',
    description: 'Tap fast to prove you are awake',
    icon: '👆',
    difficulty: 'Easy',
  },
];

export const DEFAULT_SOUND = SOUNDS[0];
export const DEFAULT_MISSION = MISSIONS[0];

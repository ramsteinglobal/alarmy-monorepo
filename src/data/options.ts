// Sounds and missions live in one place so screens only render them.

export type Sound = { id: string; name: string; description: string; icon: string };

export const SOUNDS: Sound[] = [
  { id: 'classic', name: 'Classic Alarm', description: 'A traditional alarm sound', icon: '🔔' },
  { id: 'morning', name: 'Morning Rise', description: 'Soft and refreshing', icon: '☀️' },
  { id: 'energy', name: 'Energy Boost', description: 'Loud and energetic', icon: '⚡' },
  { id: 'nature', name: 'Nature', description: 'Peaceful natural sounds', icon: '🌿' },
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
  { id: 'math', title: 'Math Mission', description: 'Solve a quick math problem', icon: '∑', difficulty: 'Medium' },
  { id: 'photo', title: 'Photo Mission', description: 'Take a photo of a registered object', icon: '▣', difficulty: 'Easy' },
  { id: 'barcode', title: 'Barcode Mission', description: 'Scan your registered barcode', icon: '▥', difficulty: 'Medium' },
  { id: 'memory', title: 'Memory Mission', description: 'Remember and repeat the sequence', icon: '◆', difficulty: 'Hard' },
  { id: 'typing', title: 'Typing Mission', description: 'Type the displayed sentence', icon: '⌨', difficulty: 'Medium' },
  { id: 'shake', title: 'Shake Mission', description: 'Shake your phone to wake up', icon: '↔', difficulty: 'Easy' },
  { id: 'squat', title: 'Squat Mission', description: 'Complete the required squats', icon: '↕', difficulty: 'Hard' },
];

export const DEFAULT_SOUND = SOUNDS[0];
export const DEFAULT_MISSION = MISSIONS[0];

export type MissionProps = {
  /** Call exactly once when the user has finished the mission. */
  onComplete: () => void;
  /** Optional 0..1 progress for the bar on the mission screen. */
  onProgress?: (progress: number) => void;
};

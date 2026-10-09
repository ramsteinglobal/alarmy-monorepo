export type MathChallenge = {
  question: string;
  answer: number;
};

export function generateMathChallenge(
  difficulty: 'easy' | 'normal' | 'hard' = 'normal',
): MathChallenge {
  const max = difficulty === 'easy' ? 10 : difficulty === 'normal' ? 50 : 100;
  const a = Math.floor(Math.random() * max) + 1;
  const b = Math.floor(Math.random() * max) + 1;
  return { question: `${a} + ${b}`, answer: a + b };
}

export function checkMathAnswer(challenge: MathChallenge, attempt: number): boolean {
  return attempt === challenge.answer;
}

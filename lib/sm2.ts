export interface SM2State {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: Date;
}

export function sm2(
  quality: number,
  repetitions: number,
  easeFactor: number,
  interval: number
): SM2State {
  let newInterval: number;
  let newRepetitions: number;

  if (quality >= 3) {
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }
    newRepetitions = repetitions + 1;
  } else {
    newInterval = 1;
    newRepetitions = 0;
  }

  const newEaseFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReview,
  };
}

export const QUALITY_MAP = {
  again: 0,
  hard: 2,
  good: 4,
  easy: 5,
} as const;

export type QualityLabel = keyof typeof QUALITY_MAP;

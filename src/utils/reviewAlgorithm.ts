import type { ReviewData } from "@/types/review";

export const REVIEW_SCHEDULE = [0, 1, 3, 7, 14, 30, 60, 120, 240];
export const REVIEW_SCALE = 24 * 60 * 60 * 1000;
export const RECOVERY_SCALE = 15 * 24 * 60 * 60 * 1000;
export const TRAINING_N = 3;
export const REVIEW_N = REVIEW_SCHEDULE.length;

export function createInitialReviewData(now = Date.now()): ReviewData {
  return {
    due: now,
    level: 0,
    recoveryLevel: null,
  };
}

export function calculateNextReview(
  review: ReviewData,
  isCorrect: boolean,
  now = Date.now(),
): ReviewData {
  if (
    !isCorrect &&
    review.level > 0 &&
    review.due + RECOVERY_SCALE <= now &&
    review.recoveryLevel === null
  ) {
    return {
      due: now,
      level: 0,
      recoveryLevel: review.level,
    };
  }

  let scale = 1.0;
  let level = 0;

  if (review.recoveryLevel !== null) {
    scale = 2;
    level = Math.max(
      0,
      isCorrect ? review.level + 1 * scale : review.level - 2 * scale,
    );

    if (level > review.recoveryLevel) {
      return {
        due: now + REVIEW_SCALE,
        level: review.recoveryLevel,
        recoveryLevel: null,
      };
    }
  } else {
    level = Math.max(0, isCorrect ? review.level + 1 : review.level - 2);
  }

  const interval =
    REVIEW_SCHEDULE[Math.min(Math.max(level - TRAINING_N, 0), REVIEW_N - 1)];

  return {
    due: now + interval * REVIEW_SCALE,
    level: level,
    recoveryLevel: null,
  };
}

export function isDueForReview(review: ReviewData, now = Date.now()): boolean {
  return review.due <= now;
}

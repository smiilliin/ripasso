import type { ReviewData } from "@/types/card";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const INITIAL_INTERVAL = 1;
const INITIAL_EASE = 2.5;
const MIN_EASE = 1.3;

export function createInitialReviewData(now = Date.now()): ReviewData {
  return {
    interval: INITIAL_INTERVAL,
    ease: INITIAL_EASE,
    reviewCount: 0,
    correctCount: 0,
    nextReview: now,
  };
}

export function calculateNextReview(
  review: ReviewData,
  isCorrect: boolean,
  now = Date.now(),
): ReviewData {
  const ease = Math.max(
    MIN_EASE,
    isCorrect ? review.ease + 0.1 : review.ease - 0.2,
  );
  const interval = isCorrect ? review.interval * ease : INITIAL_INTERVAL;

  return {
    interval,
    ease,
    reviewCount: review.reviewCount + 1,
    correctCount: review.correctCount + (isCorrect ? 1 : 0),
    nextReview: now + interval * DAY_IN_MS,
  };
}

export function isDueForReview(review: ReviewData, now = Date.now()): boolean {
  return review.nextReview <= now;
}


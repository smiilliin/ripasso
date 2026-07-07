import type { ReviewData, ReviewDocument } from "./review";

export interface Example {
  sentence: string;
  translation: string;
  target: string;
  acceptedTargets: string[];
}

export interface Card {
  id: string;
  word: string;
  meaning: string;
  pronunciation: string;
  examples: Example[];
  review: ReviewData;
}

export function cardToReviewDocument(card: Card): ReviewDocument {
  return {
    cardId: card.id,
    review: card.review,
  };
}

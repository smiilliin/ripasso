export interface Card {
  id: string;
  word: string;
  meaning: string;
  partOfSpeech: string;
  pronunciation: string;
  audio?: string;
  examples: Example[];
  review: ReviewData;
}

export interface CardDeck {
  id: string;
  title: string;
  description: string;
  language: string;
  level: string;
  cards: Card[];
}

export type NewCardDeck = Omit<CardDeck, "id" | "cards">;

export interface Example {
  sentence: string;
  translation: string;
  target: string;
  difficulty: string;
}

export interface ReviewData {
  interval: number;
  ease: number;
  reviewCount: number;
  correctCount: number;
  nextReview: number;
}

export type NewCard = Omit<Card, "id">;

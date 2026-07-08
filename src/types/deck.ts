import type { Example } from "./card";

export interface DeckInfo {
  id: string;
  title: string;
  description: string;
  language: string;
  level: string;
  cardcount: number;
}

export interface DeckIndex {
  unlockedIndex: string;
}

export interface CardData {
  id: string;
  index: number;
  word: string;
  meaning: string;
  pronunciation: string;
  examples: Example[];
}

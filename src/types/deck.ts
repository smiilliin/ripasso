import type { Example } from "./card";

export interface DeckInfo {
  id: string;
  title: string;
  description: string;
  language: string;
  level: string;
}

export interface DeckIndex {
  unlockedIndex: string;
}

export interface CardData {
  id: string;
  word: string;
  meaning: string;
  pronunciation: string;
  examples: Example[];
}

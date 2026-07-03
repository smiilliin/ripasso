import type { Card, CardDeck } from "@/types/card";
import { createInitialReviewData } from "@/utils/reviewAlgorithm";

const italianStarterCards: Card[] = [
  {
    id: "dummy-mangiare",
    word: "mangiare",
    meaning: "먹다",
    partOfSpeech: "verb",
    pronunciation: "man-JA-re",
    examples: [
      {
        sentence: "Mangio una pizza ogni sabato.",
        translation: "나는 매주 토요일 피자를 먹는다.",
        target: "Mangio",
        difficulty: "A1",
      },
      {
        sentence: "Domani mangeremo insieme.",
        translation: "내일 우리는 함께 먹을 것이다.",
        target: "mangeremo",
        difficulty: "A2",
      },
    ],
    review: createInitialReviewData(),
  },
  {
    id: "dummy-cane",
    word: "cane",
    meaning: "개",
    partOfSpeech: "noun",
    pronunciation: "KA-ne",
    examples: [
      {
        sentence: "Il cane dorme sul divano.",
        translation: "개가 소파에서 자고 있다.",
        target: "cane",
        difficulty: "A1",
      },
      {
        sentence: "Il mio cane e molto intelligente.",
        translation: "우리 개는 매우 똑똑하다.",
        target: "cane",
        difficulty: "A1",
      },
    ],
    review: createInitialReviewData(),
  },
  {
    id: "dummy-bere",
    word: "bere",
    meaning: "마시다",
    partOfSpeech: "verb",
    pronunciation: "BE-re",
    examples: [
      {
        sentence: "Bevo un caffe ogni mattina.",
        translation: "나는 매일 아침 커피를 마신다.",
        target: "Bevo",
        difficulty: "A1",
      },
      {
        sentence: "Vuoi bere qualcosa?",
        translation: "뭔가 마시고 싶니?",
        target: "bere",
        difficulty: "A1",
      },
    ],
    review: createInitialReviewData(),
  },
];

const japaneseStarterCards: Card[] = [
  {
    id: "dummy-jp-tabemasu",
    word: "食べます",
    meaning: "먹습니다",
    partOfSpeech: "verb",
    pronunciation: "たべます",
    examples: [
      {
        sentence: "朝ごはんを食べます。",
        translation: "아침밥을 먹습니다.",
        target: "食べます",
        difficulty: "N5",
      },
    ],
    review: createInitialReviewData(),
  },
  {
    id: "dummy-jp-mizu",
    word: "水",
    meaning: "물",
    partOfSpeech: "noun",
    pronunciation: "みず",
    examples: [
      {
        sentence: "水を飲みます。",
        translation: "물을 마십니다.",
        target: "水",
        difficulty: "N5",
      },
    ],
    review: createInitialReviewData(),
  },
  {
    id: "dummy-jp-ookii",
    word: "大きい",
    meaning: "크다",
    partOfSpeech: "adjective",
    pronunciation: "おおきい",
    examples: [
      {
        sentence: "大きい犬がいます。",
        translation: "큰 개가 있습니다.",
        target: "大きい",
        difficulty: "N5",
      },
    ],
    review: createInitialReviewData(),
  },
];

export const dummyDecks: CardDeck[] = [
  {
    id: "italian-starter",
    title: "Italian Starter",
    description: "CILS 입문용 동사와 명사를 가볍게 복습합니다.",
    language: "Italian",
    level: "A1",
    cards: italianStarterCards,
  },
  {
    id: "japanese-starter",
    title: "Japanese Starter",
    description: "히라가나 읽기와 기본 의미 매칭을 확인합니다.",
    language: "Japanese",
    level: "N5",
    cards: japaneseStarterCards,
  },
];

export const dummyCards = italianStarterCards;

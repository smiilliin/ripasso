import type { CardData, DeckInfo } from "../src/types/deck";
import jlptN35 from "./jlpt_n35.json";
import jlptN2 from "./jlpt_n2.json";
import cilsA1B1 from "./cils_a1b1.json";

// leftpad id
const leftpad = (str: string, len: number) => {
  while (str.length < len) {
    str = "0" + str;
  }
  return str;
};

const jlptCards: CardData[] = jlptN35.map((card, index) => ({
  ...card,
  id: `jp-n35-${leftpad(index.toString(), 6)}`,
  index: index,
}));
const jlptN2Cards: CardData[] = jlptN2.map((card, index) => ({
  ...card,
  id: `jp-n2-${leftpad(index.toString(), 6)}`,
  index: index,
}));
const cilsCards: CardData[] = cilsA1B1.map((card, index) => ({
  ...card,
  id: `cils-a1b1-${leftpad(index.toString(), 6)}`,
  index: index,
}));

export const dummyDecks: { info: DeckInfo; cards: CardData[] }[] = [
  {
    info: {
      id: "jlpt-n35",
      title: "JLPT N3~N5",
      description: "JLPT N3~N5 수준의 일본어 표현을 학습합니다.",
      language: "Japanese",
      level: "N3~N5",
      cardcount: jlptCards.length,
    },
    cards: jlptCards,
  },
  {
    info: {
      id: "jlpt-n2",
      title: "JLPT N2",
      description: "JLPT N2 수준의 일본어 표현을 학습합니다.",
      language: "Japanese",
      level: "N2",
      cardcount: jlptN2Cards.length,
    },
    cards: jlptN2Cards,
  },
  {
    info: {
      id: "cils-a1b1",
      title: "CILS A1-B1",
      description: "CILS A1-B1 수준의 이탈리아어 표현을 학습합니다.",
      language: "Italian",
      level: "A1-B1",
      cardcount: cilsCards.length,
    },
    cards: cilsCards,
  },
];

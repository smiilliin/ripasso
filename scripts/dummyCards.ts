import type { CardData, DeckInfo } from "../src/types/deck";
import jlptN35 from "./jlpt_n35.json";

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
];

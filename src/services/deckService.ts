import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/firebase/firebase";
import type { CardDeck, NewCard, NewCardDeck } from "@/types/card";

function decksCollection(userId: string) {
  return collection(db, "users", userId, "decks");
}

function cardsCollection(userId: string, deckId: string) {
  return collection(db, "users", userId, "decks", deckId, "cards");
}

export async function getDecks(userId: string): Promise<CardDeck[]> {
  const decksQuery = query(decksCollection(userId), orderBy("title", "asc"));
  const deckSnapshot = await getDocs(decksQuery);

  return Promise.all(
    deckSnapshot.docs.map(async (deckDoc) => {
      const cardsSnapshot = await getDocs(cardsCollection(userId, deckDoc.id));

      return {
        ...(deckDoc.data() as NewCardDeck),
        id: deckDoc.id,
        cards: cardsSnapshot.docs.map((cardDoc) => ({
          ...(cardDoc.data() as NewCard),
          id: cardDoc.id,
        })),
      };
    }),
  );
}

export async function saveDeck(userId: string, deck: CardDeck): Promise<void> {
  const { cards, id, ...deckData } = deck;
  const batch = writeBatch(db);
  const deckRef = doc(decksCollection(userId), id);

  batch.set(deckRef, deckData);

  cards.forEach((card) => {
    const { id: cardId, ...cardData } = card;
    const cardRef = doc(cardsCollection(userId, id), cardId);
    batch.set(cardRef, cardData);
  });

  await batch.commit();
}

export async function saveDecks(
  userId: string,
  decks: CardDeck[],
): Promise<void> {
  await Promise.all(decks.map((deck) => saveDeck(userId, deck)));
}

export async function createDeck(
  userId: string,
  deckId: string,
  deck: NewCardDeck,
): Promise<void> {
  await setDoc(doc(decksCollection(userId), deckId), deck);
}

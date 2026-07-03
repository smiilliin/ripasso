import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@/firebase/firebase";
import type { Card, NewCard } from "@/types/card";

function cardsCollection(userId: string, deckId: string) {
  return collection(db, "users", userId, "decks", deckId, "cards");
}

export async function createCard(
  userId: string,
  deckId: string,
  card: NewCard,
): Promise<Card> {
  const docRef = await addDoc(cardsCollection(userId, deckId), card);

  return {
    ...card,
    id: docRef.id,
  };
}

export async function getCards(
  userId: string,
  deckId: string,
): Promise<Card[]> {
  const snapshot = await getDocs(cardsCollection(userId, deckId));

  return snapshot.docs.map((cardDoc) => ({
    ...(cardDoc.data() as NewCard),
    id: cardDoc.id,
  }));
}

export async function getDueCards(
  userId: string,
  deckId: string,
  now = Date.now(),
): Promise<Card[]> {
  const dueCardsQuery = query(
    cardsCollection(userId, deckId),
    where("review.nextReview", "<=", now),
    orderBy("review.nextReview", "asc"),
  );
  const snapshot = await getDocs(dueCardsQuery);

  return snapshot.docs.map((cardDoc) => ({
    ...(cardDoc.data() as NewCard),
    id: cardDoc.id,
  }));
}

export function updateCard(
  userId: string,
  deckId: string,
  cardId: string,
  card: Partial<NewCard>,
): Promise<void> {
  return updateDoc(doc(cardsCollection(userId, deckId), cardId), card);
}

export function deleteCard(
  userId: string,
  deckId: string,
  cardId: string,
): Promise<void> {
  return deleteDoc(doc(cardsCollection(userId, deckId), cardId));
}

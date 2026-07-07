import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  startAt,
} from "firebase/firestore";

import { db } from "@/firebase/firebase";

import type { CardData, DeckInfo, DeckIndex } from "@/types/deck";
import type { ReviewData, ReviewDocument } from "@/types/review";

export async function getAllDecks(): Promise<DeckInfo[]> {
  const snapshot = await getDocs(
    query(collection(db, "decks"), orderBy("title")),
  );

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<DeckInfo, "id">),
  }));
}
export async function getDeckInfo(deckId: string): Promise<DeckInfo> {
  const snapshot = await getDoc(doc(db, "decks", deckId));

  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<DeckInfo, "id">),
  };
}

export async function getDeckCardsByIdx(
  deckId: string,
  cardIds: string[],
): Promise<CardData[]> {
  const snapshots = await Promise.all(
    cardIds.map((cardId) => getDoc(doc(db, "decks", deckId, "cards", cardId))),
  );

  return snapshots
    .filter((snapshot) => snapshot.exists())
    .map((snapshot) => ({
      id: snapshot.id,
      ...(snapshot.data() as Omit<CardData, "id">),
    }));
}

export async function travelDeckCards(
  deckId: string,
  start: DeckIndex | null,
  count: number,
): Promise<CardData[]> {
  let q;

  if (!start) {
    q = query(
      collection(db, "decks", deckId, "cards"),
      orderBy("__name__"),
      limit(count),
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<CardData, "id">),
    }));
  } else {
    q = query(
      collection(db, "decks", deckId, "cards"),
      orderBy("__name__"),
      startAt(start.unlockedIndex),
      limit(count + 1),
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.slice(1, count + 1).map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<CardData, "id">),
    }));
  }
}

export async function getReviews(
  userId: string,
  deckId: string,
): Promise<ReviewDocument[]> {
  const snapshot = await getDocs(
    collection(db, "users", userId, "decks", deckId, "reviews"),
  );

  return snapshot.docs.map((doc) => ({
    cardId: doc.id,
    ...(doc.data() as Omit<ReviewDocument, "cardId">),
  }));
}
export async function saveReview(
  userId: string,
  deckId: string,
  cardId: string,
  review: ReviewData,
) {
  await setDoc(doc(db, "users", userId, "decks", deckId, "reviews", cardId), {
    review,
  });
}

export async function makeDeckIndex(deckId: string): Promise<DeckIndex | null> {
  const q = query(
    collection(db, "decks", deckId, "cards"),
    orderBy("__name__"),
    limit(1),
  );

  const snapshot = await getDocs(q);

  const result = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<CardData, "id">),
  }));
  const id = result[0]?.id;

  return id ? { unlockedIndex: id } : null;
}
export async function getDeckIndex(
  userId: string,
  deckId: string,
): Promise<DeckIndex | null> {
  const snapshot = await getDoc(doc(db, "users", userId, "decks", deckId));

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as DeckIndex;
}
export async function saveDeckIndex(
  userId: string,
  deckId: string,
  userDeckIndex: DeckIndex,
): Promise<void> {
  await setDoc(doc(db, "users", userId, "decks", deckId), userDeckIndex, {
    merge: true,
  });
}

// function activeDecksCollection(userId: string) {
//   return collection(db, "users", userId, "decks");
// }
// // async function getDeck(
// //   userId: string,
// //   deckId: string
// // ): Promise<Deck> {
// //     ...
// // }

// async function createDeck(userId: string, deck: DeckInfo) {
//   const deckRef = doc(db, "users", userId, "decks", deck.id);

//   await setDoc(deckRef, {
//     title: deck.title,
//     description: deck.description,
//     language: deck.language,
//     level: deck.level,
//   });
// }

// async function addCards(
//   userId: string,
//   deckId: string,
//   cards: Card[]
// ) {
//   const batch = writeBatch(db);

//   for (const card of cards) {
//     const ref = doc(
//       db,
//       "users",
//       userId,
//       "decks",
//       deckId,
//       "unseen",
//       card.id
//     );

//     batch.set(ref, card);
//   }

//   await batch.commit();
// }
// async function getCards(
//   userId: string,
//   deckId: string,
//   state: "unseen" | "active" | "dormant"
// ): Promise<Card[]> {

//     const ref = collection(
//         db,
//         "users",
//         userId,
//         "decks",
//         deckId,
//         state
//     );

//     const snapshot = await getDocs(ref);

//     return snapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data()
//     })) as Card[];
// }

// async function getUnseenSnapshot(userId: string, deckId: string): Promise<CardDeck> {
//   const unseenRef = collection(db, "users", userId, "decks", deckId, "unseen");
//   return (await getDocs(unseenRef)).docs;
// }

// async function getActiveSnapshot(userId: string, deckId: string) {
//   const activeRef = collection(db, "users", userId, "decks", deckId, "active");
//   return (await getDocs(activeRef)).docs;
// }

// async function getDormantSnapshot(userId: string, deckId: string) {
//   const dormantRef = collection(
//     db,
//     "users",
//     userId,
//     "decks",
//     deckId,
//     "dormant",
//   );
//   return (await getDocs(dormantRef)).docs;
// }
// function getDecksSnapshot(userId: string, deckId: string) {
//   return Promise.all([
//     getUnseenSnapshot(userId, deckId),
//     getActiveSnapshot(userId, deckId),
//     getDormantSnapshot(userId, deckId),
//   ])
// }

// export async function getDecks(userId: string): Promise<CardDeck[]> {
//   const decksQuery = query(
//     activeDecksCollection(userId),
//     orderBy("title", "asc"),
//   );
//   const deckSnapshot = await getDocs(decksQuery);

//   return Promise.all(
//     deckSnapshot.docs.map(async (deckDoc) => {
//       const unseenSnapshot = await getUnseenShapshot(
//         userId,
//         deckDoc.id,
//       );

//       return {
//         ...(deckDoc.data() as NewCardDeck),
//         id: deckDoc.id,
//         cards: unseenSnapshot[].docs.map((cardDoc) => ({
//           ...(cardDoc.data() as NewCard),
//           id: cardDoc.id,
//         })),
//       };
//     }),
//   );
// }

// export async function saveDeck(userId: string, deck: CardDeck): Promise<void> {
//   const { cards, id, ...deckData } = deck;
//   const batch = writeBatch(db);
//   const deckRef = doc(activeDecksCollection(userId), id);

//   batch.set(deckRef, deckData);

//   cards.forEach((card) => {
//     const { id: cardId, ...cardData } = card;
//     const cardRef = doc(cardsCollection(userId, id), cardId);
//     batch.set(cardRef, cardData);
//   });

//   await batch.commit();
// }

// export async function saveDecks(
//   userId: string,
//   decks: CardDeck[],
// ): Promise<void> {
//   await Promise.all(decks.map((deck) => saveDeck(userId, deck)));
// }

// export async function startDeck(userId: string, deckId: string): Promise<void> {
//   const unseenDeckDoc = await getDocs(unseenCollection(userId, deckId));
//   // const activeDeckDoc = getDocs(activeCollection(userId), deckId);
//   // const dormantDeckDoc = doc(dormantCollection(userId), deckId);
//   // const cardsSnapshot = await getDocs(cardsCollection(userId, deckDoc.id));

//   await setDoc(activeDeckDoc, await getDocs(unseenDeckDoc).data());
// }

// // export async function createDeck(
// //   userId: string,
// //   deckId: string,
// //   deck: NewCardDeck,
// // ): Promise<void> {
// //   await setDoc(doc(unseenCollection(userId), deckId), deck);
// // }

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import serviceAccount from "../service-account.json";
import { dummyDecks } from "./dummyCards";

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function uploadDecks() {
  for (const deck of dummyDecks) {
    const { info, cards } = deck;

    await db.collection("decks").doc(info.id).set({
      title: info.title,
      description: info.description,
      language: info.language,
      level: info.level,
    });

    const writer = db.bulkWriter();

    for (const card of cards) {
      writer.set(
        db.collection("decks").doc(info.id).collection("cards").doc(card.id),
        card,
      );
    }

    await writer.close();

    console.log(`${info.title} uploaded`);
  }
}

uploadDecks()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch(console.error);

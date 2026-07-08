import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import serviceAccount from "../service-account.json";
import { dummyDecks } from "./dummyCards";

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function uploadDecks(forUploadDecks: typeof dummyDecks) {
  for (const deck of forUploadDecks) {
    const { info, cards } = deck;

    await db.collection("decks").doc(info.id).set({
      title: info.title,
      description: info.description,
      language: info.language,
      level: info.level,
      cardcount: info.cardcount,
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

import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// ask for selection of decks to upload
for (const [index, deck] of dummyDecks.entries()) {
  console.log(`${index + 1}. ${deck.info.title}`);
}

rl.question(
  "Select decks to upload (comma separated): ",
  async (answer: string) => {
    const selectedIndexes = answer
      .split(",")
      .map((s) => parseInt(s.trim()) - 1)
      .filter((i) => i >= 0 && i < dummyDecks.length);

    const selectedDecks = selectedIndexes.map((i) => dummyDecks[i]);
    if (selectedDecks.length === 0) {
      console.log("No decks selected. Exiting.");
      rl.close();
      process.exit(0);
    }

    console.log(
      `Uploading ${selectedDecks.length} deck(s): ${selectedDecks
        .map((d) => d.info.title)
        .join(", ")}`,
    );

    try {
      await uploadDecks(selectedDecks);
      console.log("Done!");
    } catch (error) {
      console.error(error);
    } finally {
      rl.close();
      process.exit(0);
    }
  },
);

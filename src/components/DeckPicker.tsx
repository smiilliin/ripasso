import { getCardIndex, getDeckIndex } from "@/services/deckService";
import type { DeckInfo } from "@/types/deck";
import type { User } from "firebase/auth";
import { useEffect, useState } from "react";

interface DeckPickerProps {
  decks: DeckInfo[];
  isSeeding: boolean;
  user: User | null;
  onSeedDecks: () => void;
  onSelectDeck: (deckId: string) => void;
}

export function DeckPicker({
  decks,
  isSeeding,
  onSeedDecks,
  onSelectDeck,
  user,
}: DeckPickerProps) {
  const [deckIndexes, setDeckIndexes] = useState<Record<string, number | null>>(
    {},
  );

  useEffect(() => {
    if (!user) {
      return;
    }
    async function loadDeckIndexes(user: User) {
      const indexes: Record<string, number | null> = {};

      for (const deck of decks) {
        const deck_index = await getDeckIndex(user.uid, deck.id);

        // console.log("deck_index:", deck_index);
        if (!deck_index) {
          indexes[deck.id] = null;
          continue;
        }
        const card_index = await getCardIndex(
          deck.id,
          deck_index.unlockedIndex,
        );
        // console.log("card_index:", card_index);
        indexes[deck.id] = card_index;
      }

      setDeckIndexes(indexes);
    }

    void loadDeckIndexes(user);
  }, [decks, user]);

  return (
    <section className="deck-picker" aria-labelledby="deck-picker-title">
      <div className="deck-picker-header">
        <p className="eyebrow">학습할 묶음을 고르세요</p>
        <h2 id="deck-picker-title">카드 묶음</h2>
      </div>

      {decks.length === 0 ? (
        <div className="empty-state deck-empty-state">
          <h2>저장된 카드 묶음이 없습니다</h2>
          <p>샘플 묶음을 Firestore에 저장해서 복습 흐름을 확인해보세요.</p>
          <button
            className="primary-button"
            disabled={isSeeding}
            type="button"
            onClick={onSeedDecks}
          >
            {isSeeding ? "저장 중..." : "샘플 묶음 추가"}
          </button>
        </div>
      ) : (
        <div className="deck-grid">
          {decks.map((deck) => {
            const unlockedIndex = deckIndexes[deck.id] ?? null;

            return (
              <button
                className="deck-card"
                key={deck.id}
                type="button"
                onClick={() => onSelectDeck(deck.id)}
              >
                <span className="deck-meta">
                  {deck.language} · {deck.level} · {deck.cardcount} cards
                </span>
                <span className="deck-title">{deck.title}</span>
                <span className="deck-description">{deck.description}</span>
                {unlockedIndex !== null ? (
                  <span className="deck-progress">
                    [ {unlockedIndex} / {deck.cardcount} (
                    {Math.round((unlockedIndex / deck.cardcount) * 100)}%) ]
                  </span>
                ) : (
                  <span className="deck-progress">[ ]</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

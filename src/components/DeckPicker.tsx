import type { CardDeck } from "@/types/card";

interface DeckPickerProps {
  decks: CardDeck[];
  isSeeding: boolean;
  onSeedDecks: () => void;
  onSelectDeck: (deckId: string) => void;
}

export function DeckPicker({
  decks,
  isSeeding,
  onSeedDecks,
  onSelectDeck,
}: DeckPickerProps) {
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
          {decks.map((deck) => (
            <button
              className="deck-card"
              key={deck.id}
              type="button"
              onClick={() => onSelectDeck(deck.id)}
            >
              <span className="deck-meta">
                {deck.language} · {deck.level} · {deck.cards.length} cards
              </span>
              <span className="deck-title">{deck.title}</span>
              <span className="deck-description">{deck.description}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

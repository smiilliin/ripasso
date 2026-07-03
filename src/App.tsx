import { useEffect, useState } from "react";
import type { User } from "firebase/auth";

import "./App.css";

import { DeckPicker } from "@/components/DeckPicker";
import { FlashcardDeck } from "@/components/FlashcardDeck";
import { dummyDecks } from "@/data/dummyCards";
import {
  loginWithGoogle,
  logout,
  subscribeToAuthState,
} from "@/services/authService";
import { updateCard } from "@/services/cardService";
import { getDecks, saveDecks } from "@/services/deckService";
import type { Card, CardDeck } from "@/types/card";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDecksLoading, setIsDecksLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [deckError, setDeckError] = useState<string | null>(null);
  const [decks, setDecks] = useState<CardDeck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId) ?? null;

  useEffect(() => {
    return subscribeToAuthState((currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
      setSelectedDeckId(null);

      if (!currentUser) {
        setDecks([]);
        setDeckError(null);
      }
    });
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    let isCurrent = true;
    const currentUser = user;

    async function loadDecks() {
      setIsDecksLoading(true);
      setDeckError(null);

      try {
        const loadedDecks = await getDecks(currentUser.uid);

        if (isCurrent) {
          setDecks(loadedDecks);
        }
      } catch (error) {
        console.error(error);

        if (isCurrent) {
          setDeckError("카드 묶음을 불러오지 못했습니다.");
        }
      } finally {
        if (isCurrent) {
          setIsDecksLoading(false);
        }
      }
    }

    void loadDecks();

    return () => {
      isCurrent = false;
    };
  }, [user]);

  const seedSampleDecks = async () => {
    if (!user) {
      return;
    }

    setIsSeeding(true);
    setDeckError(null);

    try {
      await saveDecks(user.uid, dummyDecks);
      setDecks(await getDecks(user.uid));
    } catch (error) {
      console.error(error);
      setDeckError("샘플 카드 묶음을 저장하지 못했습니다.");
    } finally {
      setIsSeeding(false);
    }
  };

  const saveReviewedCard = async (card: Card) => {
    if (!user || !selectedDeck) {
      return;
    }

    try {
      await updateCard(user.uid, selectedDeck.id, card.id, {
        review: card.review,
      });
      setDecks((currentDecks) =>
        currentDecks.map((deck) =>
          deck.id === selectedDeck.id
            ? {
                ...deck,
                cards: deck.cards.map((deckCard) =>
                  deckCard.id === card.id ? card : deckCard,
                ),
              }
            : deck,
        ),
      );
    } catch (error) {
      console.error(error);
      setDeckError("복습 결과를 저장하지 못했습니다.");
    }
  };

  if (isLoading) {
    return <p className="loading">Loading...</p>;
  }

  if (!user) {
    return (
      <main className="app-shell auth-shell">
        <section className="auth-panel">
          <p className="eyebrow">Spaced repetition for language learners</p>
          <h1>Ripasso</h1>
          <p className="auth-copy">
            이탈리아어 단어를 플래시카드로 복습하고, 곧 Firestore에 학습 기록을
            저장합니다.
          </p>
          <button className="primary-button" onClick={loginWithGoogle}>
            Google Login
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">오늘의 Ripasso</p>
          <p className="user-name">{user.displayName ?? user.email}</p>
        </div>
        <button className="secondary-button" onClick={logout}>
          Logout
        </button>
      </header>
      {deckError ? <p className="status-message error">{deckError}</p> : null}
      {isDecksLoading ? (
        <p className="loading">카드 묶음을 불러오는 중...</p>
      ) : selectedDeck ? (
        <FlashcardDeck
          cards={selectedDeck.cards}
          key={selectedDeck.id}
          title={selectedDeck.title}
          onBackToDecks={() => setSelectedDeckId(null)}
          onReviewCard={saveReviewedCard}
        />
      ) : (
        <DeckPicker
          decks={decks}
          isSeeding={isSeeding}
          onSeedDecks={seedSampleDecks}
          onSelectDeck={setSelectedDeckId}
        />
      )}
    </main>
  );
}

export default App;

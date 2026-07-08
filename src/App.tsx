import { useCallback, useEffect, useState } from "react";
import type { User } from "firebase/auth";

import "./App.css";

import { DeckPicker } from "@/components/DeckPicker";
import { FlashcardDeck } from "@/components/FlashcardDeck";
import {
  loginWithGoogle,
  logout,
  subscribeToAuthState,
} from "@/services/authService";
import type { DeckInfo, DeckIndex } from "./types/deck";
import {
  getAllDecks,
  getReviews,
  getDeckIndex,
  saveDeckIndex,
  saveReview,
} from "./services/deckService";
import type { ReviewDocument } from "./types/review";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDecksLoading, setIsDecksLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [deckError, setDeckError] = useState<string | null>(null);
  const [decks, setDecks] = useState<DeckInfo[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<ReviewDocument[]>([]);
  const [deckIndex, setDeckIndex] = useState<DeckIndex | null>(null);
  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId) ?? null;
  const [updateFlag, setUpdateFlag] = useState(false);

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
    let isCurrent = true;

    async function loadDecks() {
      if (!user) {
        return;
      }
      setIsDecksLoading(true);
      setDeckError(null);

      try {
        const loadedDecks = await getAllDecks();

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
  useEffect(() => {
    if (!user || !selectedDeckId) {
      setReviewData([]);
      return;
    }

    getReviews(user.uid, selectedDeckId).then((reviews) => {
      setReviewData(reviews);
    });
  }, [user, selectedDeckId]);

  useEffect(() => {
    if (!user || !selectedDeck) {
      return;
    }

    async function fetchUserDeck(user: User, selectedDeck: DeckInfo) {
      try {
        let deckIndex = await getDeckIndex(user.uid, selectedDeck.id);

        if (!deckIndex) {
          deckIndex = null;
        }

        setDeckIndex(deckIndex);
        setUpdateFlag(true);
      } catch (error) {
        console.error(error);
        setDeckError("사용자 카드 묶음을 불러오지 못했습니다.");
      }
    }

    void fetchUserDeck(user, selectedDeck);
  }, [user, selectedDeck]);

  const seedSampleDecks = async () => {
    if (!user) {
      return;
    }

    setIsSeeding(true);
    setDeckError(null);

    try {
      const decks = await getAllDecks();
      setDecks(decks);
    } catch (error) {
      console.error(error);
      setDeckError("샘플 카드 묶음을 저장하지 못했습니다.");
    } finally {
      setIsSeeding(false);
    }
  };

  const saveReviewedCard = useCallback(
    async (review: ReviewDocument) => {
      if (!user || !selectedDeck) return;

      try {
        await saveReview(
          user.uid,
          selectedDeck.id,
          review.cardId,
          review.review,
        );

        setReviewData((prev) => {
          const index = prev.findIndex((r) => r.cardId === review.cardId);

          if (index === -1) {
            return [...prev, review];
          }

          const next = [...prev];
          next[index] = review;
          return next;
        });

        if (deckIndex == null || review.cardId > deckIndex.unlockedIndex) {
          await saveDeckIndex(user.uid, selectedDeck.id, {
            unlockedIndex: review.cardId,
          });

          setDeckIndex({
            unlockedIndex: review.cardId,
          });
        }

        // console.log("복습 결과가 저장되었습니다.");
      } catch (error) {
        console.error(error);
        setDeckError("복습 결과를 저장하지 못했습니다.");
      }
    },
    [user, selectedDeck, setReviewData, deckIndex, setDeckIndex],
  );

  if (isLoading) {
    return <p className="loading">Loading...</p>;
  }

  if (!user) {
    return (
      <main className="app-shell auth-shell">
        <section className="auth-panel">
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <img
              src="/ghost.png"
              width="50"
              height="50"
              // style={{ position: "absolute", top: "10px", left: "100px" }}
              alt="Ripassooo"
              className="logo"
            />
            <h1>Ripasso</h1>
          </div>
          <p className="auth-copy">망각과 떠올림을 위한 복습</p>
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
        <span style={{ position: "relative" }}>
          <img
            src="/ghost.png"
            width="40"
            height="40"
            style={{ position: "absolute", top: "10px", left: "100px" }}
            alt="Ripassooo"
            className="logo"
          />
          <div>
            <p className="eyebrow">오늘의 Ripasso</p>
            <p className="user-name">{user.displayName ?? user.email}</p>
          </div>
        </span>
        <button className="secondary-button" onClick={logout}>
          로그아웃
        </button>
      </header>
      {deckError ? <p className="status-message error">{deckError}</p> : null}
      {isDecksLoading ? (
        <p className="loading">카드 묶음을 불러오는 중...</p>
      ) : selectedDeck ? (
        <FlashcardDeck
          deckInfo={selectedDeck}
          key={selectedDeck.id}
          title={selectedDeck.title}
          onBackToDecks={() => setSelectedDeckId(null)}
          updateFlag={updateFlag}
          setUpdateFlag={setUpdateFlag}
          reviews={reviewData}
          onReviewCard={saveReviewedCard}
          deckIndex={deckIndex}
        />
      ) : (
        <DeckPicker
          decks={decks}
          user={user}
          isSeeding={isSeeding}
          onSeedDecks={seedSampleDecks}
          onSelectDeck={setSelectedDeckId}
        />
      )}
    </main>
  );
}

export default App;

import { useMemo, useState } from "react";

import type { Card } from "@/types/card";
import { calculateNextReview } from "@/utils/reviewAlgorithm";

interface FlashcardDeckProps {
  cards: Card[];
  title: string;
  onBackToDecks: () => void;
  onReviewCard?: (card: Card) => void | Promise<void>;
}

type QuizMode = "meaningToPronunciation" | "pronunciationToMeaning" | "cloze";
type DisplayMode = "wordFirst" | "pronunciationFirst";

interface QuizPrompt {
  mode: QuizMode;
  label: string;
  prompt: string;
  promptSecondary?: string;
  answer: string;
  answerSecondary?: string;
  helper: string;
}

const quizModes: QuizMode[] = [
  "meaningToPronunciation",
  "pronunciationToMeaning",
  "cloze",
];

function getRandomQuizMode(): QuizMode {
  return quizModes[Math.floor(Math.random() * quizModes.length)];
}

function getClozeSentence(card: Card): string {
  const example = card.examples[0];

  if (!example) {
    return "예문이 아직 없습니다.";
  }

  return example.sentence.replace(example.target, "_____");
}

function getPrimaryExpression(card: Card, displayMode: DisplayMode): string {
  return displayMode === "pronunciationFirst" ? card.pronunciation : card.word;
}

function getSecondaryExpression(card: Card, displayMode: DisplayMode): string {
  return displayMode === "pronunciationFirst" ? card.word : card.pronunciation;
}

function createQuizPrompt(
  card: Card,
  mode: QuizMode,
  displayMode: DisplayMode,
): QuizPrompt {
  const example = card.examples[0];
  const primaryExpression = getPrimaryExpression(card, displayMode);
  const secondaryExpression = getSecondaryExpression(card, displayMode);

  if (mode === "meaningToPronunciation") {
    return {
      mode,
      label: "뜻 -> 표현",
      prompt: card.meaning,
      answer: primaryExpression,
      answerSecondary: secondaryExpression,
      helper: "이 뜻에 해당하는 표현을 떠올려보세요.",
    };
  }

  if (mode === "pronunciationToMeaning") {
    return {
      mode,
      label: "표현 -> 뜻",
      prompt: primaryExpression,
      promptSecondary: secondaryExpression,
      answer: card.meaning,
      helper: "표현 단서를 보고 뜻을 떠올려보세요.",
    };
  }

  return {
    mode,
    label: "예문 빈칸",
    prompt: getClozeSentence(card),
    answer: example?.target ?? card.word,
    helper: example?.translation ?? "빈칸에 들어갈 단어를 떠올려보세요.",
  };
}

function formatInterval(interval: number): string {
  return `${interval.toFixed(1)}일`;
}

export function FlashcardDeck({
  cards,
  title,
  onBackToDecks,
  onReviewCard,
}: FlashcardDeckProps) {
  const [studyCards, setStudyCards] = useState(cards);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [quizMode, setQuizMode] = useState<QuizMode>(getRandomQuizMode);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("wordFirst");

  const activeCard = studyCards[activeIndex];
  const quiz = useMemo(
    () =>
      activeCard ? createQuizPrompt(activeCard, quizMode, displayMode) : null,
    [activeCard, displayMode, quizMode],
  );
  const progress = useMemo(
    () => `${activeIndex + 1} / ${studyCards.length}`,
    [activeIndex, studyCards.length],
  );

  if (!activeCard) {
    return (
      <section className="empty-state">
        <h2>카드가 아직 없습니다</h2>
        <p>새 단어를 추가하면 여기에 플래시카드가 표시됩니다.</p>
      </section>
    );
  }

  const goToCard = (nextIndex: number) => {
    setActiveIndex(nextIndex);
    setIsAnswerVisible(false);
    setQuizMode(getRandomQuizMode());
  };

  const goToPrevious = () => {
    goToCard(activeIndex === 0 ? studyCards.length - 1 : activeIndex - 1);
  };

  const goToNext = () => {
    goToCard(activeIndex === studyCards.length - 1 ? 0 : activeIndex + 1);
  };

  const recordReview = (isCorrect: boolean) => {
    const reviewedCard = {
      ...activeCard,
      review: calculateNextReview(activeCard.review, isCorrect),
    };

    setStudyCards((currentCards) =>
      currentCards.map((card, index) =>
        index === activeIndex ? reviewedCard : card,
      ),
    );
    void onReviewCard?.(reviewedCard);
    goToNext();
  };

  return (
    <section className="flashcard-section" aria-label="Flashcard deck">
      <div className="deck-header">
        <div>
          <button
            className="text-button"
            type="button"
            onClick={onBackToDecks}
          >
            카드 묶음으로
          </button>
          <p className="eyebrow">오늘의 카드</p>
          <h1>{title}</h1>
        </div>
        <div className="deck-tools">
          <div className="segmented-control" aria-label="Display mode">
            <button
              className={displayMode === "wordFirst" ? "active" : ""}
              type="button"
              onClick={() => setDisplayMode("wordFirst")}
            >
              단어 우선
            </button>
            <button
              className={displayMode === "pronunciationFirst" ? "active" : ""}
              type="button"
              onClick={() => setDisplayMode("pronunciationFirst")}
            >
              발음 우선
            </button>
          </div>
          <p className="progress-pill">{progress}</p>
        </div>
      </div>

      <button
        className="flashcard"
        type="button"
        onClick={() => setIsAnswerVisible((current) => !current)}
      >
        <span className="card-label">{quiz?.label}</span>
        {!isAnswerVisible ? (
          <span className="card-face">
            <span className={quiz?.mode === "cloze" ? "example" : "word"}>
              {quiz?.prompt}
            </span>
            {quiz?.promptSecondary ? (
              <span className="prompt-secondary">{quiz.promptSecondary}</span>
            ) : null}
            <span className="hint">{quiz?.helper}</span>
            <span className="hint">카드를 눌러 정답 보기</span>
          </span>
        ) : (
          <span className="card-face">
            <span className="meaning">{quiz?.answer}</span>
            {quiz?.answerSecondary ? (
              <span className="answer-secondary">{quiz.answerSecondary}</span>
            ) : null}
            <span className="meta">
              {getPrimaryExpression(activeCard, displayMode)} ·{" "}
              {activeCard.partOfSpeech} · {activeCard.examples[0]?.difficulty}
            </span>
            <span className="example">{activeCard.examples[0]?.sentence}</span>
            <span className="translation">
              {activeCard.examples[0]?.translation}
            </span>
          </span>
        )}
      </button>

      <div className="deck-actions">
        <button type="button" onClick={goToPrevious}>
          이전
        </button>
        <button
          type="button"
          onClick={() => setIsAnswerVisible((current) => !current)}
        >
          {isAnswerVisible ? "문제 보기" : "정답 보기"}
        </button>
        <button type="button" onClick={goToNext}>
          다음
        </button>
      </div>

      <div className="review-actions">
        <button
          className="review-button dont-know"
          type="button"
          onClick={() => recordReview(false)}
        >
          몰라요
        </button>
        <button
          className="review-button know"
          type="button"
          onClick={() => recordReview(true)}
        >
          알아요
        </button>
      </div>

      <dl className="review-stats">
        <div>
          <dt>간격</dt>
          <dd>{formatInterval(activeCard.review.interval)}</dd>
        </div>
        <div>
          <dt>Ease</dt>
          <dd>{activeCard.review.ease.toFixed(1)}</dd>
        </div>
        <div>
          <dt>복습</dt>
          <dd>{activeCard.review.reviewCount}회</dd>
        </div>
        <div>
          <dt>정답</dt>
          <dd>{activeCard.review.correctCount}회</dd>
        </div>
      </dl>

      <div className="card-list" aria-label="Card list">
        {studyCards.map((card, index) => (
          <button
            className={index === activeIndex ? "card-chip active" : "card-chip"}
            key={card.id}
            type="button"
            onClick={() => goToCard(index)}
          >
            {getPrimaryExpression(card, displayMode)}
          </button>
        ))}
      </div>
    </section>
  );
}

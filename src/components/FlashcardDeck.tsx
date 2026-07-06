import { useEffect, useMemo, useRef, useState } from "react";

import type { Card } from "@/types/card";
import { calculateNextReview } from "@/utils/reviewAlgorithm";

import { distance } from "fastest-levenshtein";
import jaroWinkler from "jaro-winkler";

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

function getClozeParts(card: Card) {
  const example = card.examples[0];

  if (!example) {
    return { before: "", after: "" };
  }

  const [before, after] = example.sentence.split(example.target);

  return { before, after };
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
  const primaryExpression = getPrimaryExpression(card, displayMode);
  const secondaryExpression = getSecondaryExpression(card, displayMode);

  if (mode === "pronunciationToMeaning") {
    return {
      mode,
      label: "표현 -> 뜻",
      prompt: primaryExpression,
      answer: card.meaning,
      answerSecondary: secondaryExpression,
      helper: "표현 단서를 보고 뜻을 떠올려보세요.",
    };
  }

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

  if (mode === "cloze") {
    return {
      mode,
      label: "예문 빈칸",
      prompt: card.examples[0]?.translation ?? "",
      answer: card.examples[0]?.sentence ?? "",
      answerSecondary: card.word,
      helper: "빈칸에 들어갈 단어를 떠올려보세요.",
    };
  }

  return {
    mode,
    label: "표현 -> 뜻",
    prompt: primaryExpression,
    answer: card.meaning,
    answerSecondary: secondaryExpression,
    helper: "표현 단서를 보고 뜻을 떠올려보세요.",
  };
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
  const [isCycleCompleteOpen, setIsCycleCompleteOpen] = useState(false);

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
  const isLastCard = activeIndex === studyCards.length - 1;
  const cloze = getClozeParts(activeCard);
  const [clozeAnswer, setClozeAnswer] = useState("");
  const [clozeInputWidth, setClozeInputWidth] = useState(32);
  const [shownOnce, setShownOnce] = useState(false);
  const [clozeFeedback, setClozeFeedback] = useState("");

  const currentExample = useMemo(() => {
    const examples = activeCard?.examples || null;

    if (!examples || examples.length === 0) {
      return null;
    }

    return examples[Math.round(Math.random() * (examples.length - 1))];
  }, [activeCard]);

  const submitClozeAnswer = () => {
    setIsAnswerVisible((current) => !current);

    const normalize = (text: string) => {
      return text.trim().toLowerCase().normalize("NFC");
    };
    const target_answer = currentExample?.target ?? activeCard.word;

    const answer = normalize(clozeAnswer);
    const target = normalize(target_answer);

    const d = distance(answer, target);
    const j = jaroWinkler(answer, target);

    if (d == 0) {
      setClozeFeedback(`✅ 정답입니다! "${target_answer}"입니다.`);
    } else if (d <= 2 && j >= 0.92) {
      setClozeFeedback(
        `⚠️ 거의 맞았습니다! ("${answer}" -> "${target_answer}") 철자를 한 번 확인해 보세요.`,
      );
    } else {
      setClozeFeedback(`❌ 틀렸습니다. "${target_answer}"입니다.`);
    }

    setClozeAnswer("");
    setClozeInputWidth(32);
    setShownOnce(true);
  };

  const clozeAnswerRuler = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setClozeInputWidth(
      Math.max((clozeAnswerRuler.current?.offsetWidth ?? 0) + 32, 32),
    );
  }, [clozeAnswer]);

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

  const goToNext = () => {
    if (isLastCard) {
      setIsCycleCompleteOpen(true);
      return;
    }

    goToCard(activeIndex + 1);
  };

  const continueStudying = () => {
    setIsCycleCompleteOpen(false);
    goToCard(0);
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

    if (isLastCard) {
      setIsCycleCompleteOpen(true);
      return;
    }

    setShownOnce(false);

    goToNext();
  };

  return (
    <section className="flashcard-section" aria-label="Flashcard deck">
      <div className="deck-header">
        <div>
          <button className="text-button" type="button" onClick={onBackToDecks}>
            돌아가기
          </button>
          <h2>{title}</h2>
        </div>
        <div className="deck-tools">
          <div className="segmented-control" aria-label="Display mode">
            <button
              className={displayMode === "wordFirst" ? "active" : ""}
              type="button"
              onClick={() => setDisplayMode("wordFirst")}
            >
              단어 (한자)
            </button>
            <button
              className={displayMode === "pronunciationFirst" ? "active" : ""}
              type="button"
              onClick={() => setDisplayMode("pronunciationFirst")}
            >
              발음 (히라가나)
            </button>
          </div>
          <p className="progress-pill">{progress}</p>
        </div>
      </div>

      <button
        className="flashcard"
        type="button"
        onClick={() => {
          setIsAnswerVisible((current) => {
            if (quiz?.mode !== "cloze") {
              setShownOnce(true);
              return !current;
            }
            return current;
          });
        }}
      >
        <span className="card-label">{quiz?.label}</span>
        {!isAnswerVisible ? (
          <span className="card-face">
            <span className={quiz?.mode === "cloze" ? "example" : "word"}>
              {quiz?.prompt}
            </span>

            {quiz?.mode === "cloze" && (
              <span>
                <span className="cloze-before">{cloze.before}</span>
                <span
                  className="cloze-ruler"
                  style={{
                    visibility: "hidden",
                    position: "absolute",
                    whiteSpace: "pre",
                  }}
                  ref={clozeAnswerRuler}
                >
                  {clozeAnswer}
                </span>

                <input
                  className="cloze-input"
                  value={clozeAnswer}
                  style={{ width: clozeInputWidth }}
                  onChange={(e) => setClozeAnswer(e.target.value)}
                />

                <span className="cloze-after">{cloze.after}</span>
              </span>
            )}

            {/* For height alignment */}
            <span
              className="emergence-count"
              style={{
                visibility: quiz?.mode !== "cloze" ? "visible" : "hidden",
              }}
            >
              {activeCard.review.reviewCount}번째 등장한 단어예요
            </span>
            <span className="example" style={{ visibility: "hidden" }}>
              .
            </span>

            {quiz?.mode === "cloze" ? (
              <span>
                <button
                  className="submit-button"
                  onClick={() => submitClozeAnswer()}
                >
                  여기를 눌러 제출
                </button>
              </span>
            ) : (
              <span className="hint">카드를 눌러 정답 보기</span>
            )}
          </span>
        ) : (
          <span className="card-face">
            {quiz?.mode === "cloze" ? (
              <>
                <span>{clozeFeedback}</span>
                <span className="example">{quiz?.answer}</span>
              </>
            ) : (
              <>
                <span className="meaning">{quiz?.answer}</span>

                <span className="answer-secondary">
                  {quiz?.answerSecondary ? quiz.answerSecondary : ""}
                </span>

                <span className="example">{currentExample?.sentence}</span>
              </>
            )}

            <span className="translation">{currentExample?.translation}</span>
          </span>
        )}
      </button>

      <div className="review-actions">
        <button
          className="review-button dont-know"
          type="button"
          onClick={() => recordReview(false)}
        >
          몰라요
        </button>
        {shownOnce ? (
          <button
            className="review-button know"
            type="button"
            onClick={() => recordReview(true)}
          >
            알아요
          </button>
        ) : (
          <button className="review-button disabled" type="button"></button>
        )}
      </div>

      {isCycleCompleteOpen ? (
        <div className="cycle-complete-overlay" role="presentation">
          <section
            className="cycle-complete-dialog"
            aria-labelledby="cycle-complete-title"
            aria-modal="true"
            role="dialog"
          >
            <p className="eyebrow">한 바퀴 완료</p>
            <h2 id="cycle-complete-title">이 카드 묶음을 계속 공부할까요?</h2>
            <p>
              모든 카드를 한 번씩 봤습니다. 바로 한 바퀴 더 돌리거나, 메인으로
              돌아갈 수 있습니다.
            </p>
            <div className="cycle-complete-actions">
              <button type="button" onClick={continueStudying}>
                계속 학습하기
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={onBackToDecks}
              >
                메인으로
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { cardToReviewDocument, type Card } from "@/types/card";
import { calculateNextReview, TRAINING_N } from "@/utils/reviewAlgorithm";

import { evaluateAnswer } from "@/utils/similarity";
import type { DeckInfo, DeckIndex, CardData } from "@/types/deck";
import { getDeckCardsByIdx, travelDeckCards } from "@/services/deckService";
import type { ReviewData, ReviewDocument } from "@/types/review";

interface FlashcardDeckProps {
  deckInfo: DeckInfo;
  reviews: ReviewDocument[];
  title: string;
  updateFlag: boolean;
  setUpdateFlag: (flag: boolean) => void;
  onBackToDecks: () => void;
  onReviewCard: (review: ReviewDocument) => Promise<void>;
  deckIndex: DeckIndex | null;
}

type QuizMode = "pronunciationToMeaning" | "meaningToPronunciation" | "cloze";
type DisplayMode = "wordFirst" | "pronunciationFirst";

interface QuizPrompt {
  mode: QuizMode | null;
  label: string;
  prompt: string;
  promptSecondary?: string;
  answer: string;
  answerSecondary?: string;
  helper: string;
}

const quizModes: QuizMode[] = [
  "pronunciationToMeaning",
  "meaningToPronunciation",
  "cloze",
];

function getClozeParts(card: Card | null) {
  const example = card?.examples[0];

  if (!example) {
    return { before: "", after: "" };
  }

  const [before, after] = example.sentence.split(example.target);

  return { before, after };
}

function getPrimaryExpression(
  card: Card | null,
  displayMode: DisplayMode,
): string {
  return displayMode === "pronunciationFirst"
    ? (card?.pronunciation ?? "")
    : (card?.word ?? "");
}

function getSecondaryExpression(
  card: Card | null,
  displayMode: DisplayMode,
): string {
  return displayMode === "pronunciationFirst"
    ? (card?.word ?? "")
    : (card?.pronunciation ?? "");
}

function createQuizPrompt(
  card: Card | null,
  mode: QuizMode | null,
  displayMode: DisplayMode,
): QuizPrompt {
  const primaryExpression = getPrimaryExpression(card, displayMode);
  const secondaryExpression = getSecondaryExpression(card, displayMode);

  if (mode === "pronunciationToMeaning") {
    return {
      mode,
      label: "표현 -> 뜻",
      prompt: primaryExpression,
      answer: card?.meaning ?? "",
      answerSecondary: secondaryExpression,
      helper: "표현 단서를 보고 뜻을 떠올려보세요.",
    };
  }

  if (mode === "meaningToPronunciation") {
    return {
      mode,
      label: "뜻 -> 표현",
      prompt: card?.meaning ?? "",
      answer: primaryExpression,
      answerSecondary: secondaryExpression,
      helper: "이 뜻에 해당하는 표현을 떠올려보세요.",
    };
  }

  if (mode === "cloze") {
    return {
      mode,
      label: "예문 빈칸",
      prompt: card?.examples[0]?.translation ?? "",
      answer: card?.examples[0]?.sentence ?? "",
      answerSecondary: card?.word ?? "",
      helper: "빈칸에 들어갈 단어를 떠올려보세요.",
    };
  }

  return {
    mode,
    label: "",
    prompt: "",
    answer: "",
    answerSecondary: "",
    helper: "",
  };
}

const EXPLORE_N = 15;
const REVIEW_N = 10;

export function FlashcardDeck({
  deckInfo,
  reviews,
  title,
  updateFlag,
  setUpdateFlag,
  onBackToDecks,
  onReviewCard,
  deckIndex,
}: FlashcardDeckProps) {
  const [studyCards, setStudyCards] = useState<Card[]>([]);
  const [reviewCards, setReviewCards] = useState<Card[]>([]);
  const [leftReview, setLeftReview] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const cardCache = useRef(new Map<string, CardData>());

  useEffect(() => {
    cardCache.current.clear();
  }, [deckInfo?.id]);

  useEffect(() => {
    if (!deckInfo || !updateFlag) {
      return;
    }
    setUpdateFlag(false);
    setLoading(true);

    async function fetchCards(deckInfo: DeckInfo, deckIndex: DeckIndex | null) {
      const [rangeCardsData, reviewCardsData] = await Promise.all([
        travelDeckCards(deckInfo.id, deckIndex, EXPLORE_N),
        getDeckCardsByIdx(
          deckInfo.id,
          reviews
            ?.filter((r) => r.review.due < Date.now())
            .map((r) => r.cardId),
          cardCache.current,
        ),
      ]);

      function randomPick<T>(arr: T[], n: number): T[] {
        const shuffled = [...arr].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, n);
      }

      const reviewCardsDataLimited = randomPick(reviewCardsData, REVIEW_N);
      const reviewCards = reviewCardsDataLimited.map<Card>((card) => ({
        ...card,
        review: reviews?.find((r) => r.cardId === card.id)?.review ?? {
          level: 0,
          due: Date.now(),
          recoveryLevel: null,
        },
      }));
      const rangeCards = rangeCardsData.map<Card>((card) => ({
        ...card,
        review: reviews?.find((r) => r.cardId === card.id)?.review ?? {
          level: 0,
          due: Date.now(),
          recoveryLevel: null,
        },
      }));

      setStudyCards([...rangeCards, ...reviewCards]);
      setLoading(false);
    }

    void fetchCards(deckInfo, deckIndex);
  }, [deckInfo, deckIndex, reviews, updateFlag]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("wordFirst");
  const [isCycleCompleteOpen, setIsCycleCompleteOpen] = useState(false);

  const isEndCards = activeIndex === studyCards.length;
  const isLastCard = isEndCards || activeIndex === studyCards.length - 1;
  const isEndReviewCards = reviewIndex === reviewCards.length;
  const isLastReviewCards =
    isEndReviewCards || reviewIndex === reviewCards.length - 1;
  const noReviewCards = reviewCards.length === 0 && leftReview.length === 0;

  const activeCard = useMemo(() => {
    if (!studyCards || studyCards.length === 0) {
      return null;
    }
    if (!isEndCards) {
      return studyCards[activeIndex];
    }
    if (isEndCards && !noReviewCards) {
      return reviewCards[reviewIndex];
    }

    return null;
  }, [studyCards, activeIndex, reviewCards, reviewIndex]);

  const getQuizMode = (review: ReviewData | null) => {
    if (!review) return null;

    let prob_weight = [0, 0, 0];

    if (review.level < 1) {
      return quizModes[0] as QuizMode;
    }

    prob_weight[0] = 1;

    if (review.level >= 1) {
      prob_weight[1] = 1;
    }
    if (review.level > TRAINING_N) {
      prob_weight[2] = review.level / TRAINING_N;
    }

    const total_weight = prob_weight.reduce((a, b) => a + b, 0);

    const rand = Math.random() * total_weight;
    let cumulative_weight = 0;

    for (let i = 0; i < prob_weight.length; i++) {
      cumulative_weight += prob_weight[i];
      if (rand < cumulative_weight) {
        return quizModes[i] as QuizMode;
      }
    }

    return quizModes[0] as QuizMode;
  };

  const quizMode = useMemo(
    () => getQuizMode(activeCard?.review ?? null),
    [activeCard],
  );

  const quiz = useMemo(
    () =>
      activeCard ? createQuizPrompt(activeCard, quizMode, displayMode) : null,
    [activeCard, displayMode, quizMode],
  );
  const progress = useMemo(() => {
    if (isEndCards && !noReviewCards) {
      return `${reviewIndex + 1} / ${reviewCards.length} [복습]`;
    }
    return `${activeIndex + 1} / ${studyCards.length} [학습]`;
  }, [
    activeIndex,
    studyCards.length,
    isEndCards,
    noReviewCards,
    reviewIndex,
    reviewCards.length,
  ]);

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

    const target = currentExample?.target ?? "";
    const acceptedTargets = (currentExample?.acceptedTargets ?? []).concat([
      target,
    ]);

    const ev = evaluateAnswer(clozeAnswer, acceptedTargets);

    if (ev.grade === "correct") {
      setClozeFeedback(`✅ 정답입니다! "${target}"입니다.`);
    } else if (ev.grade === "typo") {
      setClozeFeedback(
        `⚠️ 거의 맞았습니다! ("${clozeAnswer}" -> "${target}") 철자를 한 번 확인해 보세요.`,
      );
    } else {
      setClozeFeedback(`❌ 틀렸습니다. "${target}"입니다.`);
    }

    setClozeAnswer("");
    setClozeInputWidth(32);
    setShownOnce(true);
  };

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useLayoutEffect(() => {
    if (!inputRef.current) return;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const style = getComputedStyle(inputRef.current);

    ctx.font = `
      ${style.fontWeight}
      ${style.fontSize}
      ${style.fontFamily}
    `;

    const width = ctx.measureText(clozeAnswer || " ").width;

    setClozeInputWidth(Math.max(width + 24, 32));
  }, [clozeAnswer]);

  const goToCard = (nextIndex: number) => {
    setActiveIndex(nextIndex);
    setIsAnswerVisible(false);
    setShownOnce(false);
  };
  const goToReviewCard = (nextIndex: number) => {
    setReviewIndex(nextIndex);
    setIsAnswerVisible(false);
    setShownOnce(false);
  };

  const continueStudying = () => {
    setIsCycleCompleteOpen(false);
    goToCard(0);
    setUpdateFlag(true);
    setShownOnce(false);
  };

  const judge = useCallback(
    (isCorrect: boolean) => {
      if (!activeCard) return;

      const reviewedActiveCard = {
        ...activeCard,
        review: calculateNextReview(activeCard.review, isCorrect),
      };

      onReviewCard(cardToReviewDocument(reviewedActiveCard)).then(() => {
        setStudyCards((currentCards) =>
          currentCards.map((card, index) =>
            index === activeIndex ? reviewedActiveCard : card,
          ),
        );

        if (!isCorrect && !isEndCards) {
          // append or replace the card in the reviewCards list

          setReviewCards((currentCards) => {
            const index = currentCards.findIndex(
              (card) => card.id === reviewedActiveCard.id,
            );

            if (index === -1) {
              return [...currentCards, reviewedActiveCard];
            }

            const next = [...currentCards];
            next[index] = reviewedActiveCard;
            return next;
          });
        } else if (!isCorrect && isEndCards) {
          // add to leftReview
          leftReview.push(reviewedActiveCard);
          setLeftReview([...leftReview]);
        }

        if (isLastCard && isLastReviewCards && noReviewCards) {
          setIsCycleCompleteOpen(true);
          return;
        }

        if (!isEndCards) {
          goToCard(activeIndex + 1);
        } else if (isLastCard && !isEndCards) {
          // make isEndCards true and go to the first review card
          goToCard(activeIndex + 1);
          goToReviewCard(0);
        } else if (!isLastReviewCards) {
          goToReviewCard(reviewIndex + 1);
        } else if (leftReview.length > 0) {
          setReviewCards([...leftReview]);
          setLeftReview([]);
          goToReviewCard(0);
        } else {
          setIsCycleCompleteOpen(true);
          return;
        }
        // goToNext();
      });
    },
    [
      activeIndex,
      activeCard,
      isLastCard,
      updateFlag,
      onReviewCard,
      isEndCards,
      isLastReviewCards,
      noReviewCards,
      reviewIndex,
      leftReview,
    ],
  );

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

      <div
        className="flashcard"
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
                <input
                  className="cloze-input"
                  ref={inputRef}
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
              {activeCard && (
                <span>{activeCard.review.level} 정도로 익숙한 단어예요</span>
              )}
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
      </div>

      <div className="review-actions">
        <button
          className="review-button dont-know"
          type="button"
          onClick={() => judge(false)}
        >
          몰라요
        </button>
        {shownOnce ? (
          <button
            className="review-button know"
            type="button"
            onClick={() => judge(true)}
          >
            알아요
          </button>
        ) : (
          <button className="review-button disabled" type="button"></button>
        )}
      </div>

      {loading ? (
        <div className="loading-overlay" role="presentation">
          <section
            className="cycle-complete-dialog"
            aria-labelledby="cycle-complete-title"
            aria-modal="true"
            role="dialog"
          >
            <p>카드 로딩중</p>
            <h2>잠시만 기다려주세요</h2>
          </section>
        </div>
      ) : null}

      {isCycleCompleteOpen ? (
        <div className="cycle-complete-overlay" role="presentation">
          <section
            className="cycle-complete-dialog"
            aria-labelledby="cycle-complete-title"
            aria-modal="true"
            role="dialog"
          >
            <p className="eyebrow">한 바퀴 완료</p>
            <h2 id="cycle-complete-title">이 카드 묶음을 계속 진행할까요?</h2>
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

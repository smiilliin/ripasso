import { distance as levenshteinDistance } from "fastest-levenshtein";
import jaroWinkler from "jaro-winkler";

import { normalize } from "@/utils/normalize";

export type AnswerGrade = "correct" | "typo" | "wrong";

export interface AnswerEvaluation {
  grade: AnswerGrade;
  distance: number;
  similarity: number;
}

export interface EvaluateAnswerOptions {
  maxTypoDistance?: number;
  minTypoSimilarity?: number;
}

const DEFAULT_MAX_TYPO_DISTANCE = 1;
const DEFAULT_MIN_TYPO_SIMILARITY = 0.88;

export function evaluateSingleAnswer(
  expected: string,
  actual: string,
  options: EvaluateAnswerOptions = {},
): AnswerEvaluation {
  const normalizedExpected = normalize(expected);
  const normalizedActual = normalize(actual);
  const distance = levenshteinDistance(normalizedExpected, normalizedActual);
  const similarity = jaroWinkler(normalizedExpected, normalizedActual);

  if (distance === 0) {
    return { grade: "correct", distance, similarity };
  }

  const maxTypoDistance = options.maxTypoDistance ?? DEFAULT_MAX_TYPO_DISTANCE;
  const minTypoSimilarity =
    options.minTypoSimilarity ?? DEFAULT_MIN_TYPO_SIMILARITY;

  if (distance <= maxTypoDistance && similarity >= minTypoSimilarity) {
    return { grade: "typo", distance, similarity };
  }

  return { grade: "wrong", distance, similarity };
}
export function evaluateAnswer(
  answer: string,
  acceptedTargets: string[],
): AnswerEvaluation {
  let best: AnswerEvaluation | null = null;

  for (const target of acceptedTargets) {
    const result = evaluateSingleAnswer(answer, target);

    if (result.grade === "correct") {
      return result;
    }

    if (!best || (best.grade === "wrong" && result.grade === "typo")) {
      best = result;
    }
  }

  return best!;
}

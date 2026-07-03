import { updateCard } from "@/services/cardService";
import type { Card } from "@/types/card";
import { calculateNextReview } from "@/utils/reviewAlgorithm";

export async function saveReviewResult(
  userId: string,
  deckId: string,
  card: Card,
  isCorrect: boolean,
): Promise<Card> {
  const review = calculateNextReview(card.review, isCorrect);
  const updatedCard = {
    ...card,
    review,
  };

  await updateCard(userId, deckId, card.id, { review });

  return updatedCard;
}

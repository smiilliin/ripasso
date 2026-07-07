export interface ReviewData {
  due: number;
  level: number;
  recoveryLevel: number | null;
}

export interface ReviewDocument {
  cardId: string;
  review: ReviewData;
}

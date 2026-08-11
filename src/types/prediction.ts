export type CreatePredictionRequest = {
  initData: string;
  fightId: string;
  selectedFighter: "A" | "B";
  amount: number;
};
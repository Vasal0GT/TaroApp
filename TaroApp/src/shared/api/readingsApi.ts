import { apiRequest } from "./apiClient";

export type TarotSpreadSize = 1 | 3 | 5 | 7 | 10;

export type SelectedTarotCard = {
  id: number;
  name: string;
  isReversed: boolean;
  position: string;
  meaning: string;
};

export type TarotReadingResultCard = {
  id: number;
  role: string;
  name: string;
  position: string;
  isReversed: boolean;
  meaning: string;
};

export type TarotReadingResult = {
  title: string;
  shortAnswer: string;
  tags: string[];
  generalConclusion: string;
  cardAdvice: string;
  attention: string;
  clarificationQuestions: string[];
  cards: TarotReadingResultCard[];
};

export type ReadingStatus = "Queued" | "Processing" | "Completed" | "Failed";

export type ReadingResponse = {
  id: string;
  spreadSize: TarotSpreadSize;
  topic: string | null;
  question: string;
  status: ReadingStatus;
  cards: SelectedTarotCard[];
  result: TarotReadingResult | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
};

export async function createReadingRequest(input: {
  spreadSize: TarotSpreadSize;
  topic?: string;
  question: string;
  cards: SelectedTarotCard[];
}) {
  return apiRequest<ReadingResponse>("/api/readings", {
    method: "POST",
    auth: true,
    body: input,
  });
}

export async function getReadingRequest(id: string) {
  return apiRequest<ReadingResponse>(`/api/readings/${id}`, {
    method: "GET",
    auth: true,
  });
}
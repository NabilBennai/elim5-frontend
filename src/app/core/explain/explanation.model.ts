export type ExplanationLevel = 'ELI5' | 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';

export interface Explanation {
  id: string;
  topic: string;
  level: ExplanationLevel;
  answer: string;
  shareId?: string | null;
  sources: Array<{
    id: string;
    citationIndex: number;
    sourceUrl: string;
    sourceType: string;
    snippet: string;
  }>;
  createdAt: string;
}

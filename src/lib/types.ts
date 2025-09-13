import { PlainLanguageSummarizationOutput } from "@/ai/flows/plain-language-summary";
import { KeyEntityRecognitionOutput } from "@/ai/flows/key-entity-recognition";
import { RiskFlaggingOutput } from "@/ai/flows/risk-flagging";

export interface DocumentData {
  id: string;
  userId: string;
  fileName: string;
  documentText: string;
  analysis: {
    summary: PlainLanguageSummarizationOutput;
    entities: KeyEntityRecognitionOutput;
    risks: RiskFlaggingOutput;
  };
  createdAt: any;
}

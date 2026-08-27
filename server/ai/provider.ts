import { analyzeWithGroq, type BusinessAnalysisInput, type BusinessAnalysisResponse } from "./groq";

export interface BusinessAiProvider {
  readonly id: string;
  analyze(input: BusinessAnalysisInput): Promise<BusinessAnalysisResponse>;
}

export class GroqBusinessAiProvider implements BusinessAiProvider {
  readonly id = "groq";
  analyze(input: BusinessAnalysisInput) {
    return analyzeWithGroq(input);
  }
}

export function getBusinessAiProvider(): BusinessAiProvider {
  return new GroqBusinessAiProvider();
}

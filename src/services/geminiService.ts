import { OCRResult, Vocabulary, GrammarPoint, GrammarQuizQuestion } from "../types";

/**
 * Client-side Gemini service that calls the backend /api/gemini proxy.
 * This ensures the GEMINI_API_KEY is stored securely on the server (e.g. Vercel Environment Variables or Cloud Run)
 * and is NEVER exposed to the browser or other users.
 */
async function callGeminiApi<T>(action: string, payload: any = {}): Promise<T> {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ action, payload })
  });

  if (!response.ok) {
    let errorDetail = "";
    try {
      const errJson = await response.json();
      errorDetail = errJson.error || errJson.message || "";
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(errorDetail || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export const geminiService = {
  async performOCR(base64Image: string): Promise<OCRResult> {
    return callGeminiApi<OCRResult>("performOCR", { base64Image });
  },

  async extractVocabularyFromText(text: string): Promise<Vocabulary[]> {
    return callGeminiApi<Vocabulary[]>("extractVocabularyFromText", { text });
  },

  async enrichVocabulary(word: string): Promise<Partial<Vocabulary>> {
    return callGeminiApi<Partial<Vocabulary>>("enrichVocabulary", { word });
  },

  async analyzeGrammar(text: string): Promise<GrammarPoint[]> {
    return callGeminiApi<GrammarPoint[]>("analyzeGrammar", { text });
  },

  async performGrammarOCR(base64Image: string): Promise<GrammarPoint[]> {
    return callGeminiApi<GrammarPoint[]>("performGrammarOCR", { base64Image });
  },

  async generateGrammarQuiz(points: GrammarPoint[]): Promise<GrammarQuizQuestion[]> {
    return callGeminiApi<GrammarQuizQuestion[]>("generateGrammarQuiz", { points });
  },

  async evaluateSpeech(
    base64Audio: string,
    targetVietnamese: string
  ): Promise<{ score: number; feedback: string; recognizedText: string }> {
    return callGeminiApi<{ score: number; feedback: string; recognizedText: string }>("evaluateSpeech", {
      base64Audio,
      targetVietnamese
    });
  },

  async getRelatedWords(
    word: string,
    existingVocab: string[] = []
  ): Promise<{
    related: { chinese: string; pinyin: string; meaning: string; reason: string; hanViet: string }[];
    antonyms: { chinese: string; pinyin: string; meaning: string; hanViet: string }[];
    characterAnalysis: {
      char: string;
      meaning: string;
      examples: { chinese: string; pinyin: string; meaning: string; hanViet: string }[];
    }[];
  }> {
    return callGeminiApi("getRelatedWords", { word, existingVocab });
  },

  async sendChatMessage(
    messages: { role: "user" | "model"; text: string }[],
    targetLang: "vi" | "zh" | "en"
  ): Promise<{
    userMessage: { text: string; pinyin?: string; meaning?: string };
    modelResponse: { text: string; pinyin?: string; meaning?: string };
  }> {
    return callGeminiApi("sendChatMessage", { messages, targetLang });
  },

  async setSharedApiKey(apiKey: string): Promise<{ configured: boolean; maskedKey: string }> {
    return callGeminiApi("setSharedApiKey", { apiKey });
  },

  async checkApiKeyStatus(): Promise<{ configured: boolean; maskedKey: string }> {
    return callGeminiApi("checkApiKeyStatus", {});
  },

  async testApiKey(): Promise<{ success: boolean; message: string }> {
    return callGeminiApi("testApiKey", {});
  }
};

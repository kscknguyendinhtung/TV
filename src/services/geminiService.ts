import { GoogleGenAI } from "@google/genai";
import { OCRResult, Vocabulary, GrammarPoint, GrammarQuizQuestion, ReadingSentence } from "../types";

export const getGeminiApiKey = (): string => {
  // 1. Check user-defined key stored in localStorage (works in any deployment, e.g. Vercel, custom domain)
  if (typeof window !== "undefined") {
    const customKey = localStorage.getItem("tiengtrungAI_gemini_key");
    if (customKey && customKey.trim()) {
      return customKey.trim();
    }
  }

  // 2. Check import.meta.env (Vite client-side environment)
  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv) {
      if (metaEnv.VITE_GEMINI_API_KEY) return metaEnv.VITE_GEMINI_API_KEY;
      if (metaEnv.VITE_API_KEY) return metaEnv.VITE_API_KEY;
      if (metaEnv.GEMINI_API_KEY) return metaEnv.GEMINI_API_KEY;
    }
  } catch (e) {
    // Ignore error in non-meta environments
  }

  // 3. Check process.env (safely with polyfilled / bundled values)
  try {
    if (typeof process !== "undefined" && process.env) {
      if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
      if (process.env.API_KEY) return process.env.API_KEY;
      if (process.env.VITE_GEMINI_API_KEY) return process.env.VITE_GEMINI_API_KEY;
    }
  } catch (e) {
    // Ignore error
  }

  return "";
};

const getAI = () => {
  const apiKey = getGeminiApiKey();
  return new GoogleGenAI({ 
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
};

/**
 * Safely extracts and parses JSON from Gemini responses, handling markdown codeblocks,
 * leading/trailing explanations, or slight formatting variations.
 */
export const cleanAndParseJSON = <T = any>(rawText?: string, fallback: any = {}): T => {
  if (!rawText || typeof rawText !== "string") return fallback;

  let cleaned = rawText.trim();
  
  // Remove markdown code fences ```json ... ``` or ``` ... ```
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (e) {
    // Attempt to extract the first balanced JSON object {...} or array [...]
    const firstBrace = cleaned.indexOf("{");
    const firstBracket = cleaned.indexOf("[");

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      const lastBrace = cleaned.lastIndexOf("}");
      if (lastBrace > firstBrace) {
        try {
          const substr = cleaned.slice(firstBrace, lastBrace + 1);
          return JSON.parse(substr) as T;
        } catch {}
      }
    } else if (firstBracket !== -1) {
      const lastBracket = cleaned.lastIndexOf("]");
      if (lastBracket > firstBracket) {
        try {
          const substr = cleaned.slice(firstBracket, lastBracket + 1);
          return JSON.parse(substr) as T;
        } catch {}
      }
    }

    console.warn("Could not parse JSON from Gemini response:", rawText);
    return fallback;
  }
};

/**
 * Extracts raw base64 data and mimeType safely from data URI strings or pure base64.
 */
const parseImageData = (base64Image: string): { data: string; mimeType: string } => {
  let mimeType = "image/jpeg";
  let data = base64Image;

  if (base64Image.includes(",")) {
    const parts = base64Image.split(",");
    data = parts[1];
    const header = parts[0];
    const match = header.match(/data:([^;]+);/);
    if (match && match[1]) {
      mimeType = match[1];
    }
  }

  return { data, mimeType };
};

export const geminiService = {
  async testApiKey(keyToTest?: string): Promise<{ success: boolean; message: string }> {
    try {
      const apiKey = keyToTest || getGeminiApiKey();
      if (!apiKey) {
        return { success: false, message: "Chưa có Gemini API Key" };
      }
      const ai = new GoogleGenAI({ apiKey });
      const res = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: "Hello, reply with 1 word: OK"
      });
      if (res.text && res.text.length > 0) {
        return { success: true, message: "Kết nối Gemini API thành công!" };
      }
      return { success: false, message: "Không nhận được phản hồi từ AI" };
    } catch (error: any) {
      console.error("Gemini Test Error:", error);
      return { success: false, message: error?.message || "Lỗi xác thực API Key" };
    }
  },

  async performOCR(base64Image: string): Promise<OCRResult> {
    const ai = getAI();
    const model = "gemini-3.7-flash";
    const { data, mimeType } = parseImageData(base64Image);

    const prompt = `
      Analyze this image containing Vietnamese text or bilingual Vietnamese study materials.
      Tasks:
      1. Extract all Vietnamese text (OCR).
      2. Split the text into meaningful sentences for learners.
      3. For each sentence, break it down into meaningful compound words (từ ghép tiếng Việt) and single words where appropriate (e.g., 'học tập', 'phát triển', 'thời gian', 'xin chào', 'cảm ơn', 'hợp tác').
      4. For each sentence:
         - 'chinese': The full Vietnamese sentence.
         - 'pinyin': Pronunciation / tone guide for the sentence.
         - 'meaning': Vietnamese & English meaning of the full sentence.
      5. For each word in each sentence's 'words' array:
         - 'char': The Vietnamese word/compound phrase (e.g. 'học tập').
         - 'englishMeaning': Short, precise English translation (e.g. 'study, learn').
         - 'chineseMeaning': Chinese translation and pinyin (e.g. '学习 (xuéxí)').
         - 'pinyin': Chinese pinyin or tone guide (e.g. 'xuéxí').
         - 'amBoi': Vietnamese tone description or phonetic aid.
         - 'meaning': Combined English / Chinese meaning.
      6. Extract an EXHAUSTIVE list of all unique Vietnamese vocabulary items found in the text with full properties.
      
      Return JSON ONLY with this structure:
      {
        "originalText": "string",
        "sentences": [
          {
            "chinese": "string",
            "pinyin": "string",
            "meaning": "string",
            "words": [
              {
                "char": "string",
                "englishMeaning": "string",
                "chineseMeaning": "string",
                "pinyin": "string",
                "amBoi": "string",
                "meaning": "string"
              }
            ]
          }
        ],
        "words": [
          {
            "chinese": "string",
            "pinyin": "string",
            "amBoi": "string",
            "meaning": "string",
            "hanViet": "string",
            "wordType": "string",
            "topic": "string"
          }
        ]
      }
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            parts: [
              { inlineData: { data, mimeType } },
              { text: prompt }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const result = cleanAndParseJSON<OCRResult>(response.text, { originalText: "", sentences: [], words: [] });
      
      // Ensure all word objects have required fields
      if (result.words && Array.isArray(result.words)) {
        result.words = result.words.map(w => ({
          ...w,
          isMastered: false,
          topic: w.topic || "Chung",
          wordType: w.wordType || "Chưa phân loại"
        }));
      }

      if (result.sentences && Array.isArray(result.sentences)) {
        result.sentences = result.sentences.map(s => ({
          ...s,
          isMastered: false,
          words: Array.isArray(s.words) ? s.words.map(w => ({
            ...w,
            englishMeaning: w.englishMeaning || w.meaning || "",
            chineseMeaning: w.chineseMeaning || w.pinyin || "",
            pinyin: w.pinyin || "",
            amBoi: w.amBoi || ""
          })) : []
        }));
      }

      return result;
    } catch (error) {
      console.error("Gemini OCR Error:", error);
      throw error;
    }
  },

  async extractVocabularyFromText(text: string): Promise<Vocabulary[]> {
    const ai = getAI();
    const model = "gemini-3.7-flash";
    const prompt = `
      Phân tích đoạn văn tiếng Việt sau và trích xuất danh sách từ vựng quan trọng để học tiếng Việt: "${text}".
      
      Yêu cầu:
      1. Trích xuất TẤT CẢ các từ vựng tiếng Việt có nghĩa (từ đơn và từ ghép).
      2. Với mỗi từ, cung cấp đầy đủ:
         - chinese: Từ/cụm từ tiếng Việt gốc.
         - pinyin: Phiên âm/Cách phát âm/Thanh điệu cho người học.
         - amBoi: Hướng dẫn phát âm / Thanh điệu.
         - meaning: Nghĩa tiếng Anh và tiếng Trung.
         - hanViet: Gốc Hán Việt hoặc chữ Hán tương ứng (nếu có).
         - wordType: Loại từ (Danh từ, Động từ, Tính từ, Trạng từ, Liên từ, Trợ từ...).
         - topic: Chủ đề (Giao tiếp, Đời sống, Kinh doanh, Công nghệ...).
      3. KHÔNG ĐƯỢC để trống bất kỳ trường nào.
      
      Trả về JSON array các đối tượng Vocabulary:
      [
        {
          "chinese": "string",
          "pinyin": "string",
          "amBoi": "string",
          "meaning": "string",
          "hanViet": "string",
          "wordType": "string",
          "topic": "string"
        }
      ]
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const words = cleanAndParseJSON<Vocabulary[]>(response.text, []);
      return words.map(w => ({ ...w, isMastered: false }));
    } catch (error) {
      console.error("Gemini Text Extraction Error:", error);
      return [];
    }
  },

  async enrichVocabulary(word: string): Promise<Partial<Vocabulary>> {
    const ai = getAI();
    const model = "gemini-3.7-flash";
    const prompt = `
      Phân tích chi tiết từ vựng tiếng Việt: "${word}".
      Yêu cầu: Cung cấp đầy đủ phát âm (pinyin), hướng dẫn thanh điệu/âm điệu (amBoi), nghĩa bằng tiếng Anh và tiếng Trung (meaning), gốc Hán Việt nếu có (hanViet), chủ đề (topic), loại từ (wordType).
      KHÔNG ĐƯỢC để trống bất kỳ trường nào. Hãy cung cấp thông tin chính xác và hữu ích cho người học tiếng Việt.
      
      Return JSON:
      {
        "chinese": "${word}",
        "pinyin": "string",
        "amBoi": "string",
        "meaning": "string",
        "hanViet": "string",
        "wordType": "string",
        "topic": "string"
      }
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const data = cleanAndParseJSON<Partial<Vocabulary>>(response.text, {});
      return {
        ...data,
        chinese: word,
        isMastered: false
      };
    } catch (error) {
      console.error("Gemini Enrich Error:", error);
      return { chinese: word, isMastered: false };
    }
  },

  async analyzeGrammar(text: string): Promise<GrammarPoint[]> {
    const ai = getAI();
    const model = "gemini-3.7-flash";
    const prompt = `
      Hãy phân tích các cấu trúc ngữ pháp tiếng Việt (Vietnamese Grammar) quan trọng trong đoạn văn sau: "${text}".
      
      Yêu cầu:
      1. Tìm 2-4 cấu trúc ngữ pháp tiếng Việt tiêu biểu (Ví dụ: "Chủ ngữ + đang/đã/sẽ + Động từ", "Vì... nên...", "Mặc dù... nhưng...", "Không những... mà còn...", "Để... thì...", các trợ từ kết thúc câu như 'nhé, nha, nhé, cơ, đấy', v.v.).
      2. Giải thích rõ ràng cách dùng và ý nghĩa của cấu trúc bằng tiếng Việt & tiếng Anh.
      3. Lấy ví dụ minh họa TRỰC TIẾP từ chính đoạn văn trên (nếu có) hoặc ví dụ tiếng Việt đơn giản, sinh động.
      
      Trả về JSON array:
      [
        { "structure": "string", "explanation": "string", "example": "string" }
      ]
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      return cleanAndParseJSON<GrammarPoint[]>(response.text, []);
    } catch (error) {
      console.error("Gemini Grammar Error:", error);
      return [];
    }
  },

  async performGrammarOCR(base64Image: string): Promise<GrammarPoint[]> {
    const ai = getAI();
    const model = "gemini-3.7-flash";
    const { data, mimeType } = parseImageData(base64Image);

    const prompt = `
      Phân tích hình ảnh chứa kiến thức ngữ pháp tiếng Việt sau.
      
      Yêu cầu:
      1. Trích xuất các cấu trúc ngữ pháp tiếng Việt quan trọng nhất xuất hiện trong ảnh.
      2. Với mỗi cấu trúc, cung cấp:
         - structure: Tên cấu trúc ngữ pháp tiếng Việt (Ví dụ: "S + vừa + V1 + vừa + V2").
         - explanation: Giải thích cách dùng chi tiết bằng tiếng Việt & tiếng Anh.
         - example: Một ví dụ minh họa bằng tiếng Việt chuẩn xác.
      
      Trả về JSON array các đối tượng GrammarPoint:
      [
        { "structure": "string", "explanation": "string", "example": "string" }
      ]
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            parts: [
              { inlineData: { data, mimeType } },
              { text: prompt }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      return cleanAndParseJSON<GrammarPoint[]>(response.text, []);
    } catch (error) {
      console.error("Gemini Grammar OCR Error:", error);
      return [];
    }
  },

  async generateGrammarQuiz(points: GrammarPoint[]): Promise<GrammarQuizQuestion[]> {
    const ai = getAI();
    const model = "gemini-3.7-flash";
    const prompt = `
      Dựa trên danh sách các cấu trúc ngữ pháp tiếng Việt sau, hãy tạo 5 câu hỏi trắc nghiệm kiểm tra kiến thức tiếng Việt:
      ${JSON.stringify(points)}
      
      Yêu cầu:
      1. Mỗi câu hỏi phải tập trung vào một cấu trúc ngữ pháp tiếng Việt cụ thể.
      2. Bao gồm 2 loại câu hỏi:
         - "multiple-choice": Một câu tiếng Việt có chỗ trống (___). Cung cấp 4 lựa chọn (options) là các từ/cụm từ tiếng Việt.
         - "ordering": Một câu tiếng Việt hoàn chỉnh nhưng bị xáo trộn các từ/cụm từ tiếng Việt. Cung cấp danh sách các từ bị xáo trộn trong "options". "answer" là câu tiếng Việt hoàn chỉnh đúng.
      3. "pinyin" field: Cung cấp bản dịch hoặc hướng dẫn ngữ âm ngắn gọn cho câu hỏi.
      4. Giải thích ngắn gọn tại sao chọn đáp án đó (explanation).
      
      Trả về JSON array các đối tượng GrammarQuizQuestion:
      [
        {
          "type": "multiple-choice" | "ordering",
          "question": "string",
          "pinyin": "string",
          "options": ["string", "string", "string", "string"],
          "optionPinyins": ["string", "string", "string", "string"],
          "answer": "string",
          "explanation": "string"
        }
      ]
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      return cleanAndParseJSON<GrammarQuizQuestion[]>(response.text, []);
    } catch (error) {
      console.error("Gemini Quiz Generation Error:", error);
      return [];
    }
  },

  async evaluateSpeech(base64Audio: string, targetVietnamese: string): Promise<{ score: number; feedback: string; recognizedText: string }> {
    const ai = getAI();
    const model = "gemini-3.7-flash";
    const prompt = `
      Bạn là một chuyên gia ngôn ngữ tiếng Việt (Vietnamese language expert). Hãy đánh giá phát âm của người học trong đoạn âm thanh đính kèm.
      Từ/Câu tiếng Việt mục tiêu: "${targetVietnamese}"
      
      Yêu cầu đánh giá cực kỳ chuẩn xác và tận tâm:
      1. Nhận diện văn bản (recognizedText): Ghi lại chính xác những gì người dùng đã phát âm bằng tiếng Việt.
         - Nếu im lặng hoặc chỉ có tiếng ồn: recognizedText = "", score = 0.
      2. Đánh giá chi tiết các yếu tố tiếng Việt:
         - Dấu thanh (6 thanh điệu: Ngang, Huyền, Sắc, Hỏi, Ngã, Nặng): Kiểm tra xem người học có phát âm chuẩn dấu thanh không.
         - Nguyên âm & Phụ âm: Kiểm tra các nguyên âm đặc trưng như ă, â, ê, ô, ơ, ư và phụ âm tr/ch, s/x, r/d/gi, ng/ngh.
      3. Chấm điểm (score) từ 0 đến 10.
      4. Phản hồi (feedback): Nhận xét bằng tiếng Việt & tiếng Anh ngắn gọn.
      
      Trả về JSON:
      {
        "score": number,
        "feedback": "string",
        "recognizedText": "string"
      }
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            parts: [
              { inlineData: { data: base64Audio, mimeType: "audio/webm" } },
              { text: prompt }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      return cleanAndParseJSON(response.text, { score: 0, feedback: "Lỗi khi đánh giá giọng nói.", recognizedText: "" });
    } catch (error) {
      console.error("Gemini Speech Evaluation Error:", error);
      return { score: 0, feedback: "Lỗi khi đánh giá giọng nói.", recognizedText: "" };
    }
  },

  async getRelatedWords(word: string, existingVocab: string[] = []): Promise<{
    related: { chinese: string; pinyin: string; meaning: string; reason: string; hanViet: string }[];
    antonyms: { chinese: string; pinyin: string; meaning: string; hanViet: string }[];
    characterAnalysis: { char: string; components?: string; meaning: string; examples: { chinese: string; pinyin: string; meaning: string; hanViet: string }[] }[];
  }> {
    const ai = getAI();
    const model = "gemini-3.7-flash";
    const vocabListStr = existingVocab.length > 0 ? `Danh sách từ vựng hiện có: ${existingVocab.join(", ")}` : "";
    
    const prompt = `
      Phân tích từ vựng tiếng Việt sau để hỗ trợ người học mở rộng vốn từ: "${word}".
      ${vocabListStr}
      
      Yêu cầu:
      1. related: Tìm 3-5 từ ghép hoặc từ vựng tiếng Việt liên quan mật thiết đến "${word}".
      2. antonyms: Tìm 2-3 từ trái nghĩa tiếng Việt với từ gốc.
      3. characterAnalysis: Phân tích các tiếng / hình vị cấu thành nên từ tiếng Việt.
      
      Trả về JSON theo cấu trúc:
      {
        "related": [
          { "chinese": "string", "pinyin": "string", "meaning": "string", "reason": "string", "hanViet": "string" }
        ],
        "antonyms": [
          { "chinese": "string", "pinyin": "string", "meaning": "string", "hanViet": "string" }
        ],
        "characterAnalysis": [
          { 
            "char": "string", 
            "meaning": "string", 
            "examples": [
              { "chinese": "string", "pinyin": "string", "meaning": "string", "hanViet": "string" }
            ]
          }
        ]
      }
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      return cleanAndParseJSON(response.text, { related: [], antonyms: [], characterAnalysis: [] });
    } catch (error) {
      console.error("Gemini Related Words Error:", error);
      return { related: [], antonyms: [], characterAnalysis: [] };
    }
  },

  async sendChatMessage(messages: { role: "user" | "model"; text: string }[], targetLang: "vi" | "zh" | "en"): Promise<{
    userMessage: { text: string; pinyin?: string; meaning?: string };
    modelResponse: { text: string; pinyin?: string; meaning?: string };
  }> {
    const ai = getAI();
    const model = "gemini-3.7-flash";
    const targetLangName = targetLang === "vi" ? "Vietnamese" : targetLang === "zh" ? "Chinese" : "English";

    const prompt = `
      You are a friendly, patient, and encouraging Vietnamese conversation partner and tutor named Minh (or Mai).
      Your mission is to help the user practice and learn Vietnamese.
      When the user sends a message in Vietnamese, English, or Chinese, reply in natural, authentic, everyday Vietnamese.
      
      IMPORTANT: You MUST return a JSON response for BOTH the user's message and your response.
      The "text" field MUST contain natural Vietnamese text.
      The "meaning" field should provide a clear translation in ${targetLangName}.
      The "pinyin" field can provide tone guidance / phonetics / helpful learning notes for Vietnamese learners.
      
      JSON structure:
      {
        "userMessage": {
          "text": "User's message in Vietnamese (translated to Vietnamese if they spoke English/Chinese, or refined Vietnamese if they wrote Vietnamese)",
          "pinyin": "Phonetic/Tone tips for this sentence",
          "meaning": "Translation of user message in ${targetLangName}"
        },
        "modelResponse": {
          "text": "Your reply in authentic, natural Vietnamese",
          "pinyin": "Pronunciation/Tone guide or vocabulary tips",
          "meaning": "Translation of your reply in ${targetLangName}"
        }
      }
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction: prompt,
          responseMimeType: "application/json"
        }
      });

      return cleanAndParseJSON(response.text, {
        userMessage: { text: messages[messages.length - 1]?.text || "", meaning: "" },
        modelResponse: { text: "Xin chào bạn!", meaning: "Hello friend!" }
      });
    } catch (error) {
      console.error("Gemini Chat Error:", error);
      throw error;
    }
  }
};

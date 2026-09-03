import { GoogleGenAI } from "@google/genai";

let runtimeSharedApiKey = "";

export const setSharedGeminiApiKey = (key: string): void => {
  if (key && typeof key === "string" && key.trim()) {
    runtimeSharedApiKey = key.trim();
  }
};

export const getBackendGeminiApiKey = (): string => {
  return (
    runtimeSharedApiKey ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    ""
  );
};

const getAI = () => {
  const apiKey = getBackendGeminiApiKey();
  if (!apiKey) {
    const err = new Error("Chưa cấu hình biến môi trường GEMINI_API_KEY trên máy chủ (Server Environment Variable). Hãy đảm bảo GEMINI_API_KEY đã được thêm vào mục Settings / Deploy.");
    (err as any).code = "GEMINI_API_KEY_MISSING";
    (err as any).status = 500;
    throw err;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
};

export const cleanAndParseJSON = <T = any>(rawText?: string, fallback: any = {}): T => {
  if (!rawText || typeof rawText !== "string") return fallback;

  let cleaned = rawText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (e) {
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

const parseImageData = (base64Image: string): { data: string; mimeType: string } => {
  let mimeType = "image/jpeg";
  let data = base64Image || "";

  if (base64Image && base64Image.includes(",")) {
    const parts = base64Image.split(",");
    data = parts[1];
    const header = parts[0];
    const match = header.match(/data:([^;]+);/);
    if (match && match[1]) {
      mimeType = match[1];
    }
  }

  if (!data || data.trim() === "") {
    const err = new Error("Dữ liệu hình ảnh không hợp lệ hoặc rỗng. Vui lòng chọn lại ảnh.");
    (err as any).code = "INVALID_IMAGE_DATA";
    (err as any).status = 400;
    throw err;
  }

  return { data, mimeType };
};

/**
 * Execute generateContent with candidate models to guarantee high availability in production
 */
async function callGeminiModel(ai: any, contents: any, config?: any): Promise<any> {
  const candidateModels = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-3.7-flash"];
  let lastError: any = null;

  for (const modelName of candidateModels) {
    try {
      return await ai.models.generateContent({
        model: modelName,
        contents,
        ...(config ? { config } : {})
      });
    } catch (err: any) {
      lastError = err;
      console.warn(`Gemini model ${modelName} error:`, err?.message || err);
      // For auth or configuration errors, do not retry other models
      if (
        err?.status === 401 || 
        err?.status === 403 || 
        err?.code === "GEMINI_API_KEY_MISSING" ||
        err?.message?.includes("API key not valid")
      ) {
        throw err;
      }
    }
  }
  throw lastError;
}

export async function handleGeminiAction(action: string, payload: any): Promise<any> {
  const ai = getAI();

  switch (action) {
    case "performOCR": {
      const { base64Image } = payload || {};
      if (!base64Image) {
        const err = new Error("Thiếu dữ liệu ảnh để quét OCR.");
        (err as any).code = "MISSING_IMAGE";
        (err as any).status = 400;
        throw err;
      }
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

      const response = await callGeminiModel(
        ai,
        [
          {
            parts: [
              { inlineData: { data, mimeType } },
              { text: prompt }
            ]
          }
        ],
        {
          responseMimeType: "application/json"
        }
      );

      const result = cleanAndParseJSON(response.text, { originalText: "", sentences: [], words: [] });
      if (result.words && Array.isArray(result.words)) {
        result.words = result.words.map((w: any) => ({
          ...w,
          isMastered: false,
          topic: w.topic || "Chung",
          wordType: w.wordType || "Chưa phân loại"
        }));
      }

      if (result.sentences && Array.isArray(result.sentences)) {
        result.sentences = result.sentences.map((s: any) => ({
          ...s,
          isMastered: false,
          words: Array.isArray(s.words) ? s.words.map((w: any) => ({
            ...w,
            englishMeaning: w.englishMeaning || w.meaning || "",
            chineseMeaning: w.chineseMeaning || w.pinyin || "",
            pinyin: w.pinyin || "",
            amBoi: w.amBoi || ""
          })) : []
        }));
      }

      return result;
    }

    case "extractVocabularyFromText": {
      const { text } = payload;
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
        
        Trả về JSON array:
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

      const response = await callGeminiModel(ai, prompt, {
        responseMimeType: "application/json"
      });

      const words = cleanAndParseJSON<any[]>(response.text, []);
      return words.map(w => ({ ...w, isMastered: false }));
    }

    case "enrichVocabulary": {
      const { word } = payload;
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

      const response = await callGeminiModel(ai, prompt, {
        responseMimeType: "application/json"
      });

      const data = cleanAndParseJSON(response.text, {});
      return {
        ...data,
        chinese: word,
        isMastered: false
      };
    }

    case "analyzeGrammar": {
      const { text } = payload;
      const prompt = `
        Hãy phân tích các cấu trúc ngữ pháp tiếng Việt quan trọng trong đoạn văn sau: "${text}".
        
        Yêu cầu:
        1. Tìm 2-4 cấu trúc ngữ pháp tiếng Việt tiêu biểu (Ví dụ: "Chủ ngữ + đang/đã/sẽ + Động từ", "Vì... nên...", "Mặc dù... nhưng...", "Không những... mà còn...", v.v.).
        2. Giải thích rõ ràng cách dùng và ý nghĩa của cấu trúc bằng tiếng Việt & tiếng Anh.
        3. Lấy ví dụ minh họa TRỰC TIẾP từ chính đoạn văn trên hoặc ví dụ tiếng Việt đơn giản.
        
        Trả về JSON array:
        [
          { "structure": "string", "explanation": "string", "example": "string" }
        ]
      `;

      const response = await callGeminiModel(ai, prompt, {
        responseMimeType: "application/json"
      });

      return cleanAndParseJSON(response.text, []);
    }

    case "performGrammarOCR": {
      const { base64Image } = payload || {};
      if (!base64Image) {
        const err = new Error("Thiếu dữ liệu ảnh ngữ pháp.");
        (err as any).code = "MISSING_IMAGE";
        (err as any).status = 400;
        throw err;
      }
      const { data, mimeType } = parseImageData(base64Image);

      const prompt = `
        Phân tích hình ảnh chứa kiến thức ngữ pháp tiếng Việt sau.
        
        Yêu cầu:
        1. Trích xuất các cấu trúc ngữ pháp tiếng Việt quan trọng nhất xuất hiện trong ảnh.
        2. Với mỗi cấu trúc, cung cấp:
           - structure: Tên cấu trúc ngữ pháp tiếng Việt (Ví dụ: "S + vừa + V1 + vừa + V2").
           - explanation: Giải thích cách dùng chi tiết bằng tiếng Việt & tiếng Anh.
           - example: Một ví dụ minh họa bằng tiếng Việt chuẩn xác.
        
        Trả về JSON array:
        [
          { "structure": "string", "explanation": "string", "example": "string" }
        ]
      `;

      const response = await callGeminiModel(
        ai,
        [
          {
            parts: [
              { inlineData: { data, mimeType } },
              { text: prompt }
            ]
          }
        ],
        {
          responseMimeType: "application/json"
        }
      );

      return cleanAndParseJSON(response.text, []);
    }

    case "generateGrammarQuiz": {
      const { points } = payload;
      const prompt = `
        Dựa trên danh sách các cấu trúc ngữ pháp tiếng Việt sau, hãy tạo 5 câu hỏi trắc nghiệm:
        ${JSON.stringify(points)}
        
        Trả về JSON array:
        [
          {
            "type": "multiple-choice",
            "question": "string",
            "pinyin": "string",
            "options": ["string", "string", "string", "string"],
            "optionPinyins": ["string", "string", "string", "string"],
            "answer": "string",
            "explanation": "string"
          }
        ]
      `;

      const response = await callGeminiModel(ai, prompt, {
        responseMimeType: "application/json"
      });

      return cleanAndParseJSON(response.text, []);
    }

    case "evaluateSpeech": {
      const { base64Audio, targetVietnamese } = payload;
      const prompt = `
        Bạn là một chuyên gia ngôn ngữ tiếng Việt. Hãy đánh giá phát âm của người học trong đoạn âm thanh đính kèm.
        Từ/Câu tiếng Việt mục tiêu: "${targetVietnamese}"
        
        Yêu cầu:
        1. recognizedText: Ghi lại chính xác những gì người dùng đã phát âm.
        2. Chấm điểm score từ 0 đến 10.
        3. feedback: Nhận xét ngắn gọn bằng tiếng Việt & tiếng Anh.
        
        Trả về JSON:
        {
          "score": number,
          "feedback": "string",
          "recognizedText": "string"
        }
      `;

      const response = await callGeminiModel(
        ai,
        [
          {
            parts: [
              { inlineData: { data: base64Audio, mimeType: "audio/webm" } },
              { text: prompt }
            ]
          }
        ],
        {
          responseMimeType: "application/json"
        }
      );

      return cleanAndParseJSON(response.text, { score: 0, feedback: "Lỗi khi đánh giá giọng nói.", recognizedText: "" });
    }

    case "getRelatedWords": {
      const { word, existingVocab } = payload;
      const vocabListStr = existingVocab && existingVocab.length > 0 ? `Danh sách từ vựng hiện có: ${existingVocab.join(", ")}` : "";

      const prompt = `
        Phân tích từ vựng tiếng Việt sau: "${word}".
        ${vocabListStr}
        
        Yêu cầu:
        1. related: Tìm 3-5 từ ghép hoặc từ vựng tiếng Việt liên quan mật thiết.
        2. antonyms: Tìm 2-3 từ trái nghĩa tiếng Việt.
        3. characterAnalysis: Phân tích các tiếng / hình vị cấu thành nên từ.
        
        Trả về JSON:
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

      const response = await callGeminiModel(ai, prompt, {
        responseMimeType: "application/json"
      });

      return cleanAndParseJSON(response.text, { related: [], antonyms: [], characterAnalysis: [] });
    }

    case "sendChatMessage": {
      const { messages, targetLang } = payload;
      const targetLangName = targetLang === "vi" ? "Vietnamese" : targetLang === "zh" ? "Chinese" : "English";

      const prompt = `
        You are a friendly, patient, and encouraging Vietnamese conversation partner and tutor named Minh.
        Your mission is to help the user practice and learn Vietnamese.
        When the user sends a message in Vietnamese, English, or Chinese, reply in natural, authentic, everyday Vietnamese.
        
        IMPORTANT: You MUST return a JSON response for BOTH the user's message and your response.
        The "text" field MUST contain natural Vietnamese text.
        The "meaning" field should provide a clear translation in ${targetLangName}.
        The "pinyin" field can provide tone guidance / phonetics / helpful learning notes for Vietnamese learners.
        
        JSON structure:
        {
          "userMessage": {
            "text": "User's message in Vietnamese",
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

      const response = await callGeminiModel(
        ai,
        messages.map((m: any) => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        {
          systemInstruction: prompt,
          responseMimeType: "application/json"
        }
      );

      return cleanAndParseJSON(response.text, {
        userMessage: { text: messages[messages.length - 1]?.text || "", meaning: "" },
        modelResponse: { text: "Xin chào bạn!", meaning: "Hello friend!" }
      });
    }

    case "setSharedApiKey": {
      const { apiKey } = payload;
      if (apiKey && typeof apiKey === "string" && apiKey.trim()) {
        setSharedGeminiApiKey(apiKey.trim());
      }
      const activeKey = getBackendGeminiApiKey();
      return {
        configured: Boolean(activeKey),
        maskedKey: activeKey ? `${activeKey.slice(0, 4)}••••${activeKey.slice(-4)}` : ""
      };
    }

    case "checkApiKeyStatus": {
      const activeKey = getBackendGeminiApiKey();
      return {
        configured: Boolean(activeKey),
        maskedKey: activeKey ? `${activeKey.slice(0, 4)}••••${activeKey.slice(-4)}` : ""
      };
    }

    case "testApiKey": {
      const activeKey = getBackendGeminiApiKey();
      if (!activeKey) {
        return { success: false, message: "Chưa có API Key được cấu hình trên máy chủ." };
      }
      try {
        const testAi = getAI();
        const res = await callGeminiModel(testAi, "Trả lời đúng 1 chữ: OK");
        return { success: true, message: `Kết nối thành công! Phản hồi: ${res.text?.trim() || "OK"}` };
      } catch (e: any) {
        return { success: false, message: e?.message || "Không thể kết nối với Gemini API" };
      }
    }

    default:
      throw new Error(`Unknown Gemini action: ${action}`);
  }
}

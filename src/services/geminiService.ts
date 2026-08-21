import { GoogleGenAI, Type } from "@google/genai";
import { OCRResult, Vocabulary, GrammarPoint, GrammarQuizQuestion } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || "";
  return new GoogleGenAI({ apiKey });
};

export const geminiService = {
  async performOCR(base64Image: string): Promise<OCRResult> {
    const ai = getAI();
    const model = "gemini-3.7-flash";
    const prompt = `
      Analyze this image containing Vietnamese text (or bilingual Vietnamese learning materials). 
      1. Extract all Vietnamese text (OCR).
      2. Split the text into meaningful Vietnamese sentences for learners.
      3. For each sentence, group words into meaningful compound words (từ ghép tiếng Việt) where applicable (e.g., 'học tập', 'phát triển', 'thời gian', 'cảm ơn', 'xin chào').
      4. For each sentence:
         - 'chinese' field: Put the original Vietnamese sentence.
         - 'pinyin' field: Put the phonetic/pronunciation guide or tone annotation for Vietnamese learners.
         - 'meaning' field: Provide English/Chinese translation of the sentence.
      5. For each grouped word (từ đơn / từ ghép) in each sentence:
         - 'char': The Vietnamese word/phrase.
         - 'amBoi': Phonetic/Tone guide (e.g., 'Dấu sắc + Thanh ngang' or phonetic aid).
         - 'meaning': English / Chinese translation of this word.

      6. Extract an EXHAUSTIVE list of all unique Vietnamese vocabulary items found in the text. 
      7. For each vocabulary item, provide FULL details:
         - 'chinese': Vietnamese word/phrase (e.g., 'hợp tác', 'kinh nghiệm', 'thành công').
         - 'pinyin': Phonetic guide / pronunciation.
         - 'amBoi': Pronunciation/Tone guide.
         - 'meaning': English and/or Chinese meaning.
         - 'hanViet': Hán Việt (Sino-Vietnamese root or Chinese characters if applicable, e.g., 'Hợp tác (合作)', or '-' if purely native).
         - 'wordType': Loại từ (Danh từ, Động từ, Tính từ, Phó từ, Liên từ, Trợ từ, Đại từ, Lượng từ...).
         - 'topic': Chủ đề (Giao tiếp, Công việc, Gia đình, Xã hội, Giáo dục, Sản xuất, Mua sắm...).
      
      Return the result in JSON format matching this structure:
      {
        "originalText": "string",
        "sentences": [
          {
            "chinese": "string",
            "pinyin": "string",
            "meaning": "string",
            "words": [
              { "char": "string", "amBoi": "string", "meaning": "string" }
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
              { inlineData: { data: base64Image.split(",")[1], mimeType: "image/jpeg" } },
              { text: prompt }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text || "{}") as OCRResult;
      // Ensure all word objects have required fields
      if (result.words) {
        result.words = result.words.map(w => ({
          ...w,
          isMastered: false,
          topic: w.topic || "Chung",
          wordType: w.wordType || "Chưa phân loại"
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
         - amBoi: Hướng dẫn phát âm / Thanh điệu (ví dụ: Thanh hỏi, sắc, huyền...).
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

      const words = JSON.parse(response.text || "[]") as Vocabulary[];
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

      const data = JSON.parse(response.text || "{}");
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

      return JSON.parse(response.text || "[]");
    } catch (error) {
      console.error("Gemini Grammar Error:", error);
      return [];
    }
  },

  async performGrammarOCR(base64Image: string): Promise<GrammarPoint[]> {
    const ai = getAI();
    const model = "gemini-3.7-flash";
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
              { inlineData: { data: base64Image.split(",")[1], mimeType: "image/jpeg" } },
              { text: prompt }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      return JSON.parse(response.text || "[]");
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

      return JSON.parse(response.text || "[]");
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
         - Dấu thanh (6 thanh điệu: Ngang, Huyền, Sắc, Hỏi, Ngã, Nặng): Đây là linh hồn của tiếng Việt. Kiểm tra xem người học có phát âm chuẩn dấu thanh không (ví dụ nhầm dấu hỏi với dấu ngã, dấu sắc với dấu nặng).
         - Nguyên âm & Phụ âm (Vowels & Consonants): Kiểm tra các nguyên âm đặc trưng như ă, â, ê, ô, ơ, ư và các phụ âm tr/ch, s/x, r/d/gi, ng/ngh.
      3. Chấm điểm (score) từ 0 đến 10:
         - 10: Phát âm hoàn hảo như người bản xứ.
         - 8-9: Rất tốt, phát âm chuẩn rõ, chỉ có lỗi nhỏ không đáng kể.
         - 6-7: Hiểu được nhưng dấu thanh chưa rõ hoặc bị ngọng âm.
         - 4-5: Sai nhiều thanh điệu hoặc nguyên âm.
         - 0-3: Sai hoàn toàn hoặc không nói gì.
      4. Phản hồi (feedback): Nhận xét bằng tiếng Việt & tiếng Anh ngắn gọn. Chỉ rõ từ nào sai dấu thanh gì, cách uốn lưỡi mở khẩu hình để phát âm đúng.
      
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

      return JSON.parse(response.text || "{}");
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
         - chinese: Từ ghép tiếng Việt liên quan (Ví dụ nếu từ gốc là 'học', các từ liên quan là 'học tập', 'học sinh', 'du học', 'học bổng').
         - pinyin: Hướng dẫn phát âm / phiên âm.
         - meaning: Nghĩa tiếng Anh / tiếng Trung.
         - reason: Giải thích ngắn gọn lý do liên quan.
         - hanViet: Gốc Hán Việt hoặc chữ Hán tương ứng nếu có.
      2. antonyms: Tìm 2-3 từ trái nghĩa tiếng Việt với từ gốc (Ví dụ: 'nhanh' <-> 'chậm', 'thành công' <-> 'thất bại').
      3. characterAnalysis: Phân tích các tiếng / hình vị cấu thành nên từ tiếng Việt.
         - char: Tiếng đơn cấu thành.
         - meaning: Ý nghĩa của tiếng đó.
         - examples: 2 ví dụ từ ghép tiếng Việt khác chứa tiếng đó kèm nghĩa.
      
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

      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("Gemini Related Words Error:", error);
      return { related: [], antonyms: [], characterAnalysis: [] };
    }
  }
};


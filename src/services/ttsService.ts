// Unified Text-To-Speech Service with native voice verification and Google TTS fallback

export type SupportedLang = "vi-VN" | "zh-CN" | "en-US" | "vi" | "zh" | "en";

class TTSService {
  private currentAudio: HTMLAudioElement | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private sequenceAborted: boolean = false;

  constructor() {
    this.initVoices();
  }

  private initVoices() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const updateVoices = () => {
      try {
        this.voices = window.speechSynthesis.getVoices();
      } catch (e) {
        console.warn("Could not retrieve speechSynthesis voices:", e);
      }
    };

    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }

  /**
   * Intelligently detect if a text contains Chinese characters or Vietnamese
   */
  public detectLanguage(text: string, fallbackLang: SupportedLang = "vi-VN"): "vi-VN" | "zh-CN" | "en-US" {
    if (!text) return "vi-VN";

    // Check for Chinese characters (Hanzi / Kanji range)
    const hasChinese = /[\u4e00-\u9fa5\u3400-\u4dbf]/.test(text);
    if (hasChinese) {
      return "zh-CN";
    }

    // Check for Vietnamese-specific diacritics
    const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/.test(text);
    if (hasVietnamese) {
      return "vi-VN";
    }

    // Normalize fallback
    const norm = fallbackLang.toLowerCase();
    if (norm.startsWith("zh")) return "zh-CN";
    if (norm.startsWith("en")) return "en-US";
    return "vi-VN";
  }

  /**
   * Find a genuine native voice for the given language prefix.
   * Returns NULL if no genuine voice exists (prevents browser from defaulting to English voice!).
   */
  private findNativeVoice(langPrefix: string): SpeechSynthesisVoice | null {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
    const voices = this.voices.length > 0 ? this.voices : window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    if (langPrefix === "vi") {
      return (
        voices.find((v) => {
          const l = v.lang.replace("_", "-").toLowerCase();
          const n = v.name.toLowerCase();
          return l.startsWith("vi") || n.includes("vietnam") || n.includes("vietnamese") || n.includes("tiếng việt");
        }) || null
      );
    }

    if (langPrefix === "zh") {
      return (
        voices.find((v) => {
          const l = v.lang.replace("_", "-").toLowerCase();
          const n = v.name.toLowerCase();
          return (
            l.startsWith("zh") ||
            l.startsWith("cmn") ||
            n.includes("chinese") ||
            n.includes("mandarin") ||
            n.includes("putonghua") ||
            n.includes("huihui") ||
            n.includes("yaoyao") ||
            n.includes("kangkang") ||
            n.includes("hanhan") ||
            n.includes("taiwan") ||
            n.includes("hong kong") ||
            n.includes("cantonese") ||
            n.includes("xiaoxiao") ||
            n.includes("yunxi") ||
            n.includes("meijia") ||
            n.includes("sin-ji") ||
            n.includes("hiu-gaai")
          );
        }) || null
      );
    }

    if (langPrefix === "en") {
      return (
        voices.find((v) => {
          const l = v.lang.replace("_", "-").toLowerCase();
          const n = v.name.toLowerCase();
          return l.startsWith("en") || n.includes("english");
        }) || null
      );
    }

    return null;
  }

  /**
   * Play high-quality native audio via Google Translate TTS stream
   */
  private playGoogleTTS(text: string, langCode: "vi" | "zh-CN" | "en", rate: number = 1): Promise<void> {
    return new Promise((resolve) => {
      try {
        this.stopAudioOnly();

        // Encode clean text (max 200 chars per request for reliability)
        const cleanText = text.trim().slice(0, 200);
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${langCode}&client=tw-ob&q=${encodeURIComponent(cleanText)}`;

        const audio = new Audio(url);
        this.currentAudio = audio;

        if (rate && rate !== 1) {
          audio.playbackRate = Math.min(Math.max(rate, 0.75), 1.5);
        }

        audio.onended = () => {
          this.currentAudio = null;
          resolve();
        };

        audio.onerror = () => {
          this.currentAudio = null;
          // Fallback if network blocked: try generic Web Speech
          if (typeof window !== "undefined" && "speechSynthesis" in window) {
            try {
              const u = new SpeechSynthesisUtterance(cleanText);
              u.lang = langCode === "vi" ? "vi-VN" : langCode === "zh-CN" ? "zh-CN" : "en-US";
              u.rate = rate;
              u.onend = () => resolve();
              u.onerror = () => resolve();
              window.speechSynthesis.speak(u);
              return;
            } catch {}
          }
          resolve();
        };

        audio.play().catch((err) => {
          console.warn("Google TTS audio playback note:", err);
          resolve();
        });
      } catch (err) {
        console.warn("Google TTS initiation error:", err);
        resolve();
      }
    });
  }

  private stopAudioOnly() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {}
      this.currentAudio = null;
    }
  }

  /**
   * Main Speak method
   * Automatically picks the correct language and true native voice.
   */
  public speak(
    text: string,
    specifiedLang?: SupportedLang,
    rate: number = 1
  ): Promise<void> {
    return new Promise((resolve) => {
      this.sequenceAborted = false;
      this.stop();

      if (!text || !text.trim()) {
        resolve();
        return;
      }

      // Auto-detect or normalize language
      const targetLang = specifiedLang 
        ? (specifiedLang.toLowerCase().startsWith("zh") ? "zh-CN" : specifiedLang.toLowerCase().startsWith("en") ? "en-US" : this.detectLanguage(text, specifiedLang))
        : this.detectLanguage(text, "vi-VN");

      const langPrefix = targetLang === "zh-CN" ? "zh" : targetLang === "en-US" ? "en" : "vi";
      const matchedVoice = this.findNativeVoice(langPrefix);

      // If we have a verified native voice installed on user's machine, use it
      if (matchedVoice && typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          const utterance = new SpeechSynthesisUtterance(text.trim());
          utterance.voice = matchedVoice;
          utterance.lang = matchedVoice.lang || targetLang;
          utterance.rate = rate;

          utterance.onend = () => resolve();
          utterance.onerror = () => {
            // Fall back to Google TTS if native synthesis has an error
            const gLang = langPrefix === "zh" ? "zh-CN" : langPrefix === "en" ? "en" : "vi";
            this.playGoogleTTS(text, gLang, rate).then(resolve);
          };

          window.speechSynthesis.speak(utterance);
          return;
        } catch (e) {
          console.warn("SpeechSynthesis error, falling back to Google TTS:", e);
        }
      }

      // If NO native voice is installed in browser, use Google TTS
      // This prevents Vietnamese from being read in English!
      const gLang = langPrefix === "zh" ? "zh-CN" : langPrefix === "en" ? "en" : "vi";
      this.playGoogleTTS(text, gLang, rate).then(resolve);
    });
  }

  /**
   * Sequential speech for learning flow / explore vocabulary
   */
  public async speakSequence(
    elements: { text: string; lang?: SupportedLang }[],
    delayBetween: number = 250
  ): Promise<void> {
    this.sequenceAborted = false;
    this.stop();

    for (const item of elements) {
      if (this.sequenceAborted) break;
      if (!item.text || !item.text.trim()) continue;

      await this.speak(item.text, item.lang);
      if (this.sequenceAborted) break;

      await new Promise((r) => setTimeout(r, delayBetween));
    }
  }

  public stop() {
    this.sequenceAborted = true;
    this.stopAudioOnly();

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }
}

export const ttsService = new TTSService();


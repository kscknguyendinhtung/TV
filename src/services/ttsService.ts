// Unified Text-To-Speech Service with native voice verification and reliable audio streaming

export type SupportedLang = "vi-VN" | "zh-CN" | "en-US" | "vi" | "zh" | "en";

class TTSService {
  private currentAudio: HTMLAudioElement | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private sequenceAborted: boolean = false;
  private audioCache: Map<string, string> = new Map();

  constructor() {
    this.initVoices();
  }

  private initVoices() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const updateVoices = () => {
      try {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length > 0) {
          this.voices = v;
        }
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
    if (!text || !text.trim()) return "vi-VN";

    const clean = text.trim();

    // Check for Chinese characters (Hanzi)
    const hasChinese = /[\u4e00-\u9fa5\u3400-\u4dbf]/.test(clean);
    if (hasChinese) {
      return "zh-CN";
    }

    // Check for Vietnamese-specific diacritics
    const hasVietnameseDiacritics = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/i.test(clean);
    if (hasVietnameseDiacritics) {
      return "vi-VN";
    }

    // Check fallback preference
    const norm = fallbackLang.toLowerCase();
    if (norm.startsWith("zh")) return "zh-CN";
    if (norm.startsWith("en")) return "en-US";
    return "vi-VN";
  }

  /**
   * Find a genuine native voice for the given language prefix.
   * Returns NULL if no genuine native voice exists (prevents browser from defaulting to English voice for Vietnamese!).
   */
  private findNativeVoice(langPrefix: string): SpeechSynthesisVoice | null {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
    
    let voices = this.voices;
    if (!voices || voices.length === 0) {
      try {
        voices = window.speechSynthesis.getVoices() || [];
        if (voices.length > 0) this.voices = voices;
      } catch {
        voices = [];
      }
    }

    if (!voices || voices.length === 0) return null;

    if (langPrefix === "vi") {
      return (
        voices.find((v) => {
          const l = (v.lang || "").replace("_", "-").toLowerCase();
          const n = (v.name || "").toLowerCase();
          return (
            l.startsWith("vi") ||
            n.includes("vietnam") ||
            n.includes("vietnamese") ||
            n.includes("tiếng việt") ||
            n.includes("hoaimy") ||
            n.includes("nam") ||
            n.includes("linh") ||
            n.includes("mai")
          );
        }) || null
      );
    }

    if (langPrefix === "zh") {
      return (
        voices.find((v) => {
          const l = (v.lang || "").replace("_", "-").toLowerCase();
          const n = (v.name || "").toLowerCase();
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
            n.includes("xiaoxiao") ||
            n.includes("yunxi") ||
            n.includes("ting-ting") ||
            n.includes("tingting") ||
            n.includes("meijia")
          );
        }) || null
      );
    }

    if (langPrefix === "en") {
      return (
        voices.find((v) => {
          const l = (v.lang || "").replace("_", "-").toLowerCase();
          const n = (v.name || "").toLowerCase();
          return l.startsWith("en") || n.includes("english");
        }) || null
      );
    }

    return null;
  }

  /**
   * Play high-quality studio audio via backend /api/tts proxy endpoint
   */
  private playProxyTTS(text: string, langCode: "vi" | "zh-CN" | "en", rate: number = 1): Promise<void> {
    return new Promise((resolve) => {
      try {
        this.stopAudioOnly();

        const cleanText = text.trim().slice(0, 200);
        const url = `/api/tts?lang=${encodeURIComponent(langCode)}&text=${encodeURIComponent(cleanText)}`;

        const audio = new Audio(url);
        this.currentAudio = audio;

        if (rate && rate !== 1) {
          audio.playbackRate = Math.min(Math.max(rate, 0.75), 1.5);
        }

        audio.onended = () => {
          this.currentAudio = null;
          resolve();
        };

        audio.onerror = (err) => {
          console.warn("Proxy TTS failed, attempting fallback:", err);
          this.currentAudio = null;

          // Direct google fallback with referrerPolicy
          const directUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${langCode}&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
          const fallbackAudio = new Audio();
          this.currentAudio = fallbackAudio;
          fallbackAudio.src = directUrl;
          if (rate && rate !== 1) fallbackAudio.playbackRate = rate;
          fallbackAudio.onended = () => {
            this.currentAudio = null;
            resolve();
          };
          fallbackAudio.onerror = () => {
            this.currentAudio = null;
            resolve();
          };
          fallbackAudio.play().catch(() => resolve());
        };

        audio.play().catch((err) => {
          console.warn("Audio play rejected (user interaction needed or stopped):", err);
          this.currentAudio = null;
          resolve();
        });
      } catch (err) {
        console.warn("Proxy TTS error:", err);
        this.currentAudio = null;
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
   * Prioritizes verified native speech voice, or plays backend audio proxy.
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

      const cleanText = text.trim();

      // Detect language: prioritize Chinese characters, then Vietnamese
      const targetLang = this.detectLanguage(cleanText, specifiedLang || "vi-VN");
      const langPrefix = targetLang === "zh-CN" ? "zh" : targetLang === "en-US" ? "en" : "vi";
      const matchedVoice = this.findNativeVoice(langPrefix);

      // If we have a verified native voice installed on user's machine, use Web Speech API
      if (matchedVoice && typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.voice = matchedVoice;
          utterance.lang = matchedVoice.lang || targetLang;
          utterance.rate = rate;

          utterance.onend = () => resolve();
          utterance.onerror = (e) => {
            console.warn("SpeechSynthesis error, fallback to proxy TTS:", e);
            const gLang = langPrefix === "zh" ? "zh-CN" : langPrefix === "en" ? "en" : "vi";
            this.playProxyTTS(cleanText, gLang, rate).then(resolve);
          };

          window.speechSynthesis.speak(utterance);
          return;
        } catch (e) {
          console.warn("SpeechSynthesis exception:", e);
        }
      }

      // If NO verified native voice exists in browser (prevents English voice from reading Vietnamese!),
      // stream authentic studio pronunciation from server proxy
      const gLang = langPrefix === "zh" ? "zh-CN" : langPrefix === "en" ? "en" : "vi";
      this.playProxyTTS(cleanText, gLang, rate).then(resolve);
    });
  }

  /**
   * Sequential speech for Explore Tab & Learning Flows
   */
  public async speakSequence(
    elements: { text: string; lang?: SupportedLang }[],
    delayBetween: number = 300
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

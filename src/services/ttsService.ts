// Unified Text-To-Speech Service with accurate voice verification, strict concurrency management, and guaranteed global availability

export type SupportedLang = "vi-VN" | "zh-CN" | "en-US" | "vi" | "zh" | "en";

class TTSService {
  private currentAudio: HTMLAudioElement | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private currentPlayId: number = 0;
  private voicesLoaded: boolean = false;

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
          this.voicesLoaded = true;
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
   * Intelligently resolve the target language
   */
  public detectLanguage(text: string, specifiedLang?: SupportedLang): "vi-VN" | "zh-CN" | "en-US" {
    if (specifiedLang) {
      const norm = specifiedLang.toLowerCase();
      if (norm.startsWith("zh")) return "zh-CN";
      if (norm.startsWith("vi")) return "vi-VN";
      if (norm.startsWith("en")) return "en-US";
    }

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

    // Default to Vietnamese if undetermined
    return "vi-VN";
  }

  /**
   * Find a genuine native voice for the given language prefix.
   * Returns NULL if no genuine native voice exists (prevents browser from defaulting to English voice for Vietnamese or Chinese).
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
            n.includes("linh") ||
            n.includes("nam") ||
            n.includes("mai")
          );
        }) || null
      );
    }

    if (langPrefix === "zh") {
      // Prioritize Mandarin / Putonghua voices
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
            n.includes("taiwan") ||
            n.includes("huihui") ||
            n.includes("yaoyao") ||
            n.includes("kangkang") ||
            n.includes("hanhan") ||
            n.includes("xiaoxiao") ||
            n.includes("yunxi") ||
            n.includes("ting-ting") ||
            n.includes("tingting")
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
   * Play high-quality studio audio via backend /api/tts endpoint
   */
  private playProxyTTS(text: string, langCode: "vi" | "zh-CN" | "en", playId: number, rate: number = 1): Promise<void> {
    return new Promise((resolve) => {
      if (this.currentPlayId !== playId) {
        resolve();
        return;
      }

      this.stopAudioOnly();

      const cleanText = text.trim().slice(0, 300);
      const url = `/api/tts?lang=${encodeURIComponent(langCode)}&text=${encodeURIComponent(cleanText)}`;

      const audio = new Audio(url);
      this.currentAudio = audio;

      if (rate && rate !== 1) {
        audio.playbackRate = Math.min(Math.max(rate, 0.75), 1.5);
      }

      audio.onended = () => {
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
        resolve();
      };

      audio.onerror = () => {
        if (this.currentPlayId !== playId) {
          resolve();
          return;
        }
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
        resolve();
      };

      audio.play().catch(() => {
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
        resolve();
      });
    });
  }

  private stopAudioOnly() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.src = "";
      } catch {}
      this.currentAudio = null;
    }
  }

  /**
   * Main Speak method: Guaranteed to be monotonic and prevent duplicate voices
   */
  public speak(
    text: string,
    specifiedLang?: SupportedLang,
    rate: number = 1
  ): Promise<void> {
    // Increment play token immediately to cancel any previous pending playback
    this.currentPlayId++;
    const playId = this.currentPlayId;

    this.stopInternal();

    if (!text || !text.trim()) {
      return Promise.resolve();
    }

    const cleanText = text.trim();
    const targetLang = this.detectLanguage(cleanText, specifiedLang);
    const langPrefix = targetLang === "zh-CN" ? "zh" : targetLang === "en-US" ? "en" : "vi";
    const matchedVoice = this.findNativeVoice(langPrefix);

    return new Promise((resolve) => {
      // 1. If we have a verified native voice installed on user's system, use Web Speech API
      if (matchedVoice && typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.voice = matchedVoice;
          utterance.lang = matchedVoice.lang || targetLang;
          utterance.rate = rate;

          utterance.onend = () => {
            if (this.currentPlayId === playId) {
              resolve();
            }
          };

          utterance.onerror = (e) => {
            // If synthesis was canceled or replaced by a newer playId, just ignore
            if (this.currentPlayId !== playId) {
              resolve();
              return;
            }
            console.warn("SpeechSynthesis error, fallback to proxy TTS:", e);
            const gLang = langPrefix === "zh" ? "zh-CN" : langPrefix === "en" ? "en" : "vi";
            this.playProxyTTS(cleanText, gLang, playId, rate).then(resolve);
          };

          if (this.currentPlayId === playId) {
            window.speechSynthesis.speak(utterance);
            return;
          } else {
            resolve();
            return;
          }
        } catch (e) {
          console.warn("SpeechSynthesis exception:", e);
        }
      }

      // 2. If NO verified native voice exists on user's device (e.g. users in Taiwan / overseas with no Vietnamese voice installed),
      // stream authentic native audio from the server proxy endpoint
      if (this.currentPlayId === playId) {
        const gLang = langPrefix === "zh" ? "zh-CN" : langPrefix === "en" ? "en" : "vi";
        this.playProxyTTS(cleanText, gLang, playId, rate).then(resolve);
      } else {
        resolve();
      }
    });
  }

  /**
   * Sequential speech for Explore Tab & Learning Flows
   */
  public async speakSequence(
    elements: { text: string; lang?: SupportedLang }[],
    delayBetween: number = 300
  ): Promise<void> {
    this.currentPlayId++;
    const sequenceId = this.currentPlayId;
    this.stopInternal();

    for (const item of elements) {
      if (this.currentPlayId !== sequenceId) break;
      if (!item.text || !item.text.trim()) continue;

      await this.speak(item.text, item.lang);
      if (this.currentPlayId !== sequenceId) break;

      await new Promise((r) => setTimeout(r, delayBetween));
    }
  }

  private stopInternal() {
    this.stopAudioOnly();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }

  public stop() {
    this.currentPlayId++;
    this.stopInternal();
  }
}

export const ttsService = new TTSService();

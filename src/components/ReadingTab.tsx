import React, { useState, useMemo } from "react";
import { Volume2, CheckCircle2, Trash2, FileText, Play, Upload, Plus, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { ReadingSentence, ReadingWord, Vocabulary } from "../types";
import { ttsService } from "../services/ttsService";
import { useLanguage } from "../contexts/LanguageContext";
import { COMMON_VIETNAMESE_DICT, DictEntry } from "../data/commonVietnameseDictionary";

interface Props {
  sentences: ReadingSentence[];
  setSentences: React.Dispatch<React.SetStateAction<ReadingSentence[]>>;
  vocabList: Vocabulary[];
  onUpload: () => void;
  isSyncing: boolean;
  onAnalyzeGrammar: (text: string) => void;
  onAddVocab: (word: string) => void;
  onError: (error: any) => Promise<boolean>;
  key?: string;
}

interface ResolvedWord extends ReadingWord {
  punctuation?: string;
}

export default function ReadingTab({ sentences, setSentences, vocabList, onUpload, isSyncing, onAnalyzeGrammar, onAddVocab, onError }: Props) {
  const { t } = useLanguage();
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [addingWord, setAddingWord] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Build a comprehensive, case-insensitive master lookup dictionary
  const masterDictionary = useMemo(() => {
    const dict = new Map<string, { english: string; chinese: string; pinyin: string; amBoi?: string; meaning?: string }>();

    // 1. Built-in common Vietnamese dictionary
    Object.entries(COMMON_VIETNAMESE_DICT).forEach(([rawKey, entry]) => {
      const key = rawKey.trim().toLowerCase();
      dict.set(key, {
        english: entry.english,
        chinese: entry.chinese.includes("(") ? entry.chinese : `${entry.chinese} (${entry.pinyin})`,
        pinyin: entry.pinyin,
        amBoi: entry.amBoi,
        meaning: `${entry.english} / ${entry.chinese}`
      });
    });

    // 2. All words across all sentences from OCR
    sentences.forEach(s => {
      if (Array.isArray(s.words)) {
        s.words.forEach(w => {
          if (w.char && w.char.trim()) {
            const key = w.char.trim().toLowerCase();
            const existing = dict.get(key);
            
            let english = w.englishMeaning || "";
            let chinese = w.chineseMeaning || "";
            let pinyin = w.pinyin || "";

            if (!english && w.meaning) {
              const latinMatch = w.meaning.split(/[/|;()（）\n]/).map(x => x.trim()).find(x => /[A-Za-z]/.test(x) && !/[\u4e00-\u9fa5]/.test(x));
              if (latinMatch) english = latinMatch;
            }

            if (!chinese && (w.meaning || pinyin)) {
              const zhMatch = (w.meaning || "").match(/[\u4e00-\u9fa5]+/g);
              const zhText = zhMatch ? zhMatch.join(", ") : "";
              if (zhText && pinyin) chinese = `${zhText} (${pinyin})`;
              else if (zhText) chinese = zhText;
              else if (pinyin) chinese = pinyin;
            }

            dict.set(key, {
              english: english || existing?.english || "",
              chinese: chinese || existing?.chinese || "",
              pinyin: pinyin || existing?.pinyin || "",
              amBoi: w.amBoi || existing?.amBoi || "",
              meaning: w.meaning || existing?.meaning || ""
            });
          }
        });
      }
    });

    // 3. User's saved vocabList (highest priority)
    vocabList.forEach(v => {
      if (v.chinese && v.chinese.trim()) {
        const key = v.chinese.trim().toLowerCase();
        
        let english = "";
        let chinese = "";

        if (v.meaning) {
          const parts = v.meaning.split(/[/|;()（）\n]/).map(s => s.trim()).filter(Boolean);
          const latin = parts.find(p => /[A-Za-z]/.test(p) && !/[\u4e00-\u9fa5]/.test(p));
          if (latin) english = latin;
          else {
            const cleaned = v.meaning.replace(/[\u4e00-\u9fa5]+/g, "").trim().replace(/^[/,\s-]+|[/,\s-]+$/g, "");
            if (cleaned) english = cleaned;
          }
        }

        const zhMatches = (v.meaning || "").match(/[\u4e00-\u9fa5]+/g);
        const zhText = zhMatches ? zhMatches.join(", ") : (v.hanViet !== "-" ? v.hanViet : "");
        if (zhText && v.pinyin) {
          chinese = `${zhText} (${v.pinyin})`;
        } else if (zhText) {
          chinese = zhText;
        } else if (v.pinyin) {
          chinese = v.pinyin;
        }

        dict.set(key, {
          english: english || dict.get(key)?.english || v.meaning || "",
          chinese: chinese || dict.get(key)?.chinese || v.pinyin || "",
          pinyin: v.pinyin || dict.get(key)?.pinyin || "",
          amBoi: v.amBoi || dict.get(key)?.amBoi || "",
          meaning: v.meaning || dict.get(key)?.meaning || ""
        });
      }
    });

    return dict;
  }, [vocabList, sentences]);

  // Helper to extract word definition with fallback
  const lookupWord = (wordText: string): { english: string; chinese: string; pinyin: string; amBoi?: string } => {
    const cleanWord = wordText.trim().replace(/^["'([{«„]+|["')\]}»”.,!?;:]+$/g, "");
    const lower = cleanWord.toLowerCase();
    
    if (masterDictionary.has(lower)) {
      const item = masterDictionary.get(lower)!;
      return {
        english: item.english,
        chinese: item.chinese,
        pinyin: item.pinyin,
        amBoi: item.amBoi
      };
    }

    // Try partial word stems or single words if compound
    const subWords = lower.split(/\s+/);
    if (subWords.length > 1) {
      const resolvedSubs = subWords.map(sw => masterDictionary.get(sw)).filter(Boolean);
      if (resolvedSubs.length > 0) {
        return {
          english: resolvedSubs.map(r => r!.english).filter(Boolean).join(" / "),
          chinese: resolvedSubs.map(r => r!.chinese).filter(Boolean).join(" "),
          pinyin: resolvedSubs.map(r => r!.pinyin).filter(Boolean).join(" ")
        };
      }
    }

    return {
      english: "",
      chinese: "",
      pinyin: ""
    };
  };

  // Process sentences to ensure EVERY single word (even repeated ones) has meanings
  const processedSentences = useMemo(() => {
    // Sort all known keys by descending length for longest matching
    const knownKeys = (Array.from(masterDictionary.keys()) as string[]).sort((a, b) => b.length - a.length);

    return sentences.map(sentence => {
      const text = sentence.chinese || "";
      const newWords: ResolvedWord[] = [];
      
      // If sentence already has explicit words from OCR/API, enrich each of them
      if (Array.isArray(sentence.words) && sentence.words.length > 0) {
        sentence.words.forEach(w => {
          const char = (w.char || "").trim();
          if (!char) return;

          const lookedUp = lookupWord(char);
          const englishMeaning = w.englishMeaning || lookedUp.english || w.meaning || "";
          const chineseMeaning = w.chineseMeaning || lookedUp.chinese || (w.pinyin ? `${char} (${w.pinyin})` : lookedUp.pinyin) || "";

          newWords.push({
            char,
            pinyin: w.pinyin || lookedUp.pinyin || "",
            amBoi: w.amBoi || lookedUp.amBoi || "",
            meaning: w.meaning || lookedUp.english || "",
            englishMeaning,
            chineseMeaning
          });
        });

        if (newWords.length > 0) {
          return { ...sentence, words: newWords };
        }
      }

      // Fallback: tokenize sentence text using dictionary keys & whitespace
      let i = 0;
      while (i < text.length) {
        // Skip whitespace
        if (text[i] === " ") {
          i++;
          continue;
        }

        const remaining = text.slice(i);
        const remainingLower = remaining.toLowerCase();

        // 1. Try finding longest matching phrase in masterDictionary
        let matchedKey: string | null = null;
        for (const key of knownKeys) {
          if (remainingLower.startsWith(key)) {
            // Check boundary: next char should be space, punctuation, or end of string
            const nextChar = remainingLower[key.length];
            if (!nextChar || /\s|[.,!?;:()"'«»]/.test(nextChar)) {
              matchedKey = key;
              break;
            }
          }
        }

        if (matchedKey) {
          const matchedOriginalText = remaining.slice(0, matchedKey.length);
          const lookedUp = lookupWord(matchedOriginalText);

          newWords.push({
            char: matchedOriginalText,
            pinyin: lookedUp.pinyin,
            amBoi: lookedUp.amBoi || "",
            meaning: lookedUp.english,
            englishMeaning: lookedUp.english,
            chineseMeaning: lookedUp.chinese
          });
          i += matchedKey.length;
        } else {
          // Tokenize next single word until space or punctuation
          const match = remaining.match(/^([^\s.,!?;:()"'«»]+)([.,!?;:()"'«»]*)/);
          if (match) {
            const rawWord = match[1];
            const punct = match[2];
            const lookedUp = lookupWord(rawWord);

            newWords.push({
              char: rawWord,
              punctuation: punct,
              pinyin: lookedUp.pinyin,
              amBoi: lookedUp.amBoi || "",
              meaning: lookedUp.english,
              englishMeaning: lookedUp.english,
              chineseMeaning: lookedUp.chinese
            });
            i += match[0].length;
          } else {
            // Single char fallback
            const char = text[i];
            const lookedUp = lookupWord(char);
            newWords.push({
              char,
              pinyin: lookedUp.pinyin,
              amBoi: "",
              meaning: lookedUp.english,
              englishMeaning: lookedUp.english,
              chineseMeaning: lookedUp.chinese
            });
            i++;
          }
        }
      }

      return { ...sentence, words: newWords };
    });
  }, [sentences, masterDictionary]);

  const speak = (text: string) => {
    ttsService.speak(text, "vi-VN", playbackSpeed);
  };

  const toggleMastered = (index: number) => {
    const newList = [...sentences];
    newList[index].isMastered = !newList[index].isMastered;
    setSentences(newList);
  };

  const deleteSentence = (index: number) => {
    if (confirm(t.readingConfirmDelete)) {
      setSentences(sentences.filter((_, i) => i !== index));
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center justify-between bg-white p-3 rounded-2xl border border-neutral-200 shadow-sm">
          <span className="text-sm font-bold text-neutral-500">{t.readingSpeed}: {playbackSpeed}x</span>
          <input 
            type="range" 
            min="0.5" 
            max="1.5" 
            step="0.1" 
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            className="w-24 accent-emerald-600"
          />
        </div>
        <button 
          onClick={async () => {
            const allText = sentences.map(s => s.chinese).join(" ");
            setIsAnalyzing(true);
            try {
              await onAnalyzeGrammar(allText);
            } catch (error) {
              const handled = await onError(error);
              if (!handled) {
                alert(t.readingGrammarError);
              }
            } finally {
              setIsAnalyzing(false);
            }
          }}
          disabled={isAnalyzing}
          className="p-3 bg-white border border-neutral-200 rounded-2xl text-blue-600 hover:bg-blue-50 shadow-sm flex items-center gap-2 disabled:opacity-50"
          title={t.readingGrammarTooltip}
        >
          {isAnalyzing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
          <span className="text-xs font-bold">{t.readingGrammarAnalysis}</span>
        </button>
        <button 
          onClick={onUpload}
          disabled={isSyncing}
          className="p-3 bg-white border border-neutral-200 rounded-2xl text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 shadow-sm"
          title={t.readingSaveToSheet}
        >
          <Upload className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {processedSentences.map((sentence, i) => (
          <div 
            key={i}
            className={`bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden transition-all ${sentence.isMastered ? 'opacity-60' : ''}`}
          >
            <div className="p-6 space-y-6">
              {/* Word-by-word display: English above, Vietnamese in middle, Chinese/Pinyin below */}
              <div className="flex flex-wrap gap-x-5 gap-y-8 justify-center items-end py-2">
                {sentence.words.map((word, j) => {
                  const isInVocab = vocabList.some(v => v.chinese.toLowerCase() === word.char.toLowerCase());
                  return (
                    <div key={j} className="flex flex-col items-center group relative min-w-[54px]">
                      {/* Top: English meaning - ALWAYS displayed, even on repeat */}
                      {word.englishMeaning ? (
                        <span 
                          className="text-[11px] font-semibold text-sky-700 bg-sky-50/90 border border-sky-200/80 px-2 py-0.5 rounded-md mb-1 text-center tracking-tight max-w-[140px] truncate block shadow-xs"
                          title={`English: ${word.englishMeaning}`}
                        >
                          {word.englishMeaning}
                        </span>
                      ) : (
                        <span 
                          className="text-[10px] font-medium text-neutral-400 bg-neutral-50 px-1.5 py-0.5 rounded mb-1 text-center truncate max-w-[100px]"
                          title="Từ vựng"
                        >
                          {word.char}
                        </span>
                      )}

                      {/* Middle: Vietnamese Word */}
                      <div className="relative my-0.5 flex items-center">
                        <span 
                          className="text-2xl md:text-3xl font-bold text-neutral-800 hover:text-emerald-600 transition-colors cursor-pointer block tracking-wide select-none"
                          onClick={() => speak(word.char)}
                          title={`${t.chatListen}: ${word.char}`}
                        >
                          {word.char}
                        </span>
                        {!isInVocab && (
                          <button 
                            onClick={async () => {
                              setAddingWord(word.char);
                              await onAddVocab(word.char);
                              setAddingWord(null);
                            }}
                            disabled={addingWord === word.char}
                            className="absolute -top-2 -right-4 p-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            title={t.readingAddToVocab}
                          >
                            <Plus className={`w-3 h-3 ${addingWord === word.char ? 'animate-spin' : ''}`} />
                          </button>
                        )}
                      </div>

                      {/* Bottom: Chinese meaning & Pinyin - ALWAYS displayed, even on repeat */}
                      {word.chineseMeaning ? (
                        <span 
                          className="text-[11px] font-medium text-emerald-800 bg-emerald-50/90 border border-emerald-200/80 px-2 py-0.5 rounded-md mt-1 text-center tracking-tight max-w-[140px] truncate block shadow-xs"
                          title={`Chinese / Pinyin: ${word.chineseMeaning}`}
                        >
                          {word.chineseMeaning}
                        </span>
                      ) : (
                        <span 
                          className="text-[10px] font-medium text-neutral-400 bg-neutral-50 px-1.5 py-0.5 rounded mt-1 text-center truncate max-w-[100px]"
                        >
                          {word.pinyin || "—"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 pt-4 border-t border-neutral-50">
                <div className="text-sm text-emerald-600 font-medium text-center">{sentence.pinyin}</div>
                <div className="text-base text-neutral-700 font-bold text-center italic">"{sentence.meaning}"</div>
              </div>
            </div>

            <div className="bg-neutral-50 px-4 py-3 flex items-center justify-between">
              <div className="flex gap-2">
                <button 
                  onClick={() => speak(sentence.chinese)}
                  className="p-2 bg-white rounded-xl shadow-sm text-emerald-600 hover:bg-emerald-50 transition-colors"
                >
                  <Play className="w-5 h-5 fill-current" />
                </button>
                <button 
                  onClick={async () => {
                    try {
                      await onAnalyzeGrammar(sentence.chinese);
                    } catch (error) {
                      const handled = await onError(error);
                      if (!handled) {
                        alert(t.readingGrammarError);
                      }
                    }
                  }}
                  className="p-2 bg-white rounded-xl shadow-sm text-blue-600 hover:bg-blue-50 transition-colors"
                  title={t.readingAnalyzeGrammar}
                >
                  <FileText className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => toggleMastered(i)}
                  className={`p-2 rounded-xl shadow-sm transition-colors ${sentence.isMastered ? 'bg-emerald-500 text-white' : 'bg-white text-neutral-300'}`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => deleteSentence(i)}
                  className="p-2 bg-white rounded-xl shadow-sm text-neutral-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {sentences.length === 0 && (
          <div className="text-center py-20 text-neutral-400">{t.readingNoContent}</div>
        )}
      </div>
    </motion.div>
  );
}


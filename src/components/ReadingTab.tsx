import React, { useState, useMemo } from "react";
import { Volume2, CheckCircle2, Trash2, FileText, ChevronRight, Play, Upload, ChevronLeft, Plus, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { ReadingSentence, ReadingWord, Vocabulary } from "../types";
import { ttsService } from "../services/ttsService";
import { useLanguage } from "../contexts/LanguageContext";

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

export default function ReadingTab({ sentences, setSentences, vocabList, onUpload, isSyncing, onAnalyzeGrammar, onAddVocab, onError }: Props) {
  const { t } = useLanguage();
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [addingWord, setAddingWord] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Helper to extract English meaning (for top label)
  const getEnglishMeaning = (word: ReadingWord, vocab?: Vocabulary | null): string => {
    if (word.englishMeaning && word.englishMeaning.trim()) return word.englishMeaning;
    
    const source = (vocab?.meaning || word.meaning || "").trim();
    if (!source) return "";

    const parts = source.split(/[/|;()（）\n]/).map(s => s.trim()).filter(Boolean);
    const latinPart = parts.find(p => /[A-Za-z]/.test(p) && !/[\u4e00-\u9fa5]/.test(p));
    if (latinPart) return latinPart;

    const withoutChinese = source.replace(/[\u4e00-\u9fa5]+/g, "").trim().replace(/^[/,\s-]+|[/,\s-]+$/g, "");
    if (withoutChinese) return withoutChinese;

    return source;
  };

  // Helper to extract Chinese meaning and Pinyin (for bottom label)
  const getChineseAndPinyin = (word: ReadingWord, vocab?: Vocabulary | null): string => {
    if (word.chineseMeaning && word.chineseMeaning.trim()) return word.chineseMeaning;

    const pinyin = word.pinyin || vocab?.pinyin || "";
    const hanzi = vocab?.hanViet || "";
    
    const source = (vocab?.meaning || word.meaning || "").trim();
    const chineseMatches = source.match(/[\u4e00-\u9fa5]+/g);
    const chineseText = chineseMatches ? chineseMatches.join(", ") : "";

    if (chineseText && pinyin) {
      return `${chineseText} (${pinyin})`;
    } else if (chineseText) {
      return chineseText;
    } else if (pinyin) {
      return pinyin;
    } else if (hanzi && hanzi !== "-") {
      return hanzi;
    }
    return word.amBoi || "";
  };

  // Helper to find the best match in vocabList for a given string starting at index
  const findBestMatch = (text: string, startIndex: number) => {
    let bestMatch: Vocabulary | null = null;
    let maxLength = 0;

    for (const vocab of vocabList) {
      if (text.startsWith(vocab.chinese, startIndex)) {
        if (vocab.chinese.length > maxLength) {
          maxLength = vocab.chinese.length;
          bestMatch = vocab;
        }
      }
    }
    return bestMatch;
  };

  // Process sentences to use vocabList data and handle compound words
  const processedSentences = useMemo(() => {
    return sentences.map(sentence => {
      const text = sentence.chinese;
      const newWords: ReadingWord[] = [];
      let i = 0;

      while (i < text.length) {
        // 1. Try to find the longest match in vocabList
        const vocabMatch = findBestMatch(text, i);
        
        // 2. Try to find if the OCR result already has a grouped word starting here
        const ocrMatch = sentence.words?.find(w => text.startsWith(w.char, i));

        // Prioritize the longer match
        if (vocabMatch && (!ocrMatch || vocabMatch.chinese.length >= ocrMatch.char.length)) {
          const rawWord: ReadingWord = {
            char: vocabMatch.chinese,
            amBoi: vocabMatch.amBoi,
            meaning: vocabMatch.meaning,
            pinyin: vocabMatch.pinyin
          };
          newWords.push({
            ...rawWord,
            englishMeaning: getEnglishMeaning(rawWord, vocabMatch),
            chineseMeaning: getChineseAndPinyin(rawWord, vocabMatch)
          });
          i += vocabMatch.chinese.length;
        } else if (ocrMatch) {
          const matchedVocab = vocabList.find(v => v.chinese === ocrMatch.char);
          newWords.push({
            char: ocrMatch.char,
            amBoi: ocrMatch.amBoi,
            meaning: ocrMatch.meaning,
            pinyin: ocrMatch.pinyin || matchedVocab?.pinyin,
            englishMeaning: ocrMatch.englishMeaning || getEnglishMeaning(ocrMatch, matchedVocab),
            chineseMeaning: ocrMatch.chineseMeaning || getChineseAndPinyin(ocrMatch, matchedVocab)
          });
          i += ocrMatch.char.length;
        } else {
          // Fallback to single character
          newWords.push({
            char: text[i],
            amBoi: "",
            meaning: "",
            englishMeaning: "",
            chineseMeaning: ""
          });
          i++;
        }
      }

      return { ...sentence, words: newWords };
    });
  }, [sentences, vocabList]);

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
                  const isInVocab = vocabList.some(v => v.chinese === word.char);
                  return (
                    <div key={j} className="flex flex-col items-center group relative min-w-[50px]">
                      {/* Top: English meaning */}
                      {word.englishMeaning ? (
                        <span 
                          className="text-[11px] font-semibold text-sky-700 bg-sky-50 border border-sky-100 px-1.5 py-0.5 rounded-md mb-1 text-center tracking-tight max-w-[130px] truncate block"
                          title={`English: ${word.englishMeaning}`}
                        >
                          {word.englishMeaning}
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-400 font-medium mb-1">&nbsp;</span>
                      )}

                      {/* Middle: Vietnamese Word */}
                      <div className="relative my-0.5">
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

                      {/* Bottom: Chinese meaning & Pinyin */}
                      {word.chineseMeaning ? (
                        <span 
                          className="text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md mt-1 text-center tracking-tight max-w-[130px] truncate block"
                          title={`Chinese / Pinyin: ${word.chineseMeaning}`}
                        >
                          {word.chineseMeaning}
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-400 font-medium mt-1">&nbsp;</span>
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

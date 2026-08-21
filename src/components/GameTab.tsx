import React, { useState, useEffect, useMemo } from "react";
import { Vocabulary } from "../types";
import { geminiService } from "../services/geminiService";
import { ttsService } from "../services/ttsService";
import { 
  Trophy, 
  RotateCcw, 
  ArrowRight, 
  Volume2, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  Link as LinkIcon, 
  ArrowRightLeft, 
  Search, 
  Play, 
  Pause,
  Loader2 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";

type GameView = 'explore' | 'quiz';
type QuizMode = 'zh-vi' | 'vi-zh'; // 'zh-vi': Question in Vietnamese, Options in Meaning. 'vi-zh': Question in Meaning, Options in Vietnamese.

interface GameData {
  related: { chinese: string; pinyin: string; meaning: string; reason: string; hanViet: string }[];
  antonyms: { chinese: string; pinyin: string; meaning: string; hanViet: string }[];
  characterAnalysis: { char: string; components?: string; meaning: string; examples: { chinese: string; pinyin: string; meaning: string; hanViet: string }[] }[];
}

interface MillionaireQuizProps {
  vocabList: Vocabulary[];
  filteredVocab: Vocabulary[];
  onBack: () => void;
  onError: (error: any) => void | Promise<any>;
}

const MillionaireQuiz: React.FC<MillionaireQuizProps> = ({ vocabList, filteredVocab, onBack }) => {
  const { t } = useLanguage();
  const [quizMode, setQuizMode] = useState<QuizMode>('zh-vi');
  const [timerLimit, setTimerLimit] = useState(10);
  const [status, setStatus] = useState<'idle' | 'playing' | 'result' | 'gameover'>('idle');
  const [currentQuestion, setCurrentQuestion] = useState<Vocabulary | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(timerLimit);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const speakText = (text: string, forceLang?: "vi-VN" | "zh-CN" | "en-US") => {
    ttsService.speak(text, forceLang, 0.95);
  };

  const speakQuestionPrompt = (q: Vocabulary, mode: QuizMode) => {
    ttsService.stop();
    if (mode === 'zh-vi') {
      // Question is Vietnamese word (e.g., 'thành công')
      speakText(q.chinese, 'vi-VN');
    } else {
      // Question is Meaning (e.g., '成功' in Chinese or 'Success' in English)
      speakText(q.meaning);
    }
  };

  const speakAnswerResult = (q: Vocabulary, mode: QuizMode) => {
    ttsService.stop();
    if (mode === 'zh-vi') {
      // Correct answer is Meaning
      speakText(q.meaning);
    } else {
      // Correct answer is Vietnamese word
      speakText(q.chinese, 'vi-VN');
    }
  };

  const generateQuestion = () => {
    if (filteredVocab.length < 4) {
      alert(t.gameNeedFourWords);
      onBack();
      return;
    }

    const question = filteredVocab[Math.floor(Math.random() * filteredVocab.length)];
    const correct = quizMode === 'zh-vi' ? question.meaning : question.chinese;
    
    let distractors = vocabList
      .filter(v => v.chinese !== question.chinese)
      .map(v => (quizMode === 'zh-vi' ? v.meaning : v.chinese));
    
    distractors = Array.from(new Set(distractors)).sort(() => Math.random() - 0.5).slice(0, 3);
    const allOptions = [...distractors, correct].sort(() => Math.random() - 0.5);
    
    setCurrentQuestion(question);
    setCorrectAnswer(correct);
    setOptions(allOptions);
    setTimeLeft(timerLimit);
    setSelectedAnswer(null);
    setStatus('playing');

    setTimeout(() => speakQuestionPrompt(question, quizMode), 100);
  };

  useEffect(() => {
    let timer: any;
    if (status === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleAnswer(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [status, timeLeft]);

  const handleAnswer = (answer: string | null) => {
    setSelectedAnswer(answer);
    if (answer === correctAnswer) {
      if (currentQuestion) {
        speakAnswerResult(currentQuestion, quizMode);
      }
      setScore(prev => prev + (streak + 1) * 100);
      setStreak(prev => prev + 1);
      setStatus('result');
      setTimeout(() => generateQuestion(), 1300);
    } else {
      setStatus('gameover');
    }
  };

  if (status === 'idle') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-4 sm:py-10 space-y-4 sm:space-y-8 animate-in fade-in zoom-in duration-300 w-full max-w-sm mx-auto">
        <div className="relative shrink-0">
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-indigo-600 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-200">
            <Trophy className="w-8 h-8 sm:w-12 sm:h-12 text-amber-400" />
          </div>
          <Sparkles className="absolute -top-2 -right-2 text-amber-500 animate-pulse w-4 h-4 sm:w-6 sm:h-6" />
        </div>
        
        <div className="text-center space-y-1 sm:space-y-2 px-4">
          <h3 className="text-2xl sm:text-3xl font-bold text-neutral-800">{t.gameQuizTitle}</h3>
          <p className="text-sm sm:text-base text-neutral-500 font-medium">{t.gameQuizSubtitle} {timerLimit}s</p>
        </div>

        <div className="w-full px-6 space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-widest block text-center">{t.gameQuizMode}</span>
            <div className="bg-neutral-100 p-1 rounded-2xl flex">
              <button 
                onClick={() => setQuizMode('zh-vi')}
                className={`flex-1 py-2 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${quizMode === 'zh-vi' ? 'bg-white shadow text-indigo-600' : 'text-neutral-500'}`}
              >
                {t.gameModeZhVi}
              </button>
              <button 
                onClick={() => setQuizMode('vi-zh')}
                className={`flex-1 py-2 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${quizMode === 'vi-zh' ? 'bg-white shadow text-indigo-600' : 'text-neutral-500'}`}
              >
                {t.gameModeViZh}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-widest block text-center">{t.gameThinkingTime}</span>
            <div className="flex justify-between gap-2">
              {[3, 5, 10, 15].map(sec => (
                <button
                  key={sec}
                  onClick={() => {
                    setTimerLimit(sec);
                    setTimeLeft(sec);
                  }}
                  className={`flex-1 py-2 rounded-xl font-bold text-[10px] sm:text-xs transition-all border-2 ${timerLimit === sec ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-neutral-100 text-neutral-400'}`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button 
              onClick={generateQuestion}
              className="w-full py-4 sm:py-5 bg-indigo-600 text-white rounded-[1.5rem] sm:rounded-[2rem] font-bold text-lg sm:text-xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              {t.gameStart} <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            
            <button onClick={onBack} className="w-full py-2 text-neutral-400 font-bold text-sm hover:text-neutral-600 transition-colors cursor-pointer">
              {t.gameBack}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'gameover') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-6 sm:py-10 space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-10 duration-500 w-full max-w-sm mx-auto">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-rose-100 rounded-full flex items-center justify-center shrink-0">
          <RotateCcw className="w-8 h-8 sm:w-10 sm:h-10 text-rose-600" />
        </div>
        <div className="text-center px-4">
          <h3 className="text-3xl sm:text-4xl font-black text-neutral-800 mb-2">{t.gameOver}</h3>
          <p className="text-sm sm:text-base text-neutral-500 font-medium italic">{t.gameStoppedAt}</p>
          <p className="text-4xl sm:text-5xl font-black text-indigo-600 mt-2 sm:mt-4">${score.toLocaleString()}</p>
        </div>
        <div className="w-full px-6 space-y-3">
          <button 
            onClick={generateQuestion}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" /> {t.playAgain}
          </button>
          <button onClick={() => setStatus('idle')} className="w-full py-3 text-neutral-400 font-bold text-sm hover:text-neutral-600 transition-colors cursor-pointer">
            {t.gameBack}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between max-w-xl mx-auto w-full p-4 sm:p-6 overflow-hidden">
      {/* Header Info */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-3 bg-white px-3 sm:px-4 py-2 rounded-2xl shadow-sm border border-neutral-100">
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 shrink-0" />
          <div>
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block leading-none">{t.gamePrize}</span>
            <span className="text-sm sm:text-base font-black text-neutral-800">${score.toLocaleString()}</span>
          </div>
        </div>

        {/* Timer Gauge */}
        <div className="flex flex-col items-center">
          <div className="text-center font-black text-lg sm:text-xl text-indigo-600 leading-none">{timeLeft}s</div>
          <div className="w-20 sm:w-24 h-1.5 bg-neutral-200 rounded-full mt-1.5 overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 rounded-full ${timeLeft <= 3 ? 'bg-rose-500' : 'bg-indigo-600'}`} 
              style={{ width: `${(timeLeft / timerLimit) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 bg-white px-3 sm:px-4 py-2 rounded-2xl shadow-sm border border-neutral-100">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 shrink-0" />
          <div>
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block leading-none">{t.gameStreak}</span>
            <span className="text-sm sm:text-base font-black text-neutral-800">x{streak}</span>
          </div>
        </div>
      </div>

      {/* Main Question Box */}
      <div className="my-auto space-y-4 sm:space-y-6">
        <div className="bg-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-xl border-b-4 sm:border-b-8 border-indigo-100 text-center relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-6 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest">{t.gameQuestionLabel}</div>
          <h4 className="text-2xl sm:text-4xl font-black text-neutral-800 break-words leading-tight">
            {quizMode === 'zh-vi' ? currentQuestion?.chinese : currentQuestion?.meaning}
          </h4>
          {quizMode === 'zh-vi' ? (
            <div className="mt-4 space-y-2">
              <p className="text-xl font-bold text-indigo-500 italic">{currentQuestion?.pinyin}</p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-neutral-400 font-medium italic">{t.gameSelectHanzi}</p>
          )}
          
          <button 
            onClick={() => currentQuestion && speakQuestionPrompt(currentQuestion, quizMode)}
            className="mt-4 p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors active:scale-90 cursor-pointer"
            title={t.gameListenAgain}
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:gap-4 overflow-y-auto pr-1">
          {options.map((opt, i) => {
            const optPinyin = quizMode === 'vi-zh' ? vocabList.find(v => v.chinese === opt)?.pinyin : null;
            let btnClass = "bg-white border-2 border-neutral-100 text-neutral-600 hover:border-indigo-200";
            if (selectedAnswer === opt) {
              btnClass = opt === correctAnswer ? "bg-emerald-500 border-emerald-500 text-white scale-105" : "bg-rose-500 border-rose-500 text-white";
            } else if (selectedAnswer && opt === correctAnswer) {
              btnClass = "bg-emerald-50 border-emerald-500 text-emerald-600";
            }

            return (
              <button
                key={i}
                disabled={status !== 'playing'}
                onClick={() => handleAnswer(opt)}
                className={`w-full py-3 sm:py-5 px-4 sm:px-6 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg text-center transition-all flex items-center justify-between group min-h-[4rem] sm:h-22 ${btnClass} active:scale-95 cursor-pointer`}
              >
                <div className="flex items-center gap-3 sm:gap-4 w-full">
                   <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-black shrink-0 ${selectedAnswer === opt ? 'bg-white/20' : 'bg-neutral-100 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                      {String.fromCharCode(65 + i)}
                   </div>
                   <div className="flex-1 text-center min-w-0">
                     <span className="block leading-tight truncate sm:whitespace-normal">{opt}</span>
                     {optPinyin && <span className={`block text-[10px] sm:text-xs italic font-medium truncate ${selectedAnswer === opt ? 'text-white/80' : 'text-indigo-400'}`}>{optPinyin}</span>}
                   </div>
                   <div 
                     onClick={(e) => {
                       e.stopPropagation();
                       speakText(opt, quizMode === 'vi-zh' ? 'vi-VN' : undefined);
                     }}
                     className="p-1.5 text-neutral-300 hover:text-indigo-600 hover:bg-neutral-100 rounded-lg transition-colors"
                     title="Nghe phát âm"
                   >
                     <Volume2 className="w-4 h-4" />
                   </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface GameTabProps {
  vocabList: Vocabulary[];
  onError: (error: any) => void | Promise<any>;
  onAddVocab?: (word: string) => Promise<void>;
  onToggleMastery?: (chinese: string) => Promise<void>;
  key?: string;
  searchQuery?: string;
  filterStatus?: "all" | "mastered" | "unmastered";
  sortOrder?: "newest" | "alpha";
  selectedWordTypes?: string[];
  selectedTopics?: string[];
}

interface WordCardProps {
  word: string;
  pinyin: string;
  hanViet: string;
  meaning: string;
  reason?: string;
  isAI?: boolean;
  vocabList: Vocabulary[];
  onAddVocab?: (word: string) => Promise<void>;
  onToggleMastery?: (chinese: string) => Promise<void>;
  onExplore: (word: string) => void;
}

const WordCard = ({ 
  word, 
  pinyin, 
  hanViet, 
  meaning, 
  reason, 
  vocabList, 
  onAddVocab, 
  onToggleMastery,
  onExplore
}: WordCardProps) => {
  const { t } = useLanguage();
  const vocabItem = vocabList.find(v => v.chinese === word);
  const inNotebook = !!vocabItem;
  const isMastered = vocabItem?.isMastered || false;

  return (
    <div className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between gap-4">
        <button 
          onClick={() => onExplore(word)}
          className="flex-1 flex items-center gap-4 text-left cursor-pointer"
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold transition-colors shrink-0 ${inNotebook ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
            {word}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-bold text-neutral-800 italic">{pinyin}</span>
              {hanViet && <span className="text-[11px] font-bold text-emerald-600 uppercase">({hanViet})</span>}
            </div>
            <p className="text-sm text-neutral-600 font-medium line-clamp-1">{meaning}</p>
            {reason && <p className="text-[10px] text-emerald-500 font-bold mt-1 bg-emerald-50 px-1.5 py-0.5 rounded inline-block uppercase">{reason}</p>}
          </div>
        </button>
        
        <div className="flex items-center gap-1 pt-1 shrink-0">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              ttsService.speak(word, 'vi-VN');
            }}
            className="p-2 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
            title="Nghe phát âm tiếng Việt"
          >
            <Volume2 className="w-5 h-5" />
          </button>

          {inNotebook ? (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onToggleMastery?.(word);
              }}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${isMastered ? 'text-emerald-500 bg-emerald-50' : 'text-neutral-300 hover:text-emerald-500 hover:bg-emerald-50'}`}
              title={isMastered ? t.gameInNotebook : t.gameMarkMasteredTooltip}
            >
              <CheckCircle2 className={`w-5 h-5 ${isMastered ? 'fill-current' : ''}`} />
            </button>
          ) : (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onAddVocab?.(word);
              }}
              className="p-2 text-neutral-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
              title={t.gameAddToNotebookTooltip}
            >
              <BookOpen className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function GameTab({ 
  vocabList, 
  onError, 
  onAddVocab, 
  onToggleMastery,
  searchQuery = "",
  filterStatus = "all",
  sortOrder = "newest",
  selectedWordTypes = [],
  selectedTopics = []
}: GameTabProps) {
  const { t, language } = useLanguage();
  const [view, setView] = useState<GameView>('explore');
  const [searchTerm, setSearchTerm] = useState("");
  const [currentWord, setCurrentWord] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<GameData | null>(null);
  const [orderMode, setOrderMode] = useState<'random' | 'sequential'>('random');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlayingFullSequence, setIsPlayingFullSequence] = useState(false);

  const filteredVocab = useMemo(() => {
    let list = [...vocabList];

    if (searchQuery) {
      list = list.filter(v => 
        v.chinese.includes(searchQuery) || 
        v.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.topic.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filterStatus === "mastered") {
      list = list.filter(v => v.isMastered);
    } else if (filterStatus === "unmastered") {
      list = list.filter(v => !v.isMastered);
    }
    
    if (selectedWordTypes.length > 0) {
      list = list.filter(v => selectedWordTypes.includes(v.wordType));
    }
    
    if (selectedTopics.length > 0) {
      list = list.filter(v => selectedTopics.includes(v.topic));
    }

    if (sortOrder === "alpha") {
      list.sort((a, b) => a.chinese.localeCompare(b.chinese, 'vi'));
    } else {
      list.reverse();
    }

    return list.filter(v => v.wordType !== "Mẫu câu" && v.chinese.length < 15);
  }, [vocabList, searchQuery, filterStatus, sortOrder, selectedWordTypes, selectedTopics]);

  const playExploreSequence = async () => {
    if (!data || !currentWord) return;

    setIsPlayingFullSequence(true);
    const helperLang = language === 'zh' ? 'zh-CN' : language === 'en' ? 'en-US' : 'vi-VN';
    const items: { text: string, lang?: "vi-VN" | "zh-CN" | "en-US" }[] = [
      { text: currentWord, lang: 'vi-VN' }
    ];
    
    data.characterAnalysis.forEach(char => {
      items.push({ text: `${t.gameCharAnalysisPrefix} ${char.char}`, lang: helperLang });
      items.push({ text: char.char, lang: 'vi-VN' });
      
      const notebookWords = vocabList
        .filter(v => v.chinese.includes(char.char) && v.chinese !== currentWord && v.wordType !== "Mẫu câu" && v.chinese.length < 15)
        .map(v => v.chinese);
      
      notebookWords.forEach(w => items.push({ text: w, lang: 'vi-VN' }));
      char.examples.forEach(ex => items.push({ text: ex.chinese, lang: 'vi-VN' }));
    });

    if (data.related.length > 0) {
      items.push({ text: t.gameRelatedExpansion, lang: helperLang });
      data.related.forEach(rel => items.push({ text: rel.chinese, lang: 'vi-VN' }));
    }

    if (data.antonyms.length > 0) {
      items.push({ text: t.gameAntonyms, lang: helperLang });
      data.antonyms.forEach(ant => items.push({ text: ant.chinese, lang: 'vi-VN' }));
    }

    await ttsService.speakSequence(items, 300);
    setIsPlayingFullSequence(false);
  };

  const stopExploreSequence = () => {
    ttsService.stop();
    setIsPlayingFullSequence(false);
  };

  const exploreWord = async (word: string) => {
    if (!word) return;
    ttsService.stop();
    setIsPlayingFullSequence(false);
    setLoading(true);
    setCurrentWord(word);
    setSearchTerm("");
    
    try {
      const existingWords = vocabList.map(v => v.chinese);
      const result = await geminiService.getRelatedWords(word, existingWords);
      setData(result);
      
      // Immediately speak the word when explored
      setTimeout(() => {
        ttsService.speak(word, 'vi-VN');
      }, 150);
    } catch (error) {
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (filteredVocab.length === 0) return;

    if (orderMode === 'random') {
      const randomWord = filteredVocab[Math.floor(Math.random() * filteredVocab.length)].chinese;
      exploreWord(randomWord);
    } else {
      const nextIdx = (currentIndex + 1) % filteredVocab.length;
      setCurrentIndex(nextIdx);
      exploreWord(filteredVocab[nextIdx].chinese);
    }
  };

  return (
    <div className={`max-w-2xl mx-auto h-full flex flex-col ${view === 'quiz' ? 'p-0' : 'p-4 space-y-6'}`}>
      {/* Mode Switcher */}
      <div className={`bg-neutral-100 p-1 rounded-2xl flex w-full max-w-sm mx-auto shadow-inner shrink-0 ${view === 'quiz' ? 'mt-4 mx-4 w-[calc(100%-2rem)]' : ''}`}>
        <button 
          onClick={() => {
            ttsService.stop();
            setView('explore');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${view === 'explore' ? 'bg-white shadow text-emerald-600' : 'text-neutral-500'}`}
        >
          <Sparkles className="w-4 h-4" /> {t.gameExploreTab}
        </button>
        <button 
          onClick={() => {
            ttsService.stop();
            setView('quiz');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${view === 'quiz' ? 'bg-white shadow text-indigo-600' : 'text-neutral-500'}`}
        >
          <Trophy className="w-4 h-4" /> {t.gameQuizTab}
        </button>
      </div>

      {view === 'quiz' ? (
        <MillionaireQuiz 
          vocabList={vocabList} 
          filteredVocab={filteredVocab} 
          onBack={() => setView('explore')} 
          onError={(err: any) => onError(err)}
        />
      ) : (
        <>
          {/* Search & Controls */}
          <div className="space-y-4">
            <div className="relative group">
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && exploreWord(searchTerm)}
                placeholder={t.gameSearchPlaceholder}
                className="w-full pl-12 pr-12 py-3 bg-white border-2 border-neutral-100 rounded-2xl shadow-sm focus:border-emerald-500 focus:ring-0 transition-all text-base"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-emerald-500" />
              <button 
                onClick={() => exploreWord(searchTerm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-neutral-100 rounded-full text-emerald-600 transition-colors cursor-pointer"
              >
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex bg-neutral-100 p-1 rounded-xl w-fit">
                <button 
                  onClick={() => setOrderMode('random')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${orderMode === 'random' ? 'bg-white shadow text-emerald-600' : 'text-neutral-500 hover:text-neutral-700'}`}
                >
                  {t.gameRandomOrder}
                </button>
                <button 
                  onClick={() => setOrderMode('sequential')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${orderMode === 'sequential' ? 'bg-white shadow text-emerald-600' : 'text-neutral-500 hover:text-neutral-700'}`}
                >
                  {t.gameSequentialOrder}
                </button>
              </div>

              {data && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={isPlayingFullSequence ? stopExploreSequence : playExploreSequence}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                      isPlayingFullSequence ? 'bg-rose-500 text-white animate-pulse' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                    }`}
                    title={isPlayingFullSequence ? "Dừng đọc" : "Đọc toàn bộ bài phân tích"}
                  >
                    {isPlayingFullSequence ? <Pause className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    {isPlayingFullSequence ? "Dừng đọc" : "Đọc toàn bộ"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 space-y-4 text-neutral-500">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
                <p className="font-medium animate-pulse">{t.gameExploring}</p>
              </motion.div>
            ) : data ? (
              <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                {/* Root Word Card */}
                <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-neutral-50 text-center relative overflow-hidden">
                   <div className="absolute top-4 right-4 flex items-center gap-2">
                      <button 
                        onClick={() => ttsService.speak(currentWord, 'vi-VN')}
                        className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-colors shadow-sm cursor-pointer"
                        title="Nghe phát âm tiếng Việt"
                      >
                        <Volume2 className="w-6 h-6" />
                      </button>

                      {vocabList.find(v => v.chinese === currentWord) ? (
                        <button 
                          onClick={() => onToggleMastery?.(currentWord)}
                          className={`p-3 rounded-2xl transition-all cursor-pointer ${vocabList.find(v => v.chinese === currentWord)?.isMastered ? 'bg-emerald-500 text-white shadow-lg' : 'bg-neutral-100 text-neutral-300 hover:text-emerald-500'}`}
                          title={t.gameMarkMasteredTooltip}
                        >
                          <CheckCircle2 className="w-6 h-6" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => onAddVocab?.(currentWord)} 
                          className="p-3 bg-neutral-50 text-neutral-400 rounded-2xl hover:text-emerald-600 cursor-pointer"
                          title={t.gameAddToNotebookTooltip}
                        >
                          <BookOpen className="w-6 h-6" />
                        </button>
                      )}
                   </div>
                   <h2 className="text-5xl sm:text-6xl font-bold text-neutral-800 mb-2">{currentWord}</h2>
                   <div className="space-y-1">
                     <p className="text-xl text-emerald-600 font-bold uppercase tracking-widest">{vocabList.find(v => v.chinese === currentWord)?.hanViet || "HÁN VIỆT"}</p>
                     <p className="text-lg text-neutral-500 italic">{vocabList.find(v => v.chinese === currentWord)?.pinyin || ""}</p>
                     <p className="text-lg text-neutral-400 font-medium">{vocabList.find(v => v.chinese === currentWord)?.meaning || ""}</p>
                   </div>
                </div>

                {/* Character Analysis Sections */}
                {data.characterAnalysis.map((char, charIdx) => (
                  <div key={charIdx} className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-xl font-bold text-indigo-600 border border-indigo-100">{char.char}</div>
                        <div>
                          <p className="font-bold text-neutral-800 text-lg uppercase tracking-tight">{char.meaning}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => ttsService.speak(char.char, 'vi-VN')}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Nghe phát âm tiếng này"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 pl-4">
                      {/* Notebook Words for this char */}
                      {vocabList.filter(v => v.chinese.includes(char.char) && v.chinese !== currentWord && v.wordType !== "Mẫu câu" && v.chinese.length < 7).map((v, i) => (
                        <WordCard 
                          key={`nb-${charIdx}-${i}`} 
                          word={v.chinese} 
                          pinyin={v.pinyin} 
                          hanViet={v.hanViet} 
                          meaning={v.meaning} 
                          vocabList={vocabList}
                          onAddVocab={onAddVocab}
                          onToggleMastery={onToggleMastery}
                          onExplore={exploreWord}
                        />
                      ))}
                      {/* AI Examples for this char */}
                      {char.examples.map((ex, i) => (
                        <WordCard 
                          key={`ex-${charIdx}-${i}`} 
                          word={ex.chinese} 
                          pinyin={ex.pinyin} 
                          hanViet={ex.hanViet} 
                          meaning={ex.meaning} 
                          isAI 
                          vocabList={vocabList}
                          onAddVocab={onAddVocab}
                          onToggleMastery={onToggleMastery}
                          onExplore={exploreWord}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {/* Related Words Section */}
                {data.related.length > 0 && (
                  <div className="space-y-4 pt-4">
                     <div className="flex items-center gap-2 px-2">
                        <LinkIcon className="w-5 h-5 text-emerald-500" />
                        <h3 className="font-bold text-neutral-800">{t.gameRelatedExpansion}</h3>
                     </div>
                     <div className="grid grid-cols-1 gap-3">
                       {data.related.map((rel, i) => (
                         <WordCard 
                           key={`rel-${i}`} 
                           word={rel.chinese} 
                           pinyin={rel.pinyin} 
                           hanViet={rel.hanViet} 
                           meaning={rel.meaning} 
                           reason={rel.reason} 
                           isAI 
                           vocabList={vocabList}
                           onAddVocab={onAddVocab}
                           onToggleMastery={onToggleMastery}
                           onExplore={exploreWord}
                         />
                       ))}
                     </div>
                  </div>
                )}

                {/* Antonyms Section */}
                {data.antonyms.length > 0 && (
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-2 px-2">
                      <ArrowRightLeft className="w-5 h-5 text-rose-500" />
                      <h3 className="font-bold text-neutral-800">{t.gameAntonyms}</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                       {data.antonyms.map((ant, i) => (
                         <WordCard 
                           key={`ant-${i}`} 
                           word={ant.chinese} 
                           pinyin={ant.pinyin} 
                           hanViet={ant.hanViet} 
                           meaning={ant.meaning} 
                           isAI 
                           vocabList={vocabList}
                           onAddVocab={onAddVocab}
                           onToggleMastery={onToggleMastery}
                           onExplore={exploreWord}
                         />
                       ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-center pt-6">
                  <button onClick={handleNext} className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg hover:bg-emerald-700 transition-all cursor-pointer">
                    {t.gameNext} <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-emerald-400" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-2xl font-bold text-neutral-800">{t.gameEmptyTitle}</h4>
                  <p className="text-neutral-500 max-w-xs">{t.gameEmptyDesc}</p>
                </div>
                <button onClick={handleNext} className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2 cursor-pointer">
                  <Play className="w-5 h-5 fill-current" /> {t.gameStartExplore}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
         </>
        )}
    </div>
  );
}

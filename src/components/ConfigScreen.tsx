import { useState, useEffect } from "react";
import { AppConfig } from "../types";
import { Settings, RefreshCw, ChevronDown, ChevronUp, Check, AlertCircle } from "lucide-react";
import { googleSheetService } from "../services/googleSheetService";
import { useLanguage } from "../contexts/LanguageContext";
import LanguageSelector from "./LanguageSelector";

export const DEFAULT_SHEET_URL = "https://docs.google.com/spreadsheets/d/1XsnOHbZ_w7p956Qtuh2fISfZIZJrH55lurffndGxnII/edit?usp=sharing";
export const DEFAULT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbziMUG6ckU7HXNBJoaFJk9_C7oNC9sDM2jrFOfdRiPo3KbnAFK8AwbfcycTFZIKWMBm/exec";

interface Props {
  initialConfig?: AppConfig | null;
  onSave: (config: AppConfig) => void;
  onSync: () => void;
}

export default function ConfigScreen({ initialConfig, onSave, onSync }: Props) {
  const { t } = useLanguage();
  const [sheetUrl, setSheetUrl] = useState(
    initialConfig?.sheetUrl || DEFAULT_SHEET_URL
  );
  const [scriptUrl, setScriptUrl] = useState(
    initialConfig?.scriptUrl || DEFAULT_SCRIPT_URL
  );

  // Custom sheet names configuration
  const [vocabSheetName, setVocabSheetName] = useState(initialConfig?.vocabSheetName || "từ vựng");
  const [readingSheetName, setReadingSheetName] = useState(initialConfig?.readingSheetName || "luyện đọc");
  const [grammarSheetName, setGrammarSheetName] = useState(initialConfig?.grammarSheetName || "ngữ pháp");
  const [ocrSheetName, setOcrSheetName] = useState(initialConfig?.ocrSheetName || "OCR");

  const [showAdvanced, setShowAdvanced] = useState(true);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const extractSheetId = (url: string) => {
    const match = url.match(/\/d\/(.*?)(\/|$)/);
    return match ? match[1] : url;
  };

  const handleScanSheets = async (isManualParam?: any) => {
    const isManual = isManualParam === true;
    if (!sheetUrl || !scriptUrl) {
      return;
    }
    setIsScanning(true);
    if (isManual) {
      setScanError(null);
    }
    try {
      const sheetId = extractSheetId(sheetUrl);
      const sheetNames = await googleSheetService.getSheetNames(scriptUrl, sheetId);
      if (sheetNames && sheetNames.length > 0) {
        setAvailableSheets(sheetNames);
        setShowAdvanced(true);
        if (isManual) {
          setScanError(null);
        }

        const findBestMatch = (keywords: string[], fallback: string) => {
          const match = sheetNames.find(name => 
            keywords.some(keyword => name.toLowerCase().includes(keyword.toLowerCase()))
          );
          return match || sheetNames[0] || fallback;
        };

        setVocabSheetName(prev => {
          if (sheetNames.includes(prev)) return prev;
          return findBestMatch(["từ vựng", "vocab", "word", "từ", "词汇"], prev);
        });

        setReadingSheetName(prev => {
          if (sheetNames.includes(prev)) return prev;
          return findBestMatch(["luyện đọc", "reading", "sentence", "đọc", "阅读"], prev);
        });

        setGrammarSheetName(prev => {
          if (sheetNames.includes(prev)) return prev;
          return findBestMatch(["ngữ pháp", "grammar", "cấu trúc", "sentence", "语法"], prev);
        });

        setOcrSheetName(prev => {
          if (sheetNames.includes(prev)) return prev;
          return findBestMatch(["ocr", "quét", "nhật ký", "image", "扫描"], prev);
        });
      } else {
        if (isManual) {
          setScanError(t.configScanError);
        }
      }
    } catch (e) {
      console.error(e);
      if (isManual) {
        setScanError(t.configSyncNetworkError);
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Automatic sheet scanning hook
  useEffect(() => {
    if (sheetUrl && scriptUrl && sheetUrl.startsWith("http") && scriptUrl.startsWith("http")) {
      const delayDebounce = setTimeout(() => {
        handleScanSheets(false);
      }, 1200);
      return () => clearTimeout(delayDebounce);
    }
  }, [sheetUrl, scriptUrl]);

  const handleResetDefaults = () => {
    setSheetUrl(DEFAULT_SHEET_URL);
    setScriptUrl(DEFAULT_SCRIPT_URL);
    setVocabSheetName("từ vựng");
    setReadingSheetName("luyện đọc");
    setGrammarSheetName("ngữ pháp");
    setOcrSheetName("OCR");
  };

  const handleSave = () => {
    if (sheetUrl && scriptUrl) {
      onSave({ 
        sheetUrl, 
        scriptUrl,
        vocabSheetName,
        readingSheetName,
        grammarSheetName,
        ocrSheetName
      });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-neutral-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white shrink-0">
              <Settings className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-neutral-800">{t.configTitle}</h1>
              <p className="text-xs md:text-sm text-neutral-500">{t.configSubtitle}</p>
            </div>
          </div>
          <LanguageSelector />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">{t.configSheetUrlLabel}</label>
            <input 
              type="text" 
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">{t.configScriptUrlLabel}</label>
            <input 
              type="text" 
              value={scriptUrl}
              onChange={(e) => setScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm"
            />
          </div>

          {/* Collapsible Advanced Settings for custom sheet selection */}
          <div className="border border-neutral-100 rounded-xl p-3 bg-neutral-50/50">
            <button 
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex justify-between items-center text-sm font-semibold text-neutral-700 py-1"
            >
              <span className="flex items-center gap-2">{t.configWorksheetPanel}</span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="pt-4 space-y-3 border-t border-neutral-100 mt-2">
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => handleScanSheets(true)}
                    disabled={isScanning}
                    className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
                    {t.configAutoScanTabs}
                  </button>
                </div>

                {scanError && (
                  <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{scanError}</span>
                  </div>
                )}

                {availableSheets.length > 0 && (
                  <div className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg flex items-center gap-1.5 mb-2">
                    <Check className="w-3.5 h-3.5" />
                    {t.configTabsLoaded.replace("{count}", availableSheets.length.toString())}
                  </div>
                )}

                {/* Vocabulary Tab */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">{t.configVocabTabLabel}</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={vocabSheetName}
                      onChange={(e) => setVocabSheetName(e.target.value)}
                      placeholder="Từ vựng"
                      className="flex-1 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                    {availableSheets.length > 0 && (
                      <select
                        value={availableSheets.includes(vocabSheetName) ? vocabSheetName : ""}
                        onChange={(e) => {
                          if (e.target.value) setVocabSheetName(e.target.value);
                        }}
                        className="px-2 py-2 bg-white border border-neutral-200 rounded-lg text-sm max-w-[150px] focus:ring-1 focus:ring-emerald-500 outline-none"
                      >
                        <option value="">{t.configSelectTabOption}</option>
                        {availableSheets.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    )}
                  </div>
                </div>

                {/* Reading Tab */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">{t.configReadingTabLabel}</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={readingSheetName}
                      onChange={(e) => setReadingSheetName(e.target.value)}
                      placeholder="Bài đọc"
                      className="flex-1 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                    {availableSheets.length > 0 && (
                      <select
                        value={availableSheets.includes(readingSheetName) ? readingSheetName : ""}
                        onChange={(e) => {
                          if (e.target.value) setReadingSheetName(e.target.value);
                        }}
                        className="px-2 py-2 bg-white border border-neutral-200 rounded-lg text-sm max-w-[150px] focus:ring-1 focus:ring-emerald-500 outline-none"
                      >
                        <option value="">{t.configSelectTabOption}</option>
                        {availableSheets.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    )}
                  </div>
                </div>

                {/* Grammar Tab */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">{t.configGrammarTabLabel}</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={grammarSheetName}
                      onChange={(e) => setGrammarSheetName(e.target.value)}
                      placeholder="Ngữ pháp"
                      className="flex-1 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                    {availableSheets.length > 0 && (
                      <select
                        value={availableSheets.includes(grammarSheetName) ? grammarSheetName : ""}
                        onChange={(e) => {
                          if (e.target.value) setGrammarSheetName(e.target.value);
                        }}
                        className="px-2 py-2 bg-white border border-neutral-200 rounded-lg text-sm max-w-[150px] focus:ring-1 focus:ring-emerald-500 outline-none"
                      >
                        <option value="">{t.configSelectTabOption}</option>
                        {availableSheets.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    )}
                  </div>
                </div>

                {/* OCR Tab */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">{t.configOcrTabLabel}</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={ocrSheetName}
                      onChange={(e) => setOcrSheetName(e.target.value)}
                      placeholder="OCR"
                      className="flex-1 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                    {availableSheets.length > 0 && (
                      <select
                        value={availableSheets.includes(ocrSheetName) ? ocrSheetName : ""}
                        onChange={(e) => {
                          if (e.target.value) setOcrSheetName(e.target.value);
                        }}
                        className="px-2 py-2 bg-white border border-neutral-200 rounded-lg text-sm max-w-[150px] focus:ring-1 focus:ring-emerald-500 outline-none"
                      >
                        <option value="">{t.configSelectTabOption}</option>
                        {availableSheets.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 space-y-3">
            <button 
              onClick={handleSave}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
            >
              {t.configSaveButton}
            </button>

            <button 
              onClick={handleResetDefaults}
              className="w-full bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-600 font-semibold py-2.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t.configResetDefault}
            </button>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-neutral-100">
          <h3 className="text-xs font-bold text-neutral-800 mb-2">{t.configGuideTitle}</h3>
          <ul className="text-[11px] text-neutral-500 space-y-1.5 list-disc pl-4">
            <li>{t.configGuideStep1}</li>
            <li>{t.configGuideStep2}</li>
            <li>{t.configGuideStep3}</li>
            <li>{t.configGuideStep4}</li>
            <li>{t.configGuideStep5}</li>
            <li>{t.configGuideStep6}</li>
            <li>{t.configGuideStep7}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

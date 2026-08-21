import React, { useState, useRef } from "react";
import { Camera, Loader2, Languages, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { geminiService } from "../services/geminiService";
import { googleSheetService } from "../services/googleSheetService";
import { AppConfig, OCRResult } from "../types";
import { useLanguage } from "../contexts/LanguageContext";

interface Props {
  config: AppConfig;
  onResult: (result: OCRResult) => void;
  onError: (error: any) => Promise<boolean>;
  key?: string;
}

export default function OCRTab({ config, onResult, onError }: Props) {
  const { t } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [sourceLang, setSourceLang] = useState("Trung");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMessage(t.ocrReadingImage);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          const result = await geminiService.performOCR(base64);
          
          setStatusMessage(t.ocrReadDone);
          
          // Save to Google Sheet
          const sheetId = config.sheetUrl.match(/\/d\/(.*?)(\/|$)/)?.[1] || config.sheetUrl;
          await googleSheetService.saveOCRToSheet(config.scriptUrl, sheetId, result.originalText, config.ocrSheetName);
          
          setTimeout(() => {
            onResult(result);
          }, 1000);
        } catch (error) {
          console.error("OCR Inner Error:", error);
          const handled = await onError(error);
          if (!handled) {
            alert(t.ocrScanError);
          }
          setIsProcessing(false);
          setStatusMessage("");
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("OCR Error:", error);
      setIsProcessing(false);
      setStatusMessage("");
      alert(t.ocrFileError);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-4 flex flex-col items-center justify-center min-h-[60vh] gap-8"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-neutral-800">{t.ocrTitle}</h2>
        <p className="text-neutral-500 text-sm">{t.ocrSubtitle}</p>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-neutral-200 shadow-sm">
          <Languages className="w-5 h-5 text-emerald-600" />
          <select 
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm font-medium"
          >
            <option value="Trung">{t.ocrLangChinese}</option>
            <option value="Viet">{t.ocrLangVietnamese}</option>
            <option value="Anh">{t.ocrLangEnglish}</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex flex-col items-center justify-center gap-4 bg-white border-2 border-dashed border-neutral-200 rounded-3xl p-10 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group relative overflow-hidden"
          >
            {isProcessing ? (
              <div className="flex flex-col items-center gap-3">
                {statusMessage === t.ocrReadDone ? (
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 animate-bounce" />
                ) : (
                  <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                )}
                <span className="text-sm font-bold text-emerald-600">{statusMessage}</span>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                  <Camera className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <span className="block font-bold text-neutral-800">{t.ocrSelectImage}</span>
                  <span className="text-xs text-neutral-400">{t.ocrSupportFormats}</span>
                </div>
              </>
            )}
          </button>
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      <div className="max-w-xs text-center">
        <div className="flex items-center gap-2 text-xs text-neutral-400 justify-center">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          {t.ocrAutoSplit}
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-400 justify-center mt-1">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          {t.ocrSaveHistory}
        </div>
      </div>
    </motion.div>
  );
}

import React, { useState, useRef } from "react";
import { Camera, Image as ImageIcon, Loader2, Languages, CheckCircle2, Upload, Sparkles } from "lucide-react";
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
  const [isDragging, setIsDragging] = useState(false);

  // Separate refs for Camera vs Gallery/File Photo selection
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
    // Reset inputs so the same file can be selected again if needed
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isProcessing) return;

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      await processFile(file);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-4 flex flex-col items-center justify-center min-h-[65vh] gap-6 max-w-lg mx-auto"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-neutral-800 flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-emerald-600" />
          {t.ocrTitle}
        </h2>
        <p className="text-neutral-500 text-sm">{t.ocrSubtitle}</p>
      </div>

      <div className="w-full space-y-4">
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-neutral-200 shadow-sm">
          <Languages className="w-5 h-5 text-emerald-600" />
          <select 
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm font-medium text-neutral-700"
          >
            <option value="Trung">{t.ocrLangChinese}</option>
            <option value="Viet">{t.ocrLangVietnamese}</option>
            <option value="Anh">{t.ocrLangEnglish}</option>
          </select>
        </div>

        {/* Upload & Camera Dropzone / Options */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative bg-white border-2 border-dashed rounded-3xl p-6 md:p-8 transition-all duration-200 shadow-sm text-center ${
            isDragging 
              ? "border-emerald-500 bg-emerald-50/60 scale-[1.01]" 
              : "border-neutral-200 hover:border-emerald-300"
          }`}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              {statusMessage === t.ocrReadDone ? (
                <CheckCircle2 className="w-14 h-14 text-emerald-600 animate-bounce" />
              ) : (
                <Loader2 className="w-14 h-14 text-emerald-600 animate-spin" />
              )}
              <div className="space-y-1">
                <p className="text-base font-bold text-emerald-700">{statusMessage}</p>
                <p className="text-xs text-neutral-400">AI Gemini OCR</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-800">{t.ocrSelectImage}</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">{t.ocrDragDrop}</p>
                </div>
              </div>

              {/* Action Buttons: 1. Live Camera, 2. Photo Library / Files */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm rounded-2xl shadow-md shadow-emerald-200 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                >
                  <Camera className="w-5 h-5" />
                  <span>{t.ocrTakePhoto}</span>
                </button>

                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-4 bg-neutral-100 hover:bg-neutral-200 active:scale-[0.98] text-neutral-800 font-bold text-sm rounded-2xl border border-neutral-200 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                >
                  <ImageIcon className="w-5 h-5 text-emerald-600" />
                  <span>{t.ocrUploadPhoto}</span>
                </button>
              </div>

              <p className="text-[11px] text-neutral-400">{t.ocrSupportFormats}</p>
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input for Live Camera (uses capture="environment") */}
      <input 
        type="file" 
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Hidden file input for Photo Library / Gallery / File Explorer (no capture) */}
      <input 
        type="file" 
        ref={photoInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <div className="w-full max-w-xs space-y-2 text-center pt-2">
        <div className="flex items-center gap-2 text-xs text-neutral-500 justify-center">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{t.ocrAutoSplit}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-500 justify-center">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{t.ocrSaveHistory}</span>
        </div>
      </div>
    </motion.div>
  );
}

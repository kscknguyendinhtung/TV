import React, { useState, useRef } from "react";
import { 
  Camera, 
  Image as ImageIcon, 
  Loader2, 
  Languages, 
  CheckCircle2, 
  Upload, 
  Sparkles, 
  AlertTriangle, 
  Copy, 
  Check, 
  RefreshCw, 
  XCircle,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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

interface OCRErrorInfo {
  code: string;
  status: number | string;
  message: string;
  rawDetails: string;
  guidance: string;
  timestamp: string;
}

export default function OCRTab({ config, onResult, onError }: Props) {
  const { t } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [sourceLang, setSourceLang] = useState("Trung");
  const [isDragging, setIsDragging] = useState(false);
  const [ocrError, setOcrError] = useState<OCRErrorInfo | null>(null);
  const [copiedError, setCopiedError] = useState(false);

  // Separate refs for Camera vs Gallery/File Photo selection
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const MAX_DIM = 1600;
          let width = img.width;
          let height = img.height;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.85));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => {
          resolve(e.target?.result as string);
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getGuidanceForError = (errorCode: string, msg: string): string => {
    if (errorCode.includes("GEMINI_API_KEY_MISSING") || msg.includes("GEMINI_API_KEY is not configured")) {
      return "Máy chủ chưa có biến môi trường GEMINI_API_KEY. Vui lòng cấu hình GEMINI_API_KEY trong phần Settings/Deploy của dịch vụ lưu trữ.";
    }
    if (errorCode.includes("API_KEY_INVALID") || msg.includes("API key not valid") || msg.includes("API_KEY_INVALID")) {
      return "Khóa API không hợp lệ hoặc đã hết hạn. Vui lòng tạo khóa mới tại aistudio.google.com và cập nhật vào biến môi trường máy chủ.";
    }
    if (errorCode.includes("PERMISSION_DENIED") || errorCode.includes("403") || msg.includes("PERMISSION_DENIED")) {
      return "Dự án Google Cloud hoặc API Key chưa được cấp quyền gọi Gemini API. Kiểm tra quyền của Key trên Google AI Studio.";
    }
    if (errorCode.includes("RESOURCE_EXHAUSTED") || errorCode.includes("429") || msg.includes("429") || msg.includes("quota")) {
      return "Đã đạt giới hạn lượt gọi miễn phí (Rate Limit / Quota). Vui lòng đợi khoảng 30-60 giây rồi thử quét lại.";
    }
    if (errorCode.includes("NETWORK_ERROR")) {
      return "Không thể kết nối đến máy chủ. Kiểm tra lại đường truyền mạng Internet / Wi-Fi / 4G của thiết bị.";
    }
    return "Hãy kiểm tra lại độ nét của hình ảnh và kết nối mạng trước khi thử lại.";
  };

  const processFile = async (file: File) => {
    if (!file) return;

    setOcrError(null);
    setIsProcessing(true);
    setStatusMessage(t.ocrReadingImage);
    try {
      const base64 = await compressImage(file);
      const result = await geminiService.performOCR(base64);
      
      setStatusMessage(t.ocrReadDone);
      
      // Save to Google Sheet (non-blocking)
      try {
        const sheetId = config.sheetUrl.match(/\/d\/(.*?)(\/|$)/)?.[1] || config.sheetUrl;
        await googleSheetService.saveOCRToSheet(config.scriptUrl, sheetId, result.originalText, config.ocrSheetName);
      } catch (sheetErr) {
        console.warn("Could not save to sheet:", sheetErr);
      }
      
      setTimeout(() => {
        onResult(result);
      }, 500);
    } catch (error: any) {
      console.error("OCR Error:", error);
      
      const errorCode = error?.code || (error?.status ? `HTTP_${error.status}` : "OCR_PROCESSING_ERROR");
      const errorStatus = error?.status || 500;
      const errorMsg = error?.message || (typeof error === "string" ? error : JSON.stringify(error));
      const rawDetails = error?.details || error?.stack || "";
      const guidance = getGuidanceForError(errorCode, errorMsg);

      setOcrError({
        code: errorCode,
        status: errorStatus,
        message: errorMsg,
        rawDetails: typeof rawDetails === "string" ? rawDetails : JSON.stringify(rawDetails),
        guidance,
        timestamp: new Date().toLocaleTimeString("vi-VN")
      });
      
      setIsProcessing(false);
      setStatusMessage("");
    }
  };

  const handleCopyError = () => {
    if (!ocrError) return;
    const fullText = `[LỖI OCR GEMINI]
- Thời gian: ${ocrError.timestamp}
- Mã lỗi (Code): ${ocrError.code}
- HTTP Status: ${ocrError.status}
- Thông báo lỗi: ${ocrError.message}
- Gợi ý: ${ocrError.guidance}
${ocrError.rawDetails ? `- Chi tiết kỹ thuật: ${ocrError.rawDetails}` : ""}`;

    navigator.clipboard.writeText(fullText);
    setCopiedError(true);
    setTimeout(() => setCopiedError(false), 2500);
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
      className="p-4 flex flex-col items-center justify-center min-h-[65vh] gap-5 max-w-lg mx-auto"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-neutral-800 flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-emerald-600" />
          {t.ocrTitle}
        </h2>
        <p className="text-neutral-500 text-sm">{t.ocrSubtitle}</p>
      </div>

      {/* Prominent Error Display Card when OCR fails */}
      <AnimatePresence>
        {ocrError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="w-full bg-rose-50 border-2 border-rose-300 rounded-3xl p-5 shadow-sm space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-rose-100 text-rose-700 rounded-xl flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                    Lỗi Quét Ảnh OCR
                  </h3>
                  <span className="inline-block px-2 py-0.5 mt-0.5 text-[11px] font-mono font-bold bg-rose-200/80 text-rose-800 rounded-md">
                    Mã lỗi: {ocrError.code} (Status: {ocrError.status})
                  </span>
                </div>
              </div>

              <button
                onClick={() => setOcrError(null)}
                className="text-rose-400 hover:text-rose-700 p-1 rounded-lg transition-colors"
                title="Đóng thông báo lỗi"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message Details */}
            <div className="bg-white/90 border border-rose-200 rounded-2xl p-3.5 space-y-2">
              <div className="text-xs text-rose-950 font-semibold leading-relaxed break-words">
                <span className="text-rose-600 font-bold uppercase text-[10px] block">Nội dung lỗi chi tiết:</span>
                {ocrError.message}
              </div>

              {ocrError.guidance && (
                <div className="pt-2 border-t border-rose-100 text-xs text-neutral-700 flex items-start gap-1.5 leading-relaxed">
                  <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-800">Hướng dẫn khắc phục: </span>
                    {ocrError.guidance}
                  </div>
                </div>
              )}
            </div>

            {/* Error Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="flex-1 min-w-[120px] py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Thử chọn ảnh khác</span>
              </button>

              <button
                type="button"
                onClick={handleCopyError}
                className="py-2.5 px-3 bg-white hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                {copiedError ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedError ? "Đã sao chép" : "Sao chép mã lỗi"}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

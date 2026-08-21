import React, { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { AppLanguage } from "../i18n/translations";

const LANGUAGES: { code: AppLanguage; label: string; flag: string; nativeName: string }[] = [
  { code: "en", label: "English", flag: "🇺🇸", nativeName: "English (Default)" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳", nativeName: "Tiếng Việt (VN)" },
  { code: "zh", label: "中文", flag: "🇨🇳", nativeName: "中文 (China)" },
];

export default function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={t.selectLanguage}
        className={`flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm transition-all hover:bg-neutral-50 hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
          compact ? "px-2 py-1" : ""
        }`}
      >
        <span className="text-sm leading-none">{currentLang.flag}</span>
        <span className="text-xs font-bold">{currentLang.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-48 rounded-2xl bg-white p-1.5 shadow-xl border border-neutral-200 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            {t.selectLanguage}
          </div>
          {LANGUAGES.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-emerald-50 text-emerald-700 font-bold"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">{lang.flag}</span>
                  <span>{lang.nativeName}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

import React, { createContext, useContext, useState, useEffect } from "react";
import { AppLanguage, translations, TranslationDictionary } from "../i18n/translations";

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: TranslationDictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem("tiengtrungAI_language") as AppLanguage | null;
    if (saved && (saved === "en" || saved === "vi" || saved === "zh")) {
      return saved;
    }
    // Default to English as requested
    return "en";
  });

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    localStorage.setItem("tiengtrungAI_language", lang);
  };

  useEffect(() => {
    localStorage.setItem("tiengtrungAI_language", language);
  }, [language]);

  const t = translations[language] || translations.en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

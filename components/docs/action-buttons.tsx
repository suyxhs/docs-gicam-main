"use client";

import { useState } from "react";
import { PDFGenerator } from "./pdf-generator";

interface DocsActionButtonsProps {
  title: string;
  url: string;
  githubUrl: string;
}

export function DocsActionButtons({ 
  title, 
  url, 
  githubUrl, 
}: DocsActionButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
  ];

  const handlePrint = () => {
    window.print();
    setIsOpen(false);
  };

  const translatePage = (langCode: string, langName: string) => {
    setIsOpen(false);
    
    const currentUrl = encodeURIComponent(window.location.href);
    window.open(
      `https://translate.yandex.com/translate?lang=ru-${langCode}&url=${currentUrl}`,
      '_blank'
    );
  };

  return (
    <div className="flex flex-row items-center gap-2">
      {/* Кнопка Print */}
      <button
        onClick={handlePrint}
        className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-primary/10 text-primary border border-primary/20 hover:border-primary/30"
        title="Печать"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        <span className="hidden sm:inline">Печать</span>
      </button>

      {/* Кнопка PDF */}
      <PDFGenerator title={title} />

      {/* Кнопка Language с выпадающим меню */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-primary/10 text-primary border border-primary/20 hover:border-primary/30"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          <span className="hidden sm:inline">Язык</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Выпадающее меню языков */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-primary/10 overflow-hidden z-50 animate-fadeIn">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => translatePage(lang.code, lang.name)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-primary/5 transition-colors text-left"
              >
                <span className="text-base">{lang.flag}</span>
                <span className="flex-1 text-gray-700 dark:text-gray-300">{lang.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
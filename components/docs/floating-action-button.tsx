"use client";

import { useState, useEffect } from "react";

export function FloatingActionButton({ title }: { title: string }) {
  const [isOpen, setIsOpen] = useState(false);

  // Закрываем меню при клике вне
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && !(e.target as Element).closest('.fab-menu')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  const handlePrint = () => {
    setIsOpen(false);
    window.print();
  };

  const handlePDF = () => {
    setIsOpen(false);
    window.print();
  };

  const translateWithYandex = (langCode: string, langName: string) => {
    setIsOpen(false);
    
    // Коды языков для Яндекс.Переводчика
    const langMap: Record<string, string> = {
      'en': 'en',
      'es': 'es',
      'fr': 'fr',
      'de': 'de',
      'it': 'it',
      'zh': 'zh',
      'ja': 'ja',
      'ko': 'ko',
      'ar': 'ar',
      'pt': 'pt',
      'tr': 'tr',
      'nl': 'nl',
      'pl': 'pl',
      'cs': 'cs',
      'he': 'he',
      'hi': 'hi'
    };

    const targetLang = langMap[langCode] || 'en';
    const currentUrl = encodeURIComponent(window.location.href);
    
    // Яндекс.Переводчик
    window.open(
      `https://translate.yandex.com/translate?lang=ru-${targetLang}&url=${currentUrl}`,
      '_blank'
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Круглая кнопка */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-white dark:bg-black border border-black/10 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group backdrop-blur-sm"
        aria-label="Меню действий"
      >
        <div className={`w-4 h-0.5 bg-black/60 dark:bg-white/60 rounded-full transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-0' : '-translate-y-1'}`} />
        <div className={`w-4 h-0.5 bg-black/60 dark:bg-white/60 rounded-full transition-all duration-300 absolute ${isOpen ? '-rotate-45' : 'translate-y-1'}`} />
      </button>

      {/* Меню */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-80 fab-menu animate-fadeIn">
          <div className="bg-white/90 dark:bg-black/90 backdrop-blur-xl rounded-xl border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden">
            
            {/* Секция перевода */}
            <div className="px-4 py-2 bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/5">
              <p className="text-xs font-medium text-black/40 dark:text-white/40 uppercase tracking-wider">
                Яндекс.Переводчик
              </p>
            </div>

            {/* Популярные языки */}
            <div className="p-2">
              <p className="text-[10px] text-black/40 dark:text-white/40 px-2 py-1">Популярные</p>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { code: 'en', name: 'English', flag: '🇬🇧' },
                  { code: 'es', name: 'Español', flag: '🇪🇸' },
                  { code: 'fr', name: 'Français', flag: '🇫🇷' },
                  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
                  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
                  { code: 'zh', name: '中文', flag: '🇨🇳' },
                  { code: 'ja', name: '日本語', flag: '🇯🇵' },
                  { code: 'ko', name: '한국어', flag: '🇰🇷' },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => translateWithYandex(lang.code, lang.name)}
                    className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform">{lang.flag}</span>
                    <span className="text-[9px] font-medium text-black/70 dark:text-white/70 truncate w-full text-center">
                      {lang.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Европейские языки */}
            <div className="p-2 border-t border-black/5 dark:border-white/5">
              <p className="text-[10px] text-black/40 dark:text-white/40 px-2 py-1">Европа</p>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
                  { code: 'cs', name: 'Čeština', flag: '🇨🇿' },
                  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
                  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
                  { code: 'pt', name: 'Português', flag: '🇵🇹' },
                  { code: 'he', name: 'עברית', flag: '🇮🇱' },
                  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
                  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => translateWithYandex(lang.code, lang.name)}
                    className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform">{lang.flag}</span>
                    <span className="text-[9px] font-medium text-black/70 dark:text-white/70 truncate w-full text-center">
                      {lang.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Оригинал */}
            <button
              onClick={() => window.open(window.location.href, '_self')}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-t border-black/5 dark:border-white/5"
            >
              <span className="text-base">🇷🇺</span>
              <span className="text-sm font-medium text-black/80 dark:text-white/80">Русский (оригинал)</span>
              <span className="ml-auto text-xs text-black/40 dark:text-white/40">↻</span>
            </button>

            {/* Разделитель */}
            <div className="h-px bg-black/5 dark:bg-white/5 my-1" />

            {/* Печать и PDF */}
            <div className="p-2">
              <button
                onClick={handlePrint}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <span className="text-sm font-medium text-black/80 dark:text-white/80">Печать</span>
                <span className="text-xs text-black/40 dark:text-white/40">⌘P</span>
              </button>

              <button
                onClick={handlePDF}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <span className="text-sm font-medium text-black/80 dark:text-white/80">Сохранить как PDF</span>
                <span className="text-xs text-black/40 dark:text-white/40">⌘S</span>
              </button>
            </div>

            {/* Название документа */}
            <div className="px-4 py-2 bg-black/5 dark:bg-white/5 border-t border-black/5 dark:border-white/5">
              <p className="text-xs text-black/40 dark:text-white/40 truncate">
                {title}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import { useState } from "react";

interface TocItem {
  level: number;
  text: string;
  anchor: string;
}

interface TocGeneratorProps {
  content: string;
  onInsert: (toc: string) => void;
  onClose: () => void;
}

export function TocGenerator({ content, onInsert, onClose }: TocGeneratorProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [maxLevel, setMaxLevel] = useState(3);
  const [includeTitle, setIncludeTitle] = useState(true);

  const generateToc = () => {
    // Простой парсинг заголовков
    const lines = content.split('\n');
    const items: TocItem[] = [];
    
    lines.forEach(line => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2];
        const anchor = text
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .replace(/\s+/g, '-');
        
        items.push({ level, text, anchor });
      }
    });
    
    setTocItems(items);
  };

  const renderToc = () => {
    const filteredItems = tocItems.filter(item => item.level <= maxLevel);
    
    let toc = includeTitle ? '## Содержание\n\n' : '';
    
    filteredItems.forEach(item => {
      const indent = '  '.repeat(item.level - 1);
      toc += `${indent}- [${item.text}](#${item.anchor})\n`;
    });
    
    return toc;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-black rounded-2xl border border-black/10 dark:border-white/10 w-full max-w-2xl shadow-2xl">
        
        {/* Заголовок */}
        <div className="px-6 py-4 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black/5 dark:bg-white/5 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📑</span>
              </div>
              <h2 className="text-lg font-light text-black/80 dark:text-white/80">
                Генератор оглавления
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Контент */}
        <div className="p-6 space-y-4">
          <button
            onClick={generateToc}
            className="w-full px-4 py-3 bg-black/90 dark:bg-white/90 text-white dark:text-black rounded-xl text-sm font-medium hover:bg-black dark:hover:bg-white transition-colors"
          >
            Найти заголовки
          </button>

          {tocItems.length > 0 && (
            <>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-black/40 dark:text-white/40 mb-2">
                    Максимальный уровень заголовков
                  </label>
                  <select
                    value={maxLevel}
                    onChange={(e) => setMaxLevel(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-black/5 dark:bg-white/5 border border-transparent focus:border-black/20 dark:focus:border-white/20 rounded-lg text-sm"
                  >
                    <option value={2}>H2 только</option>
                    <option value={3}>H2 и H3</option>
                    <option value={4}>H2, H3 и H4</option>
                    <option value={5}>Все заголовки</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="includeTitle"
                    checked={includeTitle}
                    onChange={(e) => setIncludeTitle(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="includeTitle" className="text-sm text-black/60 dark:text-white/60">
                    Добавить заголовок "Содержание"
                  </label>
                </div>
              </div>

              {/* Предпросмотр */}
              <div className="mt-4">
                <h3 className="text-sm font-medium text-black/60 dark:text-white/60 mb-2">
                  Предпросмотр
                </h3>
                <pre className="p-4 bg-black/5 dark:bg-white/5 rounded-xl text-sm font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {renderToc()}
                </pre>
              </div>

              {/* Кнопки */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => onInsert(renderToc())}
                  className="flex-1 px-4 py-3 bg-black/90 dark:bg-white/90 text-white dark:text-black rounded-xl text-sm font-medium hover:bg-black dark:hover:bg-white transition-colors"
                >
                  Вставить в начало
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl text-sm transition-colors"
                >
                  Отмена
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
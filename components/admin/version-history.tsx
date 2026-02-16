"use client";

import { useState } from "react";

interface Version {
  id: string;
  date: string;
  author: string;
  message: string;
  size: string;
}

interface VersionHistoryProps {
  filename: string;
  onRestore: (versionId: string) => void;
  onClose: () => void;
}

export function VersionHistory({ filename, onRestore, onClose }: VersionHistoryProps) {
  const [versions] = useState<Version[]>([
    {
      id: '1',
      date: '2024-01-15 14:30',
      author: 'Администратор',
      message: 'Обновление документации API',
      size: '2.4 KB'
    },
    {
      id: '2',
      date: '2024-01-14 09:15',
      author: 'Администратор',
      message: 'Добавлены примеры кода',
      size: '2.1 KB'
    },
    {
      id: '3',
      date: '2024-01-13 18:45',
      author: 'Администратор',
      message: 'Первая версия документа',
      size: '1.8 KB'
    },
  ]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-black rounded-2xl border border-black/10 dark:border-white/10 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        
        {/* Заголовок */}
        <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black/5 dark:bg-white/5 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <h2 className="text-lg font-light text-black/80 dark:text-white/80">
                История изменений
              </h2>
              <p className="text-sm text-black/40 dark:text-white/40">
                {filename}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-black/40 dark:text-white/40"
          >
            ✕
          </button>
        </div>

        {/* Список версий */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {versions.map((version, index) => (
              <div
                key={version.id}
                className="group relative p-4 rounded-xl border border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Индикатор версии */}
                  <div className="relative">
                    <div className="w-8 h-8 bg-black/5 dark:bg-white/5 rounded-lg flex items-center justify-center">
                      <span className="text-sm">v{versions.length - index}</span>
                    </div>
                    {index < versions.length - 1 && (
                      <div className="absolute top-8 left-1/2 w-0.5 h-8 bg-black/10 dark:bg-white/10 -translate-x-1/2" />
                    )}
                  </div>

                  {/* Информация о версии */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-black/80 dark:text-white/80">
                        {version.message}
                      </span>
                      <span className="text-xs text-black/40 dark:text-white/40">
                        {version.size}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-black/40 dark:text-white/40">
                      <span>{version.date}</span>
                      <span>•</span>
                      <span>{version.author}</span>
                    </div>
                  </div>

                  {/* Кнопка восстановления */}
                  <button
                    onClick={() => onRestore(version.id)}
                    className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-xs transition-all"
                  >
                    Восстановить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Футер */}
        <div className="px-6 py-4 border-t border-black/10 dark:border-white/10">
          <p className="text-xs text-center text-black/40 dark:text-white/40">
            Всего версий: {versions.length} • Последнее изменение: сегодня
          </p>
        </div>
      </div>
    </div>
  );
}
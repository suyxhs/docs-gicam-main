"use client";

import { useState, useEffect } from "react";

interface BulkOperationsProps {
  selectedDocs: string[];
  onClose: () => void;
  onMove: (targetFolder: string, docs: string[]) => void;
  onDelete: (docs: string[]) => void;
  onExport: (docs: string[]) => void;
  folders: string[];
}

export function BulkOperations({ 
  selectedDocs: initialSelectedDocs, 
  onClose, 
  onMove, 
  onDelete, 
  onExport,
  folders 
}: BulkOperationsProps) {
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>(initialSelectedDocs);
  const [selectAll, setSelectAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Демо-список документов (в реальном приложении должен приходить из пропсов или API)
  const [availableDocs, setAvailableDocs] = useState([
    { path: 'getting-started/installation.mdx', title: 'Установка', folder: 'getting-started' },
    { path: 'getting-started/quick-start.mdx', title: 'Быстрый старт', folder: 'getting-started' },
    { path: 'api/authentication.mdx', title: 'Аутентификация', folder: 'api' },
    { path: 'api/endpoints.mdx', title: 'Эндпоинты', folder: 'api' },
    { path: 'guides/deployment.mdx', title: 'Деплой', folder: 'guides' },
    { path: 'guides/configuration.mdx', title: 'Конфигурация', folder: 'guides' },
    { path: 'examples/react.mdx', title: 'React примеры', folder: 'examples' },
    { path: 'examples/nextjs.mdx', title: 'Next.js примеры', folder: 'examples' },
    { path: 'faq/common-questions.mdx', title: 'Частые вопросы', folder: 'faq' },
    { path: 'troubleshooting/errors.mdx', title: 'Ошибки', folder: 'troubleshooting' },
  ]);

  // Фильтрация документов по поиску
  const filteredDocs = availableDocs.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.folder.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Обновление состояния "Выбрать все"
  useEffect(() => {
    if (filteredDocs.length > 0 && selectedDocs.length === filteredDocs.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedDocs, filteredDocs]);

  const toggleDoc = (path: string) => {
    setSelectedDocs(prev =>
      prev.includes(path)
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedDocs(prev => prev.filter(p => !filteredDocs.some(doc => doc.path === p)));
    } else {
      const newDocs = filteredDocs.map(doc => doc.path);
      setSelectedDocs(prev => [...new Set([...prev, ...newDocs])]);
    }
  };

  const handleMove = (targetFolder: string) => {
    onMove(targetFolder, selectedDocs);
    setShowMoveDialog(false);
  };

  const handleDelete = () => {
    onDelete(selectedDocs);
  };

  const handleExport = () => {
    onExport(selectedDocs);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-black rounded-2xl border border-black/10 dark:border-white/10 w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl animate-fadeIn">
        
        {/* Заголовок */}
        <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black/5 dark:bg-white/5 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
            <div>
              <h2 className="text-lg font-light text-black/80 dark:text-white/80">
                Массовые операции
              </h2>
              <p className="text-sm text-black/40 dark:text-white/40">
                Выбрано документов: {selectedDocs.length}
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

        {/* Поиск */}
        <div className="px-6 py-3 border-b border-black/10 dark:border-white/10">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск документов..."
              className="w-full px-4 py-2 pl-10 bg-black/5 dark:bg-white/5 border border-transparent focus:border-black/20 dark:focus:border-white/20 rounded-lg text-sm"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40">
              🔍
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Заголовок списка */}
        <div className="px-6 py-2 border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-black/20 dark:border-white/20"
              />
              <span className="text-xs font-medium text-black/60 dark:text-white/60">
                {selectAll ? 'Снять все' : 'Выбрать все'}
              </span>
            </div>
            <span className="text-xs text-black/40 dark:text-white/40">
              ({filteredDocs.length} документов)
            </span>
          </div>
        </div>

        {/* Список документов */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {filteredDocs.map((doc) => (
              <div
                key={doc.path}
                onClick={() => toggleDoc(doc.path)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedDocs.includes(doc.path)
                    ? 'border-black/30 dark:border-white/30 bg-black/5 dark:bg-white/5'
                    : 'border-transparent hover:border-black/20 dark:hover:border-white/20 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedDocs.includes(doc.path)}
                  onChange={() => {}}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded border-black/20 dark:border-white/20"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-black/80 dark:text-white/80 truncate">
                      {doc.title}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-black/10 dark:bg-white/10 rounded-full text-black/60 dark:text-white/60">
                      {doc.folder}
                    </span>
                  </div>
                  <p className="text-xs text-black/40 dark:text-white/40 truncate mt-0.5">
                    {doc.path}
                  </p>
                </div>
              </div>
            ))}

            {filteredDocs.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-3 text-black/20 dark:text-white/20">
                  📄
                </div>
                <p className="text-sm text-black/40 dark:text-white/40">
                  Документы не найдены
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Действия */}
        <div className="px-6 py-4 border-t border-black/10 dark:border-white/10 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => setShowMoveDialog(true)}
              disabled={selectedDocs.length === 0}
              className="flex-1 px-4 py-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>📂</span>
              <span>Переместить</span>
            </button>

            <button
              onClick={handleExport}
              disabled={selectedDocs.length === 0}
              className="flex-1 px-4 py-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>📦</span>
              <span>Экспорт</span>
            </button>

            <button
              onClick={handleDelete}
              disabled={selectedDocs.length === 0}
              className="flex-1 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>🗑️</span>
              <span>Удалить</span>
            </button>
          </div>

          {/* Диалог перемещения */}
          {showMoveDialog && (
            <div className="mt-4 p-4 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 animate-fadeIn">
              <h4 className="text-sm font-medium text-black/60 dark:text-white/60 mb-3">
                Выберите папку назначения
              </h4>
              <div className="space-y-1 max-h-48 overflow-y-auto mb-3">
                <button
                  onClick={() => handleMove('')}
                  className="w-full text-left px-3 py-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-sm transition-colors"
                >
                  📁 Корень
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder}
                    onClick={() => handleMove(folder)}
                    className="w-full text-left px-3 py-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-sm transition-colors"
                  >
                    📂 {folder}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowMoveDialog(false)}
                className="w-full px-3 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-sm transition-colors"
              >
                Отмена
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
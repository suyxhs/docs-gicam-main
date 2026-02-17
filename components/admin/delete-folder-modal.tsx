"use client";

import { useState, useEffect } from "react";

interface DeleteFolderModalProps {
  isOpen: boolean;
  folderName: string;
  folderPath: string;
  onClose: () => void;
  onConfirm: (force?: boolean) => void;
  isDeleting?: boolean; // Только boolean или undefined, но не null
  folderInfo?: {
    filesCount: number;
    foldersCount: number;
    totalItems: number;
  } | null;
}

export function DeleteFolderModal({ 
  isOpen, 
  folderName, 
  folderPath, 
  onClose, 
  onConfirm,
  isDeleting = false, // Значение по умолчанию гарантирует, что это всегда boolean
  folderInfo = null
}: DeleteFolderModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  const [forceDelete, setForceDelete] = useState(false);

  // Сброс состояния при открытии
  useEffect(() => {
    if (isOpen) {
      setConfirmText("");
      setError("");
      setForceDelete(false);
    }
  }, [isOpen]);

  // Обработка клавиш
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        if (confirmText === folderName) {
          onConfirm(forceDelete);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, confirmText, folderName, onConfirm, onClose, forceDelete]);

  const handleConfirm = () => {
    if (confirmText !== folderName) {
      setError("Название папки введено неверно");
      return;
    }
    onConfirm(forceDelete);
  };

  if (!isOpen) return null;

  const hasContent = folderInfo && folderInfo.totalItems > 0;
  
  // Явно преобразуем в boolean для disabled пропа
  const isInputDisabled = Boolean(isDeleting);
  const isDeleteButtonDisabled = Boolean(
    confirmText !== folderName || isDeleting || (hasContent && !forceDelete)
  );

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Затемненный фон */}
      <div 
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Модальное окно по центру */}
      <div className="relative bg-white dark:bg-black rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-black/10 dark:border-white/10 animate-scaleIn">
        
        {/* Заголовок */}
        <div className="px-6 py-5 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black/5 dark:bg-white/5 rounded-xl flex items-center justify-center">
              <span className="text-2xl text-black/60 dark:text-white/60">
                {hasContent ? '⚠️' : '🗑️'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-light text-black/80 dark:text-white/80">
                {hasContent ? 'Папка не пуста' : 'Удаление папки'}
              </h2>
              <p className="text-sm text-black/40 dark:text-white/40 mt-0.5">
                {hasContent 
                  ? 'В папке есть файлы и подпапки' 
                  : 'Это действие нельзя отменить'}
              </p>
            </div>
          </div>
        </div>

        {/* Основное содержимое */}
        <div className="p-6">
          
          {/* Информация о папке */}
          <div className="mb-6 p-4 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-2xl text-black/40 dark:text-white/40">📂</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-black/80 dark:text-white/80">
                  {folderName}
                </p>
                <p className="text-xs text-black/40 dark:text-white/40 font-mono mt-0.5 break-all">
                  {folderPath}
                </p>
              </div>
            </div>
          </div>

          {/* Информация о содержимом (если папка не пуста) */}
          {hasContent && folderInfo && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-xl text-yellow-600 dark:text-yellow-400">📊</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    Содержимое папки:
                  </p>
                  <div className="space-y-1 text-sm">
                    <p className="text-yellow-700 dark:text-yellow-300">
                      • Документов: {folderInfo.filesCount}
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300">
                      • Подпапок: {folderInfo.foldersCount}
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300 font-medium mt-2">
                      Всего элементов: {folderInfo.totalItems}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Предупреждение для непустой папки */}
          {hasContent && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-xl text-red-500">⚠️</span>
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                    Принудительное удаление
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Все документы и подпапки будут безвозвратно удалены.
                    Это действие нельзя отменить.
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="forceDelete"
                  checked={forceDelete}
                  onChange={(e) => setForceDelete(e.target.checked)}
                  className="w-4 h-4 rounded border-red-500/50"
                />
                <label htmlFor="forceDelete" className="text-sm text-red-700 dark:text-red-300">
                  Я понимаю, что все данные будут удалены
                </label>
              </div>
            </div>
          )}

          {/* Подтверждение */}
          <div className="mb-4">
            <label className="block text-xs text-black/40 dark:text-white/40 mb-2">
              Введите название папки для подтверждения
            </label>
            <div className="mb-2 p-2 bg-black/5 dark:bg-white/5 rounded-lg text-center">
              <span className="text-sm font-mono text-black/60 dark:text-white/60">
                {folderName}
              </span>
            </div>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value);
                setError("");
              }}
              placeholder="введите название папки"
              className={`w-full px-4 py-3 bg-black/5 dark:bg-white/5 border rounded-xl text-sm transition-colors placeholder:text-black/30 dark:placeholder:text-white/30 ${
                error 
                  ? 'border-red-500/50 dark:border-red-500/50' 
                  : 'border-transparent focus:border-black/20 dark:focus:border-white/20'
              }`}
              disabled={isInputDisabled}
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <span>✕</span>
                <span>{error}</span>
              </p>
            )}
          </div>
        </div>

        {/* Действия */}
        <div className="px-6 py-4 border-t border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isInputDisabled}
            className="px-4 py-2 text-sm text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleteButtonDisabled}
            className="px-6 py-2 bg-black/90 dark:bg-white/90 text-white dark:text-black rounded-lg text-sm font-medium hover:bg-black dark:hover:bg-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
                <span>Удаление...</span>
              </>
            ) : (
              <>
                <span>{hasContent ? '⚠️' : '🗑️'}</span>
                <span>{hasContent ? 'Удалить всё' : 'Удалить папку'}</span>
              </>
            )}
          </button>
        </div>

        {/* Индикатор горячих клавиш */}
        <div className="absolute bottom-20 left-6 text-xs text-black/30 dark:text-white/30">
          {!isDeleting && (
            <span className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-black/5 dark:bg-white/5 rounded text-[10px]">⌘⏎</span>
              <span>подтвердить</span>
            </span>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
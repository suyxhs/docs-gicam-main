"use client";

import { useState } from "react";

interface FolderNavigationProps {
  folders: string[];
  currentFolder: string;
  breadcrumbs: string[];
  onFolderClick: (folder: string) => void;
  onCreateFolder: (folderName: string) => void;
  onDeleteFolder: (folder: string) => void;
  onMoveToParent: () => void;
  onDeleteClick?: (folder: string) => void; // Новый проп для открытия модалки
}

export function FolderNavigation({
  folders,
  currentFolder,
  breadcrumbs,
  onFolderClick,
  onCreateFolder,
  onDeleteFolder,
  onMoveToParent,
  onDeleteClick,
}: FolderNavigationProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName("");
      setIsCreating(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, folder: string) => {
    e.stopPropagation();
    const fullPath = currentFolder ? `${currentFolder}/${folder}` : folder;
    if (onDeleteClick) {
      onDeleteClick(fullPath);
    } else {
      onDeleteFolder(fullPath);
    }
  };

  return (
    <div className="mb-6">
      {/* Хлебные крошки */}
      <div className="flex items-center gap-2 mb-4 text-sm flex-wrap">
        <button
          onClick={() => onFolderClick("")}
          className={`px-2 py-1 rounded-lg transition-colors ${
            !currentFolder 
              ? 'bg-black/10 dark:bg-white/10 text-black/80 dark:text-white/80 font-medium' 
              : 'hover:bg-black/5 dark:hover:bg-white/5 text-black/60 dark:text-white/60'
          }`}
        >
          📁 Корень
        </button>
        
        {breadcrumbs.map((crumb, index) => {
          const folderPath = breadcrumbs.slice(0, index + 1).join('/');
          return (
            <div key={crumb} className="flex items-center gap-2">
              <span className="text-black/30 dark:text-white/30">/</span>
              <button
                onClick={() => onFolderClick(folderPath)}
                className="px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-black/80 dark:text-white/80"
              >
                📂 {crumb}
              </button>
            </div>
          );
        })}
      </div>

      {/* Заголовок и кнопка создания папки */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs uppercase tracking-wider text-black/40 dark:text-white/40 font-medium">
          Папки ({folders.length})
        </h3>
        <button
          onClick={() => setIsCreating(true)}
          className="text-xs px-2 py-1 bg-black/5 dark:bg-white/5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-black/60 dark:text-white/60 flex items-center gap-1"
        >
          <span className="text-base">+</span>
          <span>Новая</span>
        </button>
      </div>

      {/* Форма создания папки */}
      {isCreating && (
        <div className="mb-4 p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="название-папки"
            className="w-full px-3 py-2 bg-white dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-lg mb-2 text-sm font-mono"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder();
              if (e.key === 'Escape') setIsCreating(false);
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreateFolder}
              className="flex-1 px-3 py-1.5 bg-black/80 dark:bg-white/80 text-white dark:text-black rounded-lg text-sm hover:bg-black dark:hover:bg-white transition-colors"
            >
              Создать
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="flex-1 px-3 py-1.5 bg-black/10 dark:bg-white/10 rounded-lg text-sm hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Список папок */}
      {folders.length > 0 ? (
        <div className="grid grid-cols-1 gap-1 mb-4 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-black/20 dark:scrollbar-thumb-white/20">
          {folders.map((folder) => (
            <div
              key={folder}
              className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <button
                onClick={() => onFolderClick(
                  currentFolder ? `${currentFolder}/${folder}` : folder
                )}
                className="flex items-center gap-2 flex-1 text-left"
              >
                <span className="text-lg">📂</span>
                <span className="text-sm font-medium text-black/70 dark:text-white/70 truncate">
                  {folder}
                </span>
              </button>
              
              <button
                onClick={(e) => handleDeleteClick(e, folder)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-all"
                title="Удалить папку"
              >
                <span className="text-sm text-black/40 dark:text-white/40">✕</span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-4 p-4 bg-black/5 dark:bg-white/5 rounded-lg text-center">
          <p className="text-sm text-black/40 dark:text-white/40">
            Нет папок
          </p>
        </div>
      )}

      {/* Кнопка "На уровень выше" */}
      {currentFolder && (
        <button
          onClick={onMoveToParent}
          className="flex items-center gap-2 px-3 py-2 text-sm text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors w-full"
        >
          <span>⬆️</span>
          <span>На уровень выше</span>
          <span className="ml-auto text-xs text-black/40 dark:text-white/40">
            {breadcrumbs.slice(0, -1).join('/') || 'Корень'}
          </span>
        </button>
      )}
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";

interface MediaFile {
  name: string;
  url: string;
  size: number;
  modified: Date;
  type: string;
}

interface MediaManagerProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

export function MediaManager({ onSelect, onClose }: MediaManagerProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [currentFolder, setCurrentFolder] = useState("images");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const folders = [
    { id: "images", name: "Изображения", icon: "🖼️", count: 0 },
    { id: "videos", name: "Видео", icon: "🎬", count: 0 },
    { id: "gifs", name: "GIF", icon: "🎨", count: 0 },
    { id: "files", name: "Файлы", icon: "📎", count: 0 },
  ];

  // Загрузка списка файлов
  useEffect(() => {
    loadFiles(currentFolder);
  }, [currentFolder]);

  const loadFiles = async (folder: string) => {
    try {
      const res = await fetch(`/api/upload?folder=${folder}`);
      const data = await res.json();
      setFiles(data.files || []);
      
      // Обновляем счетчики в папках
      folders.forEach(f => {
        if (f.id === folder) {
          f.count = data.files?.length || 0;
        }
      });
    } catch (error) {
      console.error("Failed to load files:", error);
    }
  };

  // Загрузка файла
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "auto"); // автоопределение папки

    try {
      // Имитация прогресса
      const interval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(interval);
      setUploadProgress(100);

      if (res.ok) {
        const data = await res.json();
        // Переключаемся на папку, куда загрузился файл
        setCurrentFolder(data.folder);
        setTimeout(() => setUploadProgress(0), 1000);
      } else {
        alert("Ошибка загрузки");
      }
    } catch (error) {
      alert("Ошибка загрузки");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  // Удаление файла
  const handleDelete = async (filepath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Удалить файл?")) return;

    try {
      const res = await fetch(`/api/upload?path=${encodeURIComponent(filepath)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        loadFiles(currentFolder);
      }
    } catch (error) {
      alert("Ошибка удаления");
    }
  };

  // Копирование URL
  const copyUrl = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    alert("URL скопирован!");
  };

  // Форматирование размера
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Форматирование даты
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-black rounded-2xl border border-black/10 dark:border-white/10 w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl">
        
        {/* Заголовок */}
        <div className="p-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-light text-black/80 dark:text-white/80">
            Медиатека
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Основной контент */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Боковая панель с папками */}
          <div className="w-48 border-r border-black/10 dark:border-white/10 p-3">
            <div className="space-y-1">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setCurrentFolder(folder.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    currentFolder === folder.id
                      ? 'bg-black/10 dark:bg-white/10'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="text-lg">{folder.icon}</span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-black/80 dark:text-white/80">
                      {folder.name}
                    </p>
                    <p className="text-xs text-black/40 dark:text-white/40">
                      {folder.count} файлов
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Кнопка загрузки */}
            <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10">
              <label className="relative block">
                <input
                  type="file"
                  onChange={handleUpload}
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  accept="image/*,video/*,.gif,.pdf,.zip"
                />
                <div className="w-full px-3 py-2 bg-black/5 dark:bg-white/5 rounded-lg text-sm text-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors disabled:opacity-50">
                  {isUploading ? 'Загрузка...' : '📤 Загрузить'}
                </div>
              </label>

              {/* Прогресс загрузки */}
              {isUploading && (
                <div className="mt-2">
                  <div className="h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black/50 dark:bg-white/50 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Сетка файлов */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Переключение вида */}
            <div className="flex items-center justify-end mb-4 gap-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid" ? 'bg-black/10 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                ⊞
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "list" ? 'bg-black/10 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                ≡
              </button>
            </div>

            {files.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl mb-3 text-black/20 dark:text-white/20">
                    {folders.find(f => f.id === currentFolder)?.icon}
                  </div>
                  <p className="text-black/60 dark:text-white/60">
                    Нет файлов в этой папке
                  </p>
                  <p className="text-sm text-black/40 dark:text-white/40 mt-1">
                    Нажмите "Загрузить" чтобы добавить
                  </p>
                </div>
              </div>
            ) : (
              <div className={viewMode === "grid" 
                ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                : "space-y-2"
              }>
                {files.map((file) => (
                  <div
                    key={file.name}
                    onClick={() => onSelect(file.url)}
                    className={`group relative cursor-pointer rounded-lg border border-transparent hover:border-black/20 dark:hover:border-white/20 transition-all ${
                      viewMode === "grid" ? 'p-3' : 'p-2'
                    }`}
                  >
                    {viewMode === "grid" ? (
                      // Grid view
                      <div className="aspect-square bg-black/5 dark:bg-white/5 rounded-lg overflow-hidden">
                        {file.type.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        ) : file.type.match(/\.(mp4|webm)$/i) ? (
                          <video className="w-full h-full object-cover">
                            <source src={file.url} />
                          </video>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">
                            📄
                          </div>
                        )}
                      </div>
                    ) : (
                      // List view
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {file.type.match(/\.(jpg|jpeg|png|webp)$/i) && '🖼️'}
                          {file.type.match(/\.gif$/i) && '🎨'}
                          {file.type.match(/\.(mp4|webm)$/i) && '🎬'}
                          {file.type.match(/\.pdf$/i) && '📄'}
                          {file.type.match(/\.zip$/i) && '📦'}
                          {!file.type.match(/\.(jpg|jpeg|png|webp|gif|mp4|webm|pdf|zip)$/i) && '📎'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-black/80 dark:text-white/80 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-black/40 dark:text-white/40">
                            {formatSize(file.size)} • {formatDate(file.modified)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(file.url);
                          onClose();
                        }}
                        className="p-2 bg-white text-black rounded-lg text-sm hover:scale-110 transition-transform"
                        title="Вставить"
                      >
                        📎
                      </button>
                      <button
                        onClick={(e) => copyUrl(file.url, e)}
                        className="p-2 bg-white text-black rounded-lg text-sm hover:scale-110 transition-transform"
                        title="Копировать URL"
                      >
                        📋
                      </button>
                      <button
                        onClick={(e) => handleDelete(file.url, e)}
                        className="p-2 bg-white text-black rounded-lg text-sm hover:scale-110 transition-transform"
                        title="Удалить"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
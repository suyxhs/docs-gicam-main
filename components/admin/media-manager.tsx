"use client";

import { useState, useEffect } from "react";

interface MediaFile {
  name: string;
  url: string;
  size: number;
  modified: Date;
  type: string;
  folder: string;
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
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const folders = [
    { id: "images", name: "Изображения", icon: "🖼️", description: "PNG, JPG, WEBP" },
    { id: "videos", name: "Видео", icon: "🎬", description: "MP4, WebM" },
    { id: "gifs", name: "GIF", icon: "🎨", description: "Анимации" },
    { id: "files", name: "Документы", icon: "📄", description: "PDF, ZIP и др." },
  ];

  // Загрузка списка файлов
  useEffect(() => {
    loadFiles(currentFolder);
  }, [currentFolder]);

  const loadFiles = async (folder: string) => {
    setIsTransitioning(true);
    try {
      const res = await fetch(`/api/upload?folder=${folder}`);
      const data = await res.json();
      
      const filesWithFolder = (data.files || []).map((file: any) => ({
        ...file,
        folder: folder
      }));
      
      setFiles(filesWithFolder);
    } catch (error) {
      console.error("Failed to load files:", error);
    } finally {
      // Небольшая задержка для плавности анимации
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  // Переключение папки с анимацией
  const handleFolderChange = (folderId: string) => {
    if (folderId === currentFolder) return;
    setCurrentFolder(folderId);
    setSelectedFile(null);
  };

  // Загрузка файла
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "auto");

    try {
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
        handleFolderChange(data.folder);
        setTimeout(() => setUploadProgress(0), 1000);
      } else {
        const error = await res.json();
        alert(error.error || "Ошибка загрузки");
        setUploadProgress(0);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Ошибка загрузки");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  // Удаление файла
  const handleDelete = async (file: MediaFile, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Удалить файл "${file.name}"?`)) return;

    try {
      const res = await fetch(`/api/upload?path=${encodeURIComponent(file.url)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        loadFiles(currentFolder);
        if (selectedFile?.url === file.url) {
          setSelectedFile(null);
        }
      } else {
        alert("Ошибка удаления");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Ошибка удаления");
    }
  };

  // Копирование URL
  const copyUrl = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    
    const btn = e.currentTarget;
    btn.classList.add('bg-black/10', 'dark:bg-white/10');
    setTimeout(() => btn.classList.remove('bg-black/10', 'dark:bg-white/10'), 200);
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
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Получение иконки для файла
  const getFileIcon = (file: MediaFile) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    if (file.type.startsWith('image/')) {
      if (ext === 'gif') return '🎨';
      return '🖼️';
    }
    if (file.type.startsWith('video/')) return '🎬';
    if (ext === 'pdf') return '📕';
    if (ext === 'zip' || ext === 'rar' || ext === '7z') return '📦';
    if (ext === 'doc' || ext === 'docx') return '📘';
    if (ext === 'xls' || ext === 'xlsx') return '📊';
    return '📄';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-black rounded-2xl border border-black/10 dark:border-white/10 w-full max-w-6xl max-h-[85vh] flex flex-col shadow-2xl">
        
        {/* Заголовок */}
        <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black/5 dark:bg-white/5 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🖼️</span>
            </div>
            <div>
              <h2 className="text-lg font-light text-black/80 dark:text-white/80">
                Медиатека
              </h2>
              <p className="text-sm text-black/40 dark:text-white/40">
                Управление файлами
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

        {/* Основной контент */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          
          {/* Боковая панель с папками */}
          <div className="w-64 border-r border-black/10 dark:border-white/10 p-4 flex flex-col">
            <div className="space-y-1 flex-1">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => handleFolderChange(folder.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ${
                    currentFolder === folder.id
                      ? 'bg-black/10 dark:bg-white/10'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    currentFolder === folder.id
                      ? 'bg-black/20 dark:bg-white/20'
                      : 'bg-black/5 dark:bg-white/5'
                  }`}>
                    <span className="text-lg">{folder.icon}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-medium transition-colors duration-300 ${
                      currentFolder === folder.id
                        ? 'text-black/80 dark:text-white/80'
                        : 'text-black/60 dark:text-white/60'
                    }`}>
                      {folder.name}
                    </p>
                    <p className="text-xs text-black/40 dark:text-white/40">
                      {folder.description}
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
                  accept="image/*,video/*,.gif,.pdf,.zip,.rar,.7z,.doc,.docx,.xls,.xlsx"
                />
                <div className={`w-full px-4 py-3 rounded-xl text-sm font-medium text-center transition-all duration-300 ${
                  isUploading
                    ? 'bg-black/10 dark:bg-white/10 text-black/40 dark:text-white/40'
                    : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black/60 dark:text-white/60'
                }`}>
                  {isUploading ? 'Загрузка...' : '📤 Загрузить файл'}
                </div>
              </label>

              {/* Прогресс загрузки */}
              {isUploading && (
                <div className="mt-3 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs text-black/40 dark:text-white/40 mb-1">
                    <span>Загрузка...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-1 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black/30 dark:bg-white/30 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Основная область с файлами */}
          <div className="flex-1 flex flex-col min-h-0">
            
            {/* Панель инструментов */}
            <div className="p-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-black/40 dark:text-white/40">
                  {files.length} файлов
                </span>
              </div>
              <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    viewMode === "grid"
                      ? 'bg-black/10 dark:bg-white/10'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <svg className="w-4 h-4 text-black/60 dark:text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    viewMode === "list"
                      ? 'bg-black/10 dark:bg-white/10'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <svg className="w-4 h-4 text-black/60 dark:text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Сетка файлов */}
            <div className="flex-1 overflow-y-auto p-4">
              {files.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center animate-fadeIn">
                    <div className="w-24 h-24 mx-auto mb-4 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center justify-center">
                      <span className="text-4xl text-black/20 dark:text-white/20">
                        {folders.find(f => f.id === currentFolder)?.icon}
                      </span>
                    </div>
                    <h3 className="text-lg font-light text-black/60 dark:text-white/60 mb-2">
                      Нет файлов
                    </h3>
                    <p className="text-sm text-black/40 dark:text-white/40">
                      Загрузите первый файл в эту папку
                    </p>
                  </div>
                </div>
              ) : (
                <div className={`transition-opacity duration-300 ${
                  isTransitioning ? 'opacity-50' : 'opacity-100'
                }`}>
                  <div className={
                    viewMode === "grid" 
                      ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                      : "space-y-2"
                  }>
                    {files.map((file) => (
                      <div
                        key={file.name}
                        onClick={() => setSelectedFile(file)}
                        className={`group relative cursor-pointer rounded-xl border transition-all duration-300 ${
                          selectedFile?.url === file.url
                            ? 'border-black/30 dark:border-white/30 bg-black/5 dark:bg-white/5'
                            : 'border-transparent hover:border-black/20 dark:hover:border-white/20 hover:shadow-lg'
                        }`}
                      >
                        {viewMode === "grid" ? (
                          // Grid view
                          <div className="aspect-square">
                            <div className="w-full h-full p-4">
                              {file.type.startsWith('image/') ? (
                                <div className="w-full h-full rounded-lg overflow-hidden bg-black/5 dark:bg-white/5">
                                  <img
                                    src={file.url}
                                    alt={file.name}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                </div>
                              ) : (
                                <div className="w-full h-full bg-black/5 dark:bg-white/5 rounded-lg flex flex-col items-center justify-center">
                                  <span className="text-5xl mb-2 transition-transform duration-300 group-hover:scale-110">
                                    {getFileIcon(file)}
                                  </span>
                                  <span className="text-xs text-black/40 dark:text-white/40">
                                    {file.name.split('.').pop()?.toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {/* Название файла */}
                            <div className="absolute bottom-2 left-2 right-2">
                              <div className="bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-lg px-2 py-1 text-xs font-medium text-black/70 dark:text-white/70 truncate border border-black/10 dark:border-white/10">
                                {file.name}
                              </div>
                            </div>
                          </div>
                        ) : (
                          // List view
                          <div className="flex items-center gap-4 p-3">
                            <div className="w-10 h-10 bg-black/5 dark:bg-white/5 rounded-lg flex items-center justify-center">
                              <span className="text-xl transition-transform duration-300 group-hover:scale-110">
                                {getFileIcon(file)}
                              </span>
                            </div>
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

                        {/* Hover overlay с действиями */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-end justify-center p-3">
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelect(file.url);
                                onClose();
                              }}
                              className="p-2 bg-white dark:bg-black rounded-lg text-sm hover:scale-110 transition-transform duration-300 shadow-lg border border-black/10 dark:border-white/10"
                              title="Вставить"
                            >
                              📎
                            </button>
                            <button
                              onClick={(e) => copyUrl(file.url, e)}
                              className="p-2 bg-white dark:bg-black rounded-lg text-sm hover:scale-110 transition-transform duration-300 shadow-lg border border-black/10 dark:border-white/10"
                              title="Копировать URL"
                            >
                              📋
                            </button>
                            <button
                              onClick={(e) => handleDelete(file, e)}
                              className="p-2 bg-white dark:bg-black rounded-lg text-sm hover:scale-110 transition-transform duration-300 shadow-lg border border-black/10 dark:border-white/10 hover:bg-red-50 dark:hover:bg-red-950/30"
                              title="Удалить"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
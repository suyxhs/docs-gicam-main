"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { FolderNavigation } from "@/components/admin/folder-navigation";
import { MediaManager } from "@/components/admin/media-manager";
import { CreateFileModal } from "@/components/admin/create-file-modal";
import { DeleteFolderModal } from "@/components/admin/delete-folder-modal";
import "./editor.css";

// Динамический импорт MarkdownEditor
const MarkdownEditor = dynamic(
  () => import("react-markdown-editor-lite"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[550px] bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-12 h-12 border border-black/20 dark:border-white/20 border-t-black dark:border-t-white rounded-full animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-black/60 dark:text-white/60 text-sm font-light tracking-wide">
            Загрузка редактора
          </p>
        </div>
      </div>
    )
  }
);

import MarkdownIt from "markdown-it";

const mdParser = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

type DocItem = {
  filename: string;
  title: string;
  description: string;
  lastModified?: string;
  path: string;
  folder: string;
};

type AnalyticsData = {
  totalDocs: number;
  totalFolders: number;
  recentDocs: DocItem[];
  docsByFolder: { folder: string; count: number }[];
  activityLastWeek: { date: string; count: number }[];
};

const ITEMS_PER_PAGE = 10;

export default function AdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [files, setFiles] = useState<DocItem[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [currentFolder, setCurrentFolder] = useState("");
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop' | 'wide' | 'ultrawide'>('desktop');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showMediaManager, setShowMediaManager] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalDocs: 0,
    totalFolders: 0,
    recentDocs: [],
    docsByFolder: [],
    activityLastWeek: [],
  });

  // Состояния для удаления папки
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);
  const [folderInfo, setFolderInfo] = useState<{
    filesCount: number;
    foldersCount: number;
    totalItems: number;
  } | null>(null);

  // Пагинация для документов
  const [currentPage, setCurrentPage] = useState(1);
  const [foldersPage, setFoldersPage] = useState(1);

  // Проверка авторизации
  useEffect(() => {
    const auth = localStorage.getItem("auth");
    if (!auth) {
      router.push("/admin/login");
    } else {
      setIsLoading(false);
    }
  }, []);

  // Определение размера экрана
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      
      if (width < 768) setScreenSize('mobile');
      else if (width < 1024) setScreenSize('tablet');
      else if (width < 1440) setScreenSize('desktop');
      else if (width < 1920) setScreenSize('wide');
      else setScreenSize('ultrawide'); // 1920px и выше, включая 2560px
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Закрытие шаблонов при клике вне
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showTemplates && !(e.target as Element).closest('.templates-menu')) {
        setShowTemplates(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showTemplates]);

  // Блокировка скролла body в полноэкранном режиме и при открытых модальных окнах
  useEffect(() => {
    if (isFullscreen || showSaveModal || showMediaManager || showCreateModal || folderToDelete) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen, showSaveModal, showMediaManager, showCreateModal, folderToDelete]);

  // Глобальные горячие клавиши (только сохранение и ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S для сохранения (только когда открыт редактор)
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && selected) {
        e.preventDefault();
        saveFile();
      }
      // Esc для закрытия модалок
      if (e.key === 'Escape') {
        setShowMediaManager(false);
        setShowTemplates(false);
        setShowCreateModal(false);
        setFolderToDelete(null);
        setFolderInfo(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected]);

  // Загрузка списка документов и папок
  const loadDocs = async (folder = currentFolder) => {
    try {
      const url = folder 
        ? `/api/docs?folder=${encodeURIComponent(folder)}`
        : '/api/docs';
      
      const res = await fetch(url);
      const data = await res.json();
      
      setFiles(data.files || []);
      setFolders(data.folders || []);
      setBreadcrumbs(data.breadcrumbs || []);
      setCurrentFolder(data.currentFolder || "");
      setCurrentPage(1);
      setFoldersPage(1);
      
      updateAnalytics(data.files || [], data.folders || []);
    } catch (error) {
      console.error("Ошибка загрузки:", error);
    }
  };

  // Обновление аналитики
  const updateAnalytics = (docs: DocItem[], foldersList: string[]) => {
    const totalDocs = docs.length;
    const totalFolders = foldersList.length;

    const recentDocs = [...docs]
      .sort((a, b) => {
        if (a.lastModified && b.lastModified) {
          return b.lastModified.localeCompare(a.lastModified);
        }
        return 0;
      })
      .slice(0, 5);

    const folderCounts: Record<string, number> = {};
    docs.forEach(doc => {
      const folder = doc.folder || 'root';
      folderCounts[folder] = (folderCounts[folder] || 0) + 1;
    });

    const docsByFolder = Object.entries(folderCounts)
      .map(([folder, count]) => ({ folder, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const lastWeek = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const activityLastWeek = lastWeek.map(date => {
      const count = docs.filter(doc => doc.lastModified === date).length;
      return { date, count };
    });

    setAnalytics({
      totalDocs,
      totalFolders,
      recentDocs,
      docsByFolder,
      activityLastWeek,
    });
  };

  useEffect(() => {
    loadDocs();
  }, []);

  // Загрузка файла
  const loadFile = async (filepath: string) => {
    setIsLoading(true);
    try {
      const encodedPath = encodeURIComponent(filepath);
      const res = await fetch(`/api/docs/${encodedPath}`);
      
      if (!res.ok) throw new Error("Ошибка загрузки");
      
      const data = await res.json();
      setSelected(filepath);
      setTitle(data.title || "");
      setDescription(data.description || "");
      setContent(data.content || "");
      setShowTemplates(false);
    } catch (error) {
      alert("Не удалось загрузить файл");
    } finally {
      setIsLoading(false);
      setIsSidebarOpen(false);
    }
  };

  // Сохранение файла
  const saveFile = async () => {
    if (!selected) return;
    setIsSaving(true);
    
    try {
      const pathParts = selected.split('/');
      const filename = pathParts.pop() || '';
      const folder = pathParts.join('/');
      
      const response = await fetch("/api/docs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename,
          title,
          description,
          content,
          folder,
        }),
      });
      
      if (!response.ok) throw new Error();
      
      await loadDocs();
      setShowSaveModal(true);
      
    } catch (error) {
      alert("Ошибка при сохранении");
    } finally {
      setIsSaving(false);
    }
  };

  // Закрыть модальное окно и вернуться к аналитике
  const handleCloseSaveModal = () => {
    setShowSaveModal(false);
    setSelected("");
    setTitle("");
    setDescription("");
    setContent("");
    if (isFullscreen) setIsFullscreen(false);
  };

  // Создание нового файла (открытие модального окна)
  const createNew = () => {
    setShowCreateModal(true);
  };

  // Обработка создания файла из модального окна
  const handleCreateFile = (filename: string, templateContent: string) => {
    const fullPath = currentFolder ? `${currentFolder}/${filename}` : filename;
    
    setSelected(fullPath);
    setTitle(filename.replace(/\.(md|mdx)$/, '').split('/').pop() || 'Новый документ');
    setDescription("Новый документ");
    setContent(templateContent);
    
    setShowCreateModal(false);
    setIsSidebarOpen(false);
  };

  // Создание новой папки
  const createFolder = async (folderName: string) => {
    try {
      const response = await fetch("/api/docs/folder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folder: currentFolder ? `${currentFolder}/${folderName}` : folderName,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Ошибка создания папки");
        return;
      }
      
      await loadDocs();
    } catch (error) {
      console.error("Ошибка создания папки:", error);
      alert("Не удалось создать папку");
    }
  };

  // Удаление папки
  const deleteFolder = async (folder: string, force: boolean = false) => {
    try {
      const response = await fetch(`/api/docs/folder?folder=${encodeURIComponent(folder)}&force=${force}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const data = await response.json();
        
        // Если папка не пуста и не было force, показываем информацию
        if (data.filesCount !== undefined) {
          setFolderInfo({
            filesCount: data.filesCount,
            foldersCount: data.foldersCount,
            totalItems: data.totalItems
          });
          return false;
        }
        
        alert(data.error || "Ошибка удаления папки");
        return false;
      }
      
      await loadDocs();
      return true;
    } catch (error) {
      console.error("Ошибка удаления папки:", error);
      alert("Не удалось удалить папку");
      return false;
    }
  };

  // Функция для открытия модалки удаления папки
  const handleDeleteFolderClick = (folderPath: string) => {
    setFolderToDelete(folderPath);
    setFolderInfo(null); // Сбрасываем информацию
  };

  // Функция подтверждения удаления папки
  const handleConfirmDeleteFolder = async (force: boolean = false) => {
    if (!folderToDelete) return;
    
    setIsDeletingFolder(true);
    try {
      const success = await deleteFolder(folderToDelete, force);
      if (success) {
        setFolderToDelete(null);
        setFolderInfo(null);
      }
    } finally {
      setIsDeletingFolder(false);
    }
  };

  // Удаление файла
  const deleteFile = async (filepath: string) => {
    if (!confirm("Удалить документ?")) return;
    
    try {
      const response = await fetch(`/api/docs?path=${encodeURIComponent(filepath)}`, {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error();
      
      await loadDocs();
      
      if (selected === filepath) {
        setSelected("");
        setTitle("");
        setDescription("");
        setContent("");
      }
    } catch (error) {
      alert("Ошибка при удалении");
    }
  };

  // Переход в папку
  const handleFolderClick = (folder: string) => {
    setCurrentFolder(folder);
    loadDocs(folder);
    setSelected("");
    setTitle("");
    setDescription("");
    setContent("");
    setShowTemplates(false);
  };

  // Переход на уровень выше
  const handleMoveToParent = () => {
    const parent = breadcrumbs.slice(0, -1).join('/');
    handleFolderClick(parent);
  };

  // Фильтрация документов
  const filteredFiles = files.filter(doc => 
    doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Пагинация для документов
  const totalDocPages = Math.ceil(filteredFiles.length / ITEMS_PER_PAGE);
  const paginatedDocs = filteredFiles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Пагинация для папок
  const totalFolderPages = Math.ceil(folders.length / ITEMS_PER_PAGE);
  const paginatedFolders = folders.slice(
    (foldersPage - 1) * ITEMS_PER_PAGE,
    foldersPage * ITEMS_PER_PAGE
  );

  // Форматирование даты
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  // Компонент пагинации
  const Pagination = ({ current, total, onPageChange }: { current: number; total: number; onPageChange: (page: number) => void }) => {
    if (total <= 1) return null;
    
    return (
      <div className="flex items-center justify-center gap-1 mt-4">
        <button
          onClick={() => onPageChange(current - 1)}
          disabled={current === 1}
          className="px-3 py-1 text-sm bg-black/5 dark:bg-white/5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          ←
        </button>
        <span className="px-3 py-1 text-sm text-black/60 dark:text-white/60">
          {current} / {total}
        </span>
        <button
          onClick={() => onPageChange(current + 1)}
          disabled={current === total}
          className="px-3 py-1 text-sm bg-black/5 dark:bg-white/5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          →
        </button>
      </div>
    );
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Функция для получения максимальной ширины редактора в зависимости от размера экрана
  const getEditorMaxWidth = () => {
    if (isFullscreen) return '100%';
    
    switch (screenSize) {
      case 'mobile': return '100%';
      case 'tablet': return '100%';
      case 'desktop': return '1200px';
      case 'wide': return '1600px';
      case 'ultrawide': return '2200px'; // Для 2560px экранов
      default: return '1200px';
    }
  };

  // Функция для получения высоты редактора
  const getEditorHeight = () => {
    if (isFullscreen) return '100%';
    
    switch (screenSize) {
      case 'mobile': return 350;
      case 'tablet': return 450;
      case 'desktop': return 550;
      case 'wide': return 650;
      case 'ultrawide': return 750; // Больше высота для ультрашироких
      default: return 550;
    }
  };

  // Функция для получения отступов контента
  const getContentPadding = () => {
    if (isFullscreen) return 'p-4 md:p-8';
    
    switch (screenSize) {
      case 'mobile': return 'p-3';
      case 'tablet': return 'p-4 md:p-6';
      case 'desktop': return 'p-6 md:p-8';
      case 'wide': return 'p-8 md:p-10';
      case 'ultrawide': return 'p-10 md:p-12'; // Больше отступы для ультрашироких
      default: return 'p-6 md:p-8';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 border border-black/20 dark:border-white/20 border-t-black dark:border-t-white rounded-full animate-spin" />
          <p className="text-black/60 dark:text-white/60 text-sm font-light">
            Загрузка...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-black overflow-hidden">
      {/* Мобильный оверлей */}
      {isSidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/20 dark:bg-black/80 z-40 animate-fadeIn"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Сайдбар */}
      <div className={`
        fixed md:relative z-50 h-full
        transition-transform duration-300 ease-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        w-80
        bg-white dark:bg-black
        border-r border-black/10 dark:border-white/10
        flex flex-col
        shrink-0
        ${isFullscreen ? 'hidden' : ''}
      `}>
        {/* Хедер сайдбара */}
        <div className="p-4 md:p-6 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-black/80 dark:text-white/80">
                Библиотека
              </h2>
              <p className="text-xs text-black/40 dark:text-white/40 mt-0.5">
                {files.length} документов
              </p>
            </div>
            
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden w-8 h-8 flex items-center justify-center text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Навигация */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            <FolderNavigation
              folders={paginatedFolders}
              currentFolder={currentFolder}
              breadcrumbs={breadcrumbs}
              onFolderClick={handleFolderClick}
              onCreateFolder={createFolder}
              onDeleteFolder={deleteFolder}
              onMoveToParent={handleMoveToParent}
              onDeleteClick={handleDeleteFolderClick}
            />
            
            <Pagination
              current={foldersPage}
              total={totalFolderPages}
              onPageChange={setFoldersPage}
            />
          </div>

          {/* Поиск */}
          <div className="px-4 md:px-6 pb-4">
            <input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-black/5 dark:bg-white/5 border border-transparent focus:border-black/20 dark:focus:border-white/20 rounded-lg text-sm transition-colors placeholder:text-black/30 dark:placeholder:text-white/30"
            />
          </div>

          {/* Список документов */}
          <div className="px-4 md:px-6 pb-6">
            <button
              onClick={createNew}
              className="w-full mb-4 px-4 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              <span>+</span>
              <span>Новый документ</span>
            </button>

            <div className="space-y-1">
              {paginatedDocs.map((doc) => (
                <div key={doc.path} className="group relative">
                  <button
                    onClick={() => loadFile(doc.path)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selected === doc.path
                        ? 'bg-black/10 dark:bg-white/10'
                        : 'hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-black/40 dark:text-white/40">📄</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-black/80 dark:text-white/80 truncate">
                          {doc.title}
                        </p>
                        {doc.description && (
                          <p className="text-xs text-black/40 dark:text-white/40 truncate">
                            {doc.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => deleteFile(doc.path)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-opacity"
                  >
                    <span className="text-sm text-black/40 dark:text-white/40">✕</span>
                  </button>
                </div>
              ))}
            </div>

            <Pagination
              current={currentPage}
              total={totalDocPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>

        {/* Футер сайдбара */}
        <div className="p-4 md:p-6 border-t border-black/10 dark:border-white/10">
          <button
            onClick={() => {
              localStorage.removeItem("auth");
              router.push("/admin/login");
            }}
            className="w-full px-4 py-2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors text-sm"
          >
            Выйти
          </button>
        </div>
      </div>

      {/* Основная область */}
      <div className={`flex-1 overflow-y-auto transition-all duration-300 ${
        isFullscreen 
          ? 'fixed inset-0 z-[100] bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-black' 
          : ''
      }`}>
        {/* Мобильная шапка */}
        {!isFullscreen && (
          <div className="md:hidden sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-black/10 dark:border-white/10 p-3 z-10">
            <div className="flex items-center justify-between">
              {/* Левая часть - шаблоны */}
              <div className="relative templates-menu">
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
                  title="Быстрые шаблоны"
                >
                  <span className="text-xl">⚡️</span>
                </button>

                {/* Выпадающее меню шаблонов для мобильных */}
                {showTemplates && (
                  <div className="absolute left-0 top-12 w-64 bg-white dark:bg-black/90 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-fadeIn">
                    <div className="p-3 border-b border-black/10 dark:border-white/10">
                      <h3 className="text-xs font-medium text-black/60 dark:text-white/60">
                        Быстрые шаблоны
                      </h3>
                    </div>
                    
                    <div className="p-2 max-h-96 overflow-y-auto">
                      {/* API Документация */}
                      <button
                        onClick={() => {
                          const fileName = prompt("Введите имя файла:", "api-docs.mdx");
                          if (fileName) {
                            const fullPath = currentFolder ? `${currentFolder}/${fileName}` : fileName;
                            setSelected(fullPath);
                            setTitle("API Документация");
                            setDescription("Описание API эндпоинтов");
                            setContent(`# API Документация

## Базовый URL
\`\`\`
https://api.example.com/v1
\`\`\`

## Аутентификация
Для доступа к API требуется API ключ в заголовке:
\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Эндпоинты

### GET /users
Получение списка пользователей

**Параметры:**
- \`page\` - номер страницы (опционально)
- \`limit\` - количество записей (опционально)

**Ответ:**
\`\`\`json
{
  "users": [],
  "total": 100,
  "page": 1
}
\`\`\`

### POST /users
Создание нового пользователя

**Тело запроса:**
\`\`\`json
{
  "name": "Иван Петров",
  "email": "ivan@example.com"
}
\`\`\`

**Ответ:**
\`\`\`json
{
  "id": 1,
  "name": "Иван Петров",
  "email": "ivan@example.com",
  "createdAt": "2024-01-01T00:00:00Z"
}
\`\`\`
`);
                            setShowTemplates(false);
                          }
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors text-sm flex items-center gap-2"
                      >
                        <span className="text-lg">📡</span>
                        <div>
                          <p className="font-medium text-black/80 dark:text-white/80">API Документация</p>
                          <p className="text-xs text-black/40 dark:text-white/40">Шаблон для описания API</p>
                        </div>
                      </button>

                      {/* Руководство */}
                      <button
                        onClick={() => {
                          const fileName = prompt("Введите имя файла:", "guide.mdx");
                          if (fileName) {
                            const fullPath = currentFolder ? `${currentFolder}/${fileName}` : fileName;
                            setSelected(fullPath);
                            setTitle("Руководство пользователя");
                            setDescription("Пошаговое руководство");
                            setContent(`# Руководство пользователя

## Введение
Добро пожаловать в руководство пользователя. Здесь вы найдете всю необходимую информацию для работы с системой.

## Начало работы

### Шаг 1: Регистрация
1. Перейдите на страницу регистрации
2. Заполните необходимые поля
3. Подтвердите email

### Шаг 2: Настройка профиля
После регистрации настройте свой профиль:
- Загрузите аватар
- Укажите контактные данные
- Настройте уведомления

### Шаг 3: Первые шаги
Теперь вы готовы к работе! Вот что можно сделать:
- Создать первый проект
- Пригласить команду
- Настроить интеграции

## Основные функции

### Функция 1
Описание первой основной функции...

### Функция 2
Описание второй основной функции...

## Часто задаваемые вопросы

**Вопрос:** Как сбросить пароль?
**Ответ:** Нажмите "Забыли пароль" на странице входа.

**Вопрос:** Как связаться с поддержкой?
**Ответ:** Напишите на support@example.com
`);
                            setShowTemplates(false);
                          }
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors text-sm flex items-center gap-2 mt-1"
                      >
                        <span className="text-lg">📖</span>
                        <div>
                          <p className="font-medium text-black/80 dark:text-white/80">Руководство</p>
                          <p className="text-xs text-black/40 dark:text-white/40">Пошаговое руководство</p>
                        </div>
                      </button>

                      {/* README */}
                      <button
                        onClick={() => {
                          const fileName = prompt("Введите имя файла:", "README.mdx");
                          if (fileName) {
                            const fullPath = currentFolder ? `${currentFolder}/${fileName}` : fileName;
                            setSelected(fullPath);
                            setTitle("README");
                            setDescription("Описание проекта");
                            setContent(`# Название проекта

Краткое описание проекта, его цели и задачи.

## 🚀 Быстрый старт

### Требования
- Node.js 18+
- npm/yarn/pnpm
- PostgreSQL

### Установка

\`\`\`bash
# Клонировать репозиторий
git clone https://github.com/username/project.git

# Перейти в папку проекта
cd project

# Установить зависимости
npm install

# Настроить переменные окружения
cp .env.example .env

# Запустить проект
npm run dev
\`\`\`

## 📦 Структура проекта

\`\`\`
├── app/              # Next.js App Router
├── components/       # React компоненты
├── lib/              # Утилиты и хелперы
├── public/           # Статические файлы
├── styles/           # Глобальные стили
└── package.json      # Зависимости
\`\`\`

## 🛠 Команды

| Команда | Описание |
|---------|----------|
| \`npm run dev\` | Запуск в режиме разработки |
| \`npm run build\` | Сборка проекта |
| \`npm start\` | Запуск собранного проекта |
| \`npm run lint\` | Проверка кода |

## 📚 Документация

Подробная документация доступна в папке \`/docs\`.

## 🤝 Участие в разработке

1. Форкните репозиторий
2. Создайте ветку (\`git checkout -b feature/amazing\`)
3. Зафиксируйте изменения (\`git commit -m 'Add amazing feature'\`)
4. Отправьте изменения (\`git push origin feature/amazing\`)
5. Откройте Pull Request

## 📄 Лицензия

MIT
`);
                            setShowTemplates(false);
                          }
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors text-sm flex items-center gap-2 mt-1"
                      >
                        <span className="text-lg">📝</span>
                        <div>
                          <p className="font-medium text-black/80 dark:text-white/80">README</p>
                          <p className="text-xs text-black/40 dark:text-white/40">Описание проекта</p>
                        </div>
                      </button>

                      {/* Changelog */}
                      <button
                        onClick={() => {
                          const fileName = prompt("Введите имя файла:", "changelog.mdx");
                          if (fileName) {
                            const fullPath = currentFolder ? `${currentFolder}/${fileName}` : fileName;
                            setSelected(fullPath);
                            setTitle("Changelog");
                            setDescription("История изменений");
                            setContent(`# Changelog

Все заметные изменения в проекте будут документироваться в этом файле.

## [Unreleased]

### Добавлено
- Новая функция 1
- Новая функция 2

### Изменено
- Улучшена производительность
- Обновлен дизайн

### Исправлено
- Исправлена ошибка 1
- Исправлена ошибка 2

## [1.0.0] - 2024-01-15

### Добавлено
- Первый релиз проекта
- Базовая функциональность
- Аутентификация пользователей
- CRUD операции

## [0.1.0] - 2024-01-01

### Добавлено
- Начальная структура проекта
- Базовая конфигурация
- Документация
`);
                            setShowTemplates(false);
                          }
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors text-sm flex items-center gap-2 mt-1"
                      >
                        <span className="text-lg">📋</span>
                        <div>
                          <p className="font-medium text-black/80 dark:text-white/80">Changelog</p>
                          <p className="text-xs text-black/40 dark:text-white/40">История изменений</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Центр - логотип */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-black/80 to-black dark:from-white/80 dark:to-white rounded-xl flex items-center justify-center">
                  <span className="text-white dark:text-black text-sm font-bold">G</span>
                </div>
                <span className="text-sm font-medium text-black/80 dark:text-white/80">
                  Gicam Dock
                </span>
              </div>

              {/* Правая часть - кнопка открытия сайдбара */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="w-10 h-10 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
              >
                <span className="text-xl">☰</span>
              </button>
            </div>

            {/* Хлебные крошки */}
            {breadcrumbs.length > 0 && (
              <div className="flex items-center gap-1 mt-2 px-2 text-xs">
                <span className="text-black/40 dark:text-white/40">📁</span>
                {breadcrumbs.map((crumb, index) => (
                  <div key={crumb} className="flex items-center gap-1">
                    {index > 0 && <span className="text-black/20 dark:text-white/20">/</span>}
                    <button
                      onClick={() => handleFolderClick(breadcrumbs.slice(0, index + 1).join('/'))}
                      className="text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
                    >
                      {crumb}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Контент */}
        <div className={`${isFullscreen ? 'h-screen p-4 md:p-8' : getContentPadding()}`}>
          {selected ? (
            // Режим редактирования
            <div className={`${isFullscreen ? 'h-full mx-auto' : 'mx-auto space-y-6'}`}
                 style={{ maxWidth: isFullscreen ? '100%' : getEditorMaxWidth() }}>
              {!isFullscreen && (
                <div>
                  <h1 className="text-xl md:text-2xl font-light text-black/80 dark:text-white/80 mb-1">
                    Редактирование
                  </h1>
                  <p className="text-xs md:text-sm text-black/40 dark:text-white/40 break-all">
                    {selected}
                  </p>
                </div>
              )}

              {/* Полноэкранная шапка */}
              {isFullscreen && (
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/10 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-black/5 dark:bg-white/5 rounded-xl flex items-center justify-center">
                      <span className="text-xl">📝</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base md:text-lg font-medium text-black/80 dark:text-white/80 truncate">
                        {selected}
                      </h2>
                      <p className="text-xs text-black/40 dark:text-white/40">
                        Редактирование документа
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setShowMediaManager(true)}
                      className="px-3 md:px-4 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl text-xs md:text-sm transition-colors flex items-center gap-1 md:gap-2"
                    >
                      <span>🖼️</span>
                      <span className="hidden sm:inline">Медиа</span>
                    </button>
                    <button
                      onClick={toggleFullscreen}
                      className="px-3 md:px-4 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl text-xs md:text-sm transition-colors flex items-center gap-1 md:gap-2"
                    >
                      <span>✕</span>
                      <span className="hidden sm:inline">Свернуть</span>
                    </button>
                  </div>
                </div>
              )}

              <div className={`${isFullscreen ? 'h-[calc(100vh-120px)] flex flex-col' : 'space-y-4'}`}>
                {!isFullscreen && (
                  <>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Заголовок"
                      className="w-full px-4 py-2 md:px-4 md:py-3 bg-black/5 dark:bg-white/5 border border-transparent focus:border-black/20 dark:focus:border-white/20 rounded-lg text-base md:text-lg transition-colors placeholder:text-black/30 dark:placeholder:text-white/30"
                    />

                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Описание"
                      className="w-full px-4 py-2 md:px-4 md:py-3 bg-black/5 dark:bg-white/5 border border-transparent focus:border-black/20 dark:focus:border-white/20 rounded-lg text-sm md:text-base transition-colors placeholder:text-black/30 dark:placeholder:text-white/30"
                    />
                  </>
                )}

                {/* Редактор */}
                <div className={`${isFullscreen ? 'flex-1 flex flex-col' : ''}`}>
                  {/* Панель инструментов редактора (только не в полноэкранном режиме) */}
                  {!isFullscreen && (
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs md:text-sm text-black/40 dark:text-white/40">
                          Редактор
                        </span>
                      </div>
                      <div className="flex items-center gap-1 md:gap-2">
                        <button
                          onClick={() => setShowMediaManager(true)}
                          className="px-2 md:px-3 py-1 md:py-1.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-xs md:text-sm transition-colors flex items-center gap-1"
                        >
                          <span className="text-sm md:text-lg">🖼️</span>
                          <span className="hidden sm:inline">Медиа</span>
                        </button>
                        <button
                          onClick={toggleFullscreen}
                          className="px-2 md:px-3 py-1 md:py-1.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-xs md:text-sm transition-colors flex items-center gap-1"
                          title="На весь экран"
                        >
                          <span className="text-sm md:text-lg">⛶</span>
                          <span className="hidden sm:inline">На весь экран</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Редактор с ограничением по высоте */}
                  <div className={`border border-black/10 dark:border-white/10 rounded-xl overflow-hidden ${
                    isFullscreen ? 'flex-1 shadow-2xl' : ''
                  }`}>
                    <MarkdownEditor
                      value={content}
                      onChange={({ text }) => setContent(text)}
                      renderHTML={(text) => mdParser.render(text)}
                      config={{
                        view: {
                          menu: true,
                          md: true,
                          html: true,
                        },
                        canView: {
                          menu: true,
                          md: true,
                          html: true,
                          both: true,
                          fullScreen: false,
                        },
                      }}
                      style={{ 
                        height: isFullscreen ? '100%' : getEditorHeight(),
                        width: '100%',
                        maxHeight: isFullscreen ? 'calc(100vh - 120px)' : 'none',
                        minHeight: isMobile ? 300 : 400,
                      }}
                    />
                  </div>
                </div>

                {/* Кнопки действий */}
                <div className={`flex flex-wrap gap-2 md:gap-3 ${isFullscreen ? 'mt-4' : 'pt-4'}`}>
                  <button
                    onClick={saveFile}
                    disabled={isSaving}
                    className="flex-1 min-w-[120px] px-4 md:px-6 py-2 md:py-3 bg-black/90 dark:bg-white/90 text-white dark:text-black rounded-lg md:rounded-xl text-xs md:text-sm font-medium hover:bg-black dark:hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-1 md:gap-2 group shadow-lg"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
                        <span className="hidden xs:inline">Сохранение...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-base md:text-lg group-hover:scale-110 transition-transform">💾</span>
                        <span className="hidden xs:inline">Сохранить</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelected("");
                      setTitle("");
                      setDescription("");
                      setContent("");
                      if (isFullscreen) toggleFullscreen();
                    }}
                    className="flex-1 min-w-[80px] px-4 md:px-6 py-2 md:py-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-colors flex items-center justify-center gap-1 md:gap-2 group"
                  >
                    <span className="text-base md:text-lg group-hover:scale-110 transition-transform">✕</span>
                    <span className="hidden xs:inline">Отмена</span>
                  </button>
                </div>
              </div>

              {/* Медиа-менеджер */}
              {showMediaManager && (
                <MediaManager
                  onSelect={(url) => {
                    setContent(prev => prev + `\n![](${url})\n`);
                    setShowMediaManager(false);
                  }}
                  onClose={() => setShowMediaManager(false)}
                />
              )}
            </div>
          ) : (
            // Аналитика и шаблоны
            <div className="max-w-7xl xl:max-w-[1800px] 2xl:max-w-[2200px] mx-auto space-y-8 md:space-y-12">
              {/* Аналитика - сверху */}
              <div className="space-y-6 md:space-y-8">
                <h2 className="text-lg md:text-xl font-light text-black/80 dark:text-white/80">
                  Статистика
                </h2>
                
                {/* Основные показатели - адаптивная сетка */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                  <div className="p-3 md:p-4 bg-black/5 dark:bg-white/5 rounded-lg">
                    <p className="text-xs text-black/40 dark:text-white/40 mb-1">
                      Всего документов
                    </p>
                    <p className="text-xl md:text-2xl lg:text-3xl font-light text-black/80 dark:text-white/80">
                      {analytics.totalDocs}
                    </p>
                  </div>
                  
                  <div className="p-3 md:p-4 bg-black/5 dark:bg-white/5 rounded-lg">
                    <p className="text-xs text-black/40 dark:text-white/40 mb-1">
                      Папок
                    </p>
                    <p className="text-xl md:text-2xl lg:text-3xl font-light text-black/80 dark:text-white/80">
                      {analytics.totalFolders}
                    </p>
                  </div>
                  
                  <div className="p-3 md:p-4 bg-black/5 dark:bg-white/5 rounded-lg">
                    <p className="text-xs text-black/40 dark:text-white/40 mb-1">
                      В корне
                    </p>
                    <p className="text-xl md:text-2xl lg:text-3xl font-light text-black/80 dark:text-white/80">
                      {files.filter(f => !f.folder).length}
                    </p>
                  </div>
                  
                  <div className="p-3 md:p-4 bg-black/5 dark:bg-white/5 rounded-lg">
                    <p className="text-xs text-black/40 dark:text-white/40 mb-1">
                      В папках
                    </p>
                    <p className="text-xl md:text-2xl lg:text-3xl font-light text-black/80 dark:text-white/80">
                      {files.filter(f => f.folder).length}
                    </p>
                  </div>
                </div>

                {/* Активность за неделю */}
                <div>
                  <h3 className="text-xs md:text-sm font-medium text-black/60 dark:text-white/60 mb-3 md:mb-4">
                    Активность за неделю
                  </h3>
                  <div className="flex items-end justify-between gap-1 md:gap-2 h-24 md:h-32">
                    {analytics.activityLastWeek.map((day, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 md:gap-2">
                        <div className="w-full bg-black/5 dark:bg-white/5 rounded-t relative h-16 md:h-24">
                          <div 
                            className="absolute bottom-0 left-0 right-0 bg-black/30 dark:bg-white/30 rounded-t transition-all duration-500"
                            style={{ height: `${Math.min(100, day.count * 20)}%` }}
                          />
                        </div>
                        <span className="text-[8px] md:text-xs text-black/40 dark:text-white/40 rotate-45 md:rotate-0 origin-left md:origin-center">
                          {formatDate(day.date)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Документы по папкам */}
                {analytics.docsByFolder.length > 0 && (
                  <div>
                    <h3 className="text-xs md:text-sm font-medium text-black/60 dark:text-white/60 mb-3 md:mb-4">
                      Документы по папкам
                    </h3>
                    <div className="space-y-2">
                      {analytics.docsByFolder.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 md:gap-3">
                          <span className="text-xs text-black/40 dark:text-white/40 w-16 md:w-24 truncate">
                            {item.folder === 'root' ? 'Корень' : item.folder}
                          </span>
                          <div className="flex-1 h-4 md:h-6 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-black/30 dark:bg-white/30 transition-all duration-500"
                              style={{ width: `${(item.count / analytics.totalDocs) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-black/60 dark:text-white/60">
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Последние документы */}
                {analytics.recentDocs.length > 0 && (
                  <div>
                    <h3 className="text-xs md:text-sm font-medium text-black/60 dark:text-white/60 mb-3 md:mb-4">
                      Последние изменения
                    </h3>
                    <div className="space-y-1 md:space-y-2">
                      {analytics.recentDocs.map((doc, i) => (
                        <button
                          key={i}
                          onClick={() => loadFile(doc.path)}
                          className="w-full flex items-center justify-between p-2 md:p-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors group"
                        >
                          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                            <span className="text-base md:text-lg text-black/40 dark:text-white/40 flex-shrink-0">📄</span>
                            <div className="text-left min-w-0 flex-1">
                              <p className="text-xs md:text-sm text-black/80 dark:text-white/80 truncate">
                                {doc.title}
                              </p>
                              <p className="text-[10px] md:text-xs text-black/40 dark:text-white/40 truncate">
                                {doc.folder || 'Корень'}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] md:text-xs text-black/30 dark:text-white/30 group-hover:text-black/50 dark:group-hover:text-white/50 flex-shrink-0">
                            {doc.lastModified}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Быстрые шаблоны - снизу с разделителем */}
              <div className="hidden md:block pt-6 md:pt-8 border-t border-black/10 dark:border-white/10">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h2 className="text-lg md:text-xl font-light text-black/80 dark:text-white/80">
                    Быстрые шаблоны
                  </h2>
                  <button
                    onClick={() => setShowTemplates(true)}
                    className="text-xs md:text-sm text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1"
                  >
                    <span>Все шаблоны</span>
                    <span>→</span>
                  </button>
                </div>

                {/* Сетка шаблонов - максимально широкая */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
                  {/* API Документация */}
                  <button
                    onClick={() => {
                      const fileName = prompt("Введите имя файла:", "api-docs.mdx");
                      if (fileName) {
                        const fullPath = currentFolder ? `${currentFolder}/${fileName}` : fileName;
                        setSelected(fullPath);
                        setTitle("API Документация");
                        setDescription("Описание API эндпоинтов");
                        setContent(`# API Документация

## Базовый URL
\`\`\`
https://api.example.com/v1
\`\`\`

## Аутентификация
Для доступа к API требуется API ключ в заголовке:
\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Эндпоинты

### GET /users
Получение списка пользователей

**Параметры:**
- \`page\` - номер страницы (опционально)
- \`limit\` - количество записей (опционально)

**Ответ:**
\`\`\`json
{
  "users": [],
  "total": 100,
  "page": 1
}
\`\`\`

### POST /users
Создание нового пользователя

**Тело запроса:**
\`\`\`json
{
  "name": "Иван Петров",
  "email": "ivan@example.com"
}
\`\`\`

**Ответ:**
\`\`\`json
{
  "id": 1,
  "name": "Иван Петров",
  "email": "ivan@example.com",
  "createdAt": "2024-01-01T00:00:00Z"
}
\`\`\`
`);
                      }
                    }}
                    className="group relative p-3 md:p-4 lg:p-5 xl:p-6 bg-white dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl md:rounded-2xl hover:border-black/30 dark:hover:border-white/30 transition-all duration-300 text-left hover:shadow-lg hover:-translate-y-1"
                  >
                    <div className="absolute top-2 right-2 md:top-4 md:right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] md:text-xs text-black/40 dark:text-white/40">использовать →</span>
                    </div>
                    <div className="text-2xl md:text-3xl mb-2 md:mb-3">📡</div>
                    <h3 className="text-sm md:text-base font-medium text-black/80 dark:text-white/80 mb-1">
                      API Документация
                    </h3>
                    <p className="text-[10px] md:text-xs text-black/40 dark:text-white/40 line-clamp-2">
                      Шаблон для описания API эндпоинтов
                    </p>
                    <div className="mt-2 md:mt-3 flex flex-wrap gap-1">
                      <span className="px-1 md:px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded-full text-[8px] md:text-[10px] text-black/60 dark:text-white/60">
                        REST API
                      </span>
                      <span className="px-1 md:px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded-full text-[8px] md:text-[10px] text-black/60 dark:text-white/60">
                        эндпоинты
                      </span>
                    </div>
                  </button>

                  {/* Руководство */}
                  <button
                    onClick={() => {
                      const fileName = prompt("Введите имя файла:", "guide.mdx");
                      if (fileName) {
                        const fullPath = currentFolder ? `${currentFolder}/${fileName}` : fileName;
                        setSelected(fullPath);
                        setTitle("Руководство пользователя");
                        setDescription("Пошаговое руководство");
                        setContent(`# Руководство пользователя

## Введение
Добро пожаловать в руководство пользователя. Здесь вы найдете всю необходимую информацию для работы с системой.

## Начало работы

### Шаг 1: Регистрация
1. Перейдите на страницу регистрации
2. Заполните необходимые поля
3. Подтвердите email

### Шаг 2: Настройка профиля
После регистрации настройте свой профиль:
- Загрузите аватар
- Укажите контактные данные
- Настройте уведомления

### Шаг 3: Первые шаги
Теперь вы готовы к работе! Вот что можно сделать:
- Создать первый проект
- Пригласить команду
- Настроить интеграции

## Основные функции

### Функция 1
Описание первой основной функции...

### Функция 2
Описание второй основной функции...

## Часто задаваемые вопросы

**Вопрос:** Как сбросить пароль?
**Ответ:** Нажмите "Забыли пароль" на странице входа.

**Вопрос:** Как связаться с поддержкой?
**Ответ:** Напишите на support@example.com
`);
                      }
                    }}
                    className="group relative p-3 md:p-4 lg:p-5 xl:p-6 bg-white dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl md:rounded-2xl hover:border-black/30 dark:hover:border-white/30 transition-all duration-300 text-left hover:shadow-lg hover:-translate-y-1"
                  >
                    <div className="absolute top-2 right-2 md:top-4 md:right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] md:text-xs text-black/40 dark:text-white/40">использовать →</span>
                    </div>
                    <div className="text-2xl md:text-3xl mb-2 md:mb-3">📖</div>
                    <h3 className="text-sm md:text-base font-medium text-black/80 dark:text-white/80 mb-1">
                      Руководство
                    </h3>
                    <p className="text-[10px] md:text-xs text-black/40 dark:text-white/40 line-clamp-2">
                      Пошаговое руководство пользователя
                    </p>
                    <div className="mt-2 md:mt-3 flex flex-wrap gap-1">
                      <span className="px-1 md:px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded-full text-[8px] md:text-[10px] text-black/60 dark:text-white/60">
                        инструкция
                      </span>
                      <span className="px-1 md:px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded-full text-[8px] md:text-[10px] text-black/60 dark:text-white/60">
                        шаги
                      </span>
                    </div>
                  </button>

                  {/* README */}
                  <button
                    onClick={() => {
                      const fileName = prompt("Введите имя файла:", "README.mdx");
                      if (fileName) {
                        const fullPath = currentFolder ? `${currentFolder}/${fileName}` : fileName;
                        setSelected(fullPath);
                        setTitle("README");
                        setDescription("Описание проекта");
                        setContent(`# Название проекта

Краткое описание проекта, его цели и задачи.

## 🚀 Быстрый старт

### Требования
- Node.js 18+
- npm/yarn/pnpm
- PostgreSQL

### Установка

\`\`\`bash
# Клонировать репозиторий
git clone https://github.com/username/project.git

# Перейти в папку проекта
cd project

# Установить зависимости
npm install

# Настроить переменные окружения
cp .env.example .env

# Запустить проект
npm run dev
\`\`\`

## 📦 Структура проекта

\`\`\`
├── app/              # Next.js App Router
├── components/       # React компоненты
├── lib/              # Утилиты и хелперы
├── public/           # Статические файлы
├── styles/           # Глобальные стили
└── package.json      # Зависимости
\`\`\`

## 🛠 Команды

| Команда | Описание |
|---------|----------|
| \`npm run dev\` | Запуск в режиме разработки |
| \`npm run build\` | Сборка проекта |
| \`npm start\` | Запуск собранного проекта |
| \`npm run lint\` | Проверка кода |

## 📚 Документация

Подробная документация доступна в папке \`/docs\`.

## 🤝 Участие в разработке

1. Форкните репозиторий
2. Создайте ветку (\`git checkout -b feature/amazing\`)
3. Зафиксируйте изменения (\`git commit -m 'Add amazing feature'\`)
4. Отправьте изменения (\`git push origin feature/amazing\`)
5. Откройте Pull Request

## 📄 Лицензия

MIT
`);
                      }
                    }}
                    className="group relative p-3 md:p-4 lg:p-5 xl:p-6 bg-white dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl md:rounded-2xl hover:border-black/30 dark:hover:border-white/30 transition-all duration-300 text-left hover:shadow-lg hover:-translate-y-1"
                  >
                    <div className="absolute top-2 right-2 md:top-4 md:right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] md:text-xs text-black/40 dark:text-white/40">использовать →</span>
                    </div>
                    <div className="text-2xl md:text-3xl mb-2 md:mb-3">📝</div>
                    <h3 className="text-sm md:text-base font-medium text-black/80 dark:text-white/80 mb-1">
                      README
                    </h3>
                    <p className="text-[10px] md:text-xs text-black/40 dark:text-white/40 line-clamp-2">
                      Описание проекта для GitHub
                    </p>
                    <div className="mt-2 md:mt-3 flex flex-wrap gap-1">
                      <span className="px-1 md:px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded-full text-[8px] md:text-[10px] text-black/60 dark:text-white/60">
                        установка
                      </span>
                      <span className="px-1 md:px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded-full text-[8px] md:text-[10px] text-black/60 dark:text-white/60">
                        команды
                      </span>
                    </div>
                  </button>

                  {/* Changelog */}
                  <button
                    onClick={() => {
                      const fileName = prompt("Введите имя файла:", "changelog.mdx");
                      if (fileName) {
                        const fullPath = currentFolder ? `${currentFolder}/${fileName}` : fileName;
                        setSelected(fullPath);
                        setTitle("Changelog");
                        setDescription("История изменений");
                        setContent(`# Changelog

Все заметные изменения в проекте будут документироваться в этом файле.

## [Unreleased]

### Добавлено
- Новая функция 1
- Новая функция 2

### Изменено
- Улучшена производительность
- Обновлен дизайн

### Исправлено
- Исправлена ошибка 1
- Исправлена ошибка 2

## [1.0.0] - 2024-01-15

### Добавлено
- Первый релиз проекта
- Базовая функциональность
- Аутентификация пользователей
- CRUD операции

## [0.1.0] - 2024-01-01

### Добавлено
- Начальная структура проекта
- Базовая конфигурация
- Документация
`);
                      }
                    }}
                    className="group relative p-3 md:p-4 lg:p-5 xl:p-6 bg-white dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl md:rounded-2xl hover:border-black/30 dark:hover:border-white/30 transition-all duration-300 text-left hover:shadow-lg hover:-translate-y-1"
                  >
                    <div className="absolute top-2 right-2 md:top-4 md:right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] md:text-xs text-black/40 dark:text-white/40">использовать →</span>
                    </div>
                    <div className="text-2xl md:text-3xl mb-2 md:mb-3">📋</div>
                    <h3 className="text-sm md:text-base font-medium text-black/80 dark:text-white/80 mb-1">
                      Changelog
                    </h3>
                    <p className="text-[10px] md:text-xs text-black/40 dark:text-white/40 line-clamp-2">
                      История версий и изменений
                    </p>
                    <div className="mt-2 md:mt-3 flex flex-wrap gap-1">
                      <span className="px-1 md:px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded-full text-[8px] md:text-[10px] text-black/60 dark:text-white/60">
                        версии
                      </span>
                      <span className="px-1 md:px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded-full text-[8px] md:text-[10px] text-black/60 dark:text-white/60">
                        релизы
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно успешного сохранения */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fadeIn">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseSaveModal}
          />
          
          <div className="relative bg-white dark:bg-black rounded-2xl shadow-2xl w-full max-w-md p-6 md:p-8 border border-black/10 dark:border-white/10 animate-slideUp">
            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6 bg-black/10 dark:bg-white/10 rounded-full flex items-center justify-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-black/90 dark:bg-white/90 rounded-full flex items-center justify-center text-white dark:text-black text-2xl md:text-4xl shadow-lg">
                ✓
              </div>
            </div>
            
            <h3 className="text-xl md:text-2xl font-light text-center text-black/80 dark:text-white/80 mb-2">
              Изменения сохранены
            </h3>
            
            <p className="text-sm md:text-base text-center text-black/50 dark:text-white/50 mb-6 md:mb-8">
              Документ успешно обновлен
            </p>
            
            <button
              onClick={handleCloseSaveModal}
              className="w-full px-4 md:px-6 py-3 md:py-4 bg-black/90 dark:bg-white/90 text-white dark:text-black rounded-lg md:rounded-xl text-sm md:text-base font-medium hover:bg-black dark:hover:bg-white transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              <span>Вернуться к аналитике</span>
              <span className="text-base md:text-lg group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>
      )}

      {/* Модальное окно создания файла */}
      <CreateFileModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateFile}
        currentFolder={currentFolder}
      />

      {/* Модальное окно удаления папки */}
      <DeleteFolderModal
        isOpen={!!folderToDelete}
        folderName={folderToDelete?.split('/').pop() || ''}
        folderPath={folderToDelete || ''}
        onClose={() => {
          setFolderToDelete(null);
          setFolderInfo(null);
        }}
        onConfirm={handleConfirmDeleteFolder}
        isDeleting={isDeletingFolder}
        folderInfo={folderInfo}
      />

      {/* Подсказка о горячих клавишах (только для сохранения) */}
      {selected && (
        <div className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-40 px-3 md:px-4 py-1.5 md:py-2 bg-black/80 dark:bg-white/80 text-white dark:text-black rounded-full text-xs md:text-sm shadow-lg backdrop-blur-sm">
          <span className="flex items-center gap-1 md:gap-2">
            <span className="px-1 py-0.5 bg-white/20 dark:bg-black/20 rounded text-[8px] md:text-xs">⌘S</span>
            <span>Сохранить</span>
          </span>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        .animate-slideUp {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { FolderNavigation } from "@/components/admin/folder-navigation";
import { MediaManager } from "@/components/admin/media-manager";
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
  const [showTemplates, setShowTemplates] = useState(false);
  const [showMediaManager, setShowMediaManager] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalDocs: 0,
    totalFolders: 0,
    recentDocs: [],
    docsByFolder: [],
    activityLastWeek: [],
  });

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

  // Проверка мобильного устройства
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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
      const response = await fetch("/api/docs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: selected.split('/').pop(),
          title,
          description,
          content,
          folder: currentFolder,
        }),
      });
      
      if (!response.ok) throw new Error();
      
      await loadDocs();
      
    } catch (error) {
      alert("Ошибка при сохранении");
    } finally {
      setIsSaving(false);
    }
  };

  // Создание нового файла
  const createNew = () => {
    const fileNameInput = prompt("Введите имя файла (например: new-page.mdx)");
    if (!fileNameInput) return;
    
    const filename = fileNameInput.includes('.') ? fileNameInput : `${fileNameInput}.mdx`;
    const fullPath = currentFolder ? `${currentFolder}/${filename}` : filename;
    
    setSelected(fullPath);
    setTitle("Новая страница");
    setDescription("Описание страницы");
    setContent(`# Заголовок документа\n\nНачните писать здесь...`);
    setIsSidebarOpen(false);
    setShowTemplates(false);
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
  const deleteFolder = async (folder: string) => {
    try {
      const fullPath = currentFolder ? `${currentFolder}/${folder}` : folder;
      
      const response = await fetch(`/api/docs/folder?folder=${encodeURIComponent(fullPath)}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Ошибка удаления папки");
        return;
      }
      
      await loadDocs();
    } catch (error) {
      console.error("Ошибка удаления папки:", error);
      alert("Не удалось удалить папку");
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
      `}>
        {/* Хедер сайдбара */}
        <div className="p-6 border-b border-black/10 dark:border-white/10">
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
          <div className="p-6">
            <FolderNavigation
              folders={paginatedFolders}
              currentFolder={currentFolder}
              breadcrumbs={breadcrumbs}
              onFolderClick={handleFolderClick}
              onCreateFolder={createFolder}
              onDeleteFolder={deleteFolder}
              onMoveToParent={handleMoveToParent}
            />
            
            <Pagination
              current={foldersPage}
              total={totalFolderPages}
              onPageChange={setFoldersPage}
            />
          </div>

          {/* Поиск */}
          <div className="px-6 pb-4">
            <input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-black/5 dark:bg-white/5 border border-transparent focus:border-black/20 dark:focus:border-white/20 rounded-lg text-sm transition-colors placeholder:text-black/30 dark:placeholder:text-white/30"
            />
          </div>

          {/* Список документов */}
          <div className="px-6 pb-6">
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
        <div className="p-6 border-t border-black/10 dark:border-white/10">
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
      <div className="flex-1 overflow-y-auto">
        {/* Мобильная шапка */}
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

        {/* Контент */}
        <div className="p-6 md:p-8 lg:p-10">
          {selected ? (
            // Режим редактирования
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h1 className="text-2xl font-light text-black/80 dark:text-white/80 mb-1">
                  Редактирование
                </h1>
                <p className="text-sm text-black/40 dark:text-white/40">
                  {selected}
                </p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Заголовок"
                  className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-transparent focus:border-black/20 dark:focus:border-white/20 rounded-lg text-lg transition-colors placeholder:text-black/30 dark:placeholder:text-white/30"
                />

                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Описание"
                  className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-transparent focus:border-black/20 dark:focus:border-white/20 rounded-lg transition-colors placeholder:text-black/30 dark:placeholder:text-white/30"
                />

                {/* Редактор */}
                <div className="border border-black/10 dark:border-white/10 rounded-lg overflow-hidden">
                  <MarkdownEditor
                    value={content}
                    onChange={({ text }) => setContent(text)}
                    renderHTML={(text) => mdParser.render(text)}
                    style={{ height: isMobile ? 400 : 550 }}
                  />
                </div>

                {/* Кнопки действий */}
                <div className="flex flex-wrap gap-3 pt-4">
                  {/* Кнопка медиа */}
                  <button
                    onClick={() => setShowMediaManager(true)}
                    className="px-6 py-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg font-medium transition-colors flex items-center gap-2 group"
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform">🖼️</span>
                    <span>Медиа</span>
                  </button>

                  {/* Кнопка сохранения */}
                  <button
                    onClick={saveFile}
                    disabled={isSaving}
                    className="px-6 py-3 bg-black/90 dark:bg-white/90 text-white dark:text-black rounded-lg font-medium hover:bg-black dark:hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2 group"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
                        <span>Сохранение...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-lg group-hover:scale-110 transition-transform">💾</span>
                        <span>Сохранить</span>
                      </>
                    )}
                  </button>
                  
                  {/* Кнопка отмены */}
                  <button
                    onClick={() => {
                      setSelected("");
                      setTitle("");
                      setDescription("");
                      setContent("");
                    }}
                    className="px-6 py-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg font-medium transition-colors flex items-center gap-2 group"
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform">✕</span>
                    <span>Отмена</span>
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
            <div className="max-w-6xl mx-auto space-y-12">
              {/* Аналитика - сверху */}
              <div className="space-y-8">
                <h2 className="text-xl font-light text-black/80 dark:text-white/80">
                  Статистика
                </h2>
                
                {/* Основные показатели */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-black/5 dark:bg-white/5 rounded-lg">
                    <p className="text-xs text-black/40 dark:text-white/40 mb-1">
                      Всего документов
                    </p>
                    <p className="text-3xl font-light text-black/80 dark:text-white/80">
                      {analytics.totalDocs}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-black/5 dark:bg-white/5 rounded-lg">
                    <p className="text-xs text-black/40 dark:text-white/40 mb-1">
                      Папок
                    </p>
                    <p className="text-3xl font-light text-black/80 dark:text-white/80">
                      {analytics.totalFolders}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-black/5 dark:bg-white/5 rounded-lg">
                    <p className="text-xs text-black/40 dark:text-white/40 mb-1">
                      В корне
                    </p>
                    <p className="text-3xl font-light text-black/80 dark:text-white/80">
                      {files.filter(f => !f.folder).length}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-black/5 dark:bg-white/5 rounded-lg">
                    <p className="text-xs text-black/40 dark:text-white/40 mb-1">
                      В папках
                    </p>
                    <p className="text-3xl font-light text-black/80 dark:text-white/80">
                      {files.filter(f => f.folder).length}
                    </p>
                  </div>
                </div>

                {/* Активность за неделю */}
                <div>
                  <h3 className="text-sm font-medium text-black/60 dark:text-white/60 mb-4">
                    Активность за неделю
                  </h3>
                  <div className="flex items-end justify-between gap-2 h-32">
                    {analytics.activityLastWeek.map((day, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-black/5 dark:bg-white/5 rounded-t relative h-24">
                          <div 
                            className="absolute bottom-0 left-0 right-0 bg-black/30 dark:bg-white/30 rounded-t transition-all duration-500"
                            style={{ height: `${Math.min(100, day.count * 20)}%` }}
                          />
                        </div>
                        <span className="text-xs text-black/40 dark:text-white/40">
                          {formatDate(day.date)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Документы по папкам */}
                {analytics.docsByFolder.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-black/60 dark:text-white/60 mb-4">
                      Документы по папкам
                    </h3>
                    <div className="space-y-2">
                      {analytics.docsByFolder.map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs text-black/40 dark:text-white/40 w-24 truncate">
                            {item.folder === 'root' ? 'Корень' : item.folder}
                          </span>
                          <div className="flex-1 h-6 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
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
                    <h3 className="text-sm font-medium text-black/60 dark:text-white/60 mb-4">
                      Последние изменения
                    </h3>
                    <div className="space-y-2">
                      {analytics.recentDocs.map((doc, i) => (
                        <button
                          key={i}
                          onClick={() => loadFile(doc.path)}
                          className="w-full flex items-center justify-between p-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-black/40 dark:text-white/40">📄</span>
                            <div className="text-left">
                              <p className="text-sm text-black/80 dark:text-white/80">
                                {doc.title}
                              </p>
                              <p className="text-xs text-black/40 dark:text-white/40">
                                {doc.folder || 'Корень'}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-black/30 dark:text-white/30 group-hover:text-black/50 dark:group-hover:text-white/50">
                            {doc.lastModified}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Быстрые шаблоны - снизу с разделителем */}
              <div className="hidden md:block pt-8 border-t border-black/10 dark:border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-light text-black/80 dark:text-white/80">
                    Быстрые шаблоны
                  </h2>
                  <button
                    onClick={() => setShowTemplates(true)}
                    className="text-sm text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1"
                  >
                    <span>Все шаблоны</span>
                    <span>→</span>
                  </button>
                </div>

                {/* Сетка шаблонов */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                    className="group relative p-6 bg-white dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-2xl hover:border-black/30 dark:hover:border-white/30 transition-all duration-300 text-left hover:shadow-lg hover:-translate-y-1"
                  >
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-black/40 dark:text-white/40">использовать →</span>
                    </div>
                    <div className="text-3xl mb-3">📡</div>
                    <h3 className="text-base font-medium text-black/80 dark:text-white/80 mb-1">
                      API Документация
                    </h3>
                    <p className="text-xs text-black/40 dark:text-white/40">
                      Шаблон для описания API эндпоинтов
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      <span className="px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded-full text-[10px] text-black/60 dark:text-white/60">
                        REST API
                      </span>
                      <span className="px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded-full text-[10px] text-black/60 dark:text-white/60">
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
                    className="group relative p-6 bg-white dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-2xl hover:border-black/30 dark:hover:border-white/30 transition-all duration-300 text-left hover:shadow-lg hover:-translate-y-1"
                  >
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-black/40 dark:text-white/40">использовать →</span>
                    </div>
                    <div className="text-3xl mb-3">📖</div>
                    <h3 className="text-base font-medium text-black/80 dark:text-white/80 mb-1">
                      Руководство
                    </h3>
                    <p className="text-xs text-black/40 dark:text-white/40">
                      Пошаговое руководство пользователя
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      <span className="px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded-full text-[10px] text-black/60 dark:text-white/60">
                        инструкция
                      </span>
                      <span className="px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded-full text-[10px] text-black/60 dark:text-white/60">
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
                    className="group relative p-6 bg-white dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-2xl hover:border-black/30 dark:hover:border-white/30 transition-all duration-300 text-left hover:shadow-lg hover:-translate-y-1"
                  >
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-black/40 dark:text-white/40">использовать →</span>
                    </div>
                    <div className="text-3xl mb-3">📝</div>
                    <h3 className="text-base font-medium text-black/80 dark:text-white/80 mb-1">
                      README
                    </h3>
                    <p className="text-xs text-black/40 dark:text-white/40">
                      Описание проекта для GitHub
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      <span className="px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded-full text-[10px] text-black/60 dark:text-white/60">
                        установка
                      </span>
                      <span className="px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded-full text-[10px] text-black/60 dark:text-white/60">
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
                    className="group relative p-6 bg-white dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-2xl hover:border-black/30 dark:hover:border-white/30 transition-all duration-300 text-left hover:shadow-lg hover:-translate-y-1"
                  >
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-black/40 dark:text-white/40">использовать →</span>
                    </div>
                    <div className="text-3xl mb-3">📋</div>
                    <h3 className="text-base font-medium text-black/80 dark:text-white/80 mb-1">
                      Changelog
                    </h3>
                    <p className="text-xs text-black/40 dark:text-white/40">
                      История версий и изменений
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      <span className="px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded-full text-[10px] text-black/60 dark:text-white/60">
                        версии
                      </span>
                      <span className="px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded-full text-[10px] text-black/60 dark:text-white/60">
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

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s cubic-bezier(0.2, 0, 0, 1) forwards;
        }
      `}</style>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";

interface CreateFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (filename: string, template: string) => void;
  currentFolder: string;
}

const templates = [
  { 
    id: 'empty', 
    name: 'Пустой документ', 
    icon: '📄', 
    description: 'Начните с чистого листа',
    content: '# Заголовок\n\nНачните писать здесь...'
  },
  { 
    id: 'api', 
    name: 'API Документация', 
    icon: '📡', 
    description: 'Шаблон для описания API',
    content: `# API Документация

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
`
  },
  { 
    id: 'guide', 
    name: 'Руководство', 
    icon: '📖', 
    description: 'Пошаговое руководство',
    content: `# Руководство пользователя

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
`
  },
  { 
    id: 'readme', 
    name: 'README', 
    icon: '📝', 
    description: 'Описание проекта для GitHub',
    content: `# Название проекта

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
`
  },
  { 
    id: 'changelog', 
    name: 'Changelog', 
    icon: '📋', 
    description: 'История изменений',
    content: `# Changelog

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
`
  },
  { 
    id: 'component', 
    name: 'React компонент', 
    icon: '⚛️', 
    description: 'Документация компонента',
    content: `# ComponentName

## Описание
Краткое описание компонента и его назначения.

## Props

| Prop | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| \`children\` | \`ReactNode\` | - | Содержимое компонента |
| \`className\` | \`string\` | \`''\` | Дополнительные CSS классы |
| \`onClick\` | \`() => void\` | - | Обработчик клика |

## Примеры использования

### Базовый пример

\`\`\`tsx
import { ComponentName } from '@/components/ComponentName';

function App() {
  return (
    <ComponentName>
      <p>Содержимое</p>
    </ComponentName>
  );
}
\`\`\`

### С дополнительными классами

\`\`\`tsx
<ComponentName className="mt-4 p-2 bg-gray-100">
  Стилизованный контент
</ComponentName>
\`\`\`

## Примечания

- Важное замечание 1
- Важное замечание 2

## Связанные компоненты

- [Другой компонент](/docs/other-component)
`
  },
  { 
    id: 'tutorial', 
    name: 'Туториал', 
    icon: '🎓', 
    description: 'Пошаговое обучение',
    content: `# Название туториала

## Введение
Что будет изучено в этом туториале и какие навыки получит пользователь.

## Предварительные требования
- Знание JavaScript
- Установленный Node.js
- Базовое понимание React

## Шаг 1: Настройка окружения

\`\`\`bash
# Создание проекта
npm create vite@latest my-app -- --template react

# Переход в папку
cd my-app

# Установка зависимостей
npm install
\`\`\`

## Шаг 2: Создание первого компонента

\`\`\`tsx
// src/components/MyComponent.tsx
export function MyComponent() {
  return (
    <div>
      <h1>Мой компонент</h1>
      <p>Привет, мир!</p>
    </div>
  );
}
\`\`\`

## Шаг 3: Добавление стилей

\`\`\`css
.my-component {
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}
\`\`\`

## Шаг 4: Интеграция с приложением

\`\`\`tsx
// src/App.tsx
import { MyComponent } from './components/MyComponent';

function App() {
  return (
    <div className="app">
      <MyComponent />
    </div>
  );
}
\`\`\`

## Результат
Описание того, что получилось в итоге.

## Дальнейшие шаги
- Ссылки на следующие туториалы
- Дополнительные ресурсы
- Рекомендации
`
  },
];

export function CreateFileModal({ isOpen, onClose, onCreate, currentFolder }: CreateFileModalProps) {
  const [filename, setFilename] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const [error, setError] = useState("");

  // Сброс состояния при открытии
  useEffect(() => {
    if (isOpen) {
      setFilename("");
      setSelectedTemplate(templates[0]);
      setError("");
    }
  }, [isOpen]);

  // Обработка клавиш
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleCreate();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filename, selectedTemplate]);

  const handleCreate = () => {
    if (!filename.trim()) {
      setError("Введите имя файла");
      return;
    }

    // Разрешаем буквы, цифры, дефисы, подчеркивания и слеши для путей
    // Также разрешаем точки для расширения файла
    const validFilename = /^[a-zA-Z0-9\-\_\/\.]+$/.test(filename);
    if (!validFilename) {
      setError("Имя файла может содержать только буквы, цифры, дефисы, подчеркивания и слеши для папок");
      return;
    }

    // Проверка на последовательные слеши
    if (filename.includes('//')) {
      setError("Имя файла не может содержать последовательные слеши");
      return;
    }

    // Проверка на слеш в начале или конце
    if (filename.startsWith('/') || filename.endsWith('/')) {
      setError("Имя файла не может начинаться или заканчиваться слешем");
      return;
    }

    // Проверка на допустимое расширение
    const hasValidExtension = filename.endsWith('.mdx') || filename.endsWith('.md') || !filename.includes('.');
    if (!hasValidExtension) {
      setError("Допустимые расширения: .mdx или .md");
      return;
    }

    // Добавляем расширение .mdx если его нет
    let finalFilename = filename;
    if (!finalFilename.endsWith('.mdx') && !finalFilename.endsWith('.md')) {
      finalFilename += '.mdx';
    }

    onCreate(finalFilename, selectedTemplate.content);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Затемненный фон */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Модальное окно */}
      <div className="relative bg-white dark:bg-black rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-black/10 dark:border-white/10 animate-slideUp">
        
        {/* Заголовок */}
        <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black/5 dark:bg-white/5 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📄</span>
            </div>
            <div>
              <h2 className="text-lg font-light text-black/80 dark:text-white/80">
                Создание документа
              </h2>
              <p className="text-sm text-black/40 dark:text-white/40">
                {currentFolder ? `Папка: ${currentFolder}` : 'Корневая папка'}
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

        {/* Основное содержимое */}
        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          
          {/* Имя файла */}
          <div className="mb-6">
            <label className="block text-xs text-black/40 dark:text-white/40 mb-2">
              Имя файла
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => {
                setFilename(e.target.value);
                setError("");
              }}
              placeholder="например: getting-started/installation.mdx"
              className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-transparent focus:border-black/20 dark:focus:border-white/20 rounded-xl text-sm transition-colors placeholder:text-black/30 dark:placeholder:text-white/30"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
            <p className="mt-2 text-xs text-black/40 dark:text-white/40">
              Можно указать путь с вложенными папками: "getting-started/installation.mdx"
            </p>
          </div>

          {/* Выбор шаблона */}
          <div>
            <label className="block text-xs text-black/40 dark:text-white/40 mb-3">
              Выберите шаблон
            </label>
            <div className="grid grid-cols-2 gap-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedTemplate.id === template.id
                      ? 'border-black/30 dark:border-white/30 bg-black/5 dark:bg-white/5'
                      : 'border-transparent hover:border-black/20 dark:hover:border-white/20 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="text-2xl mb-2">{template.icon}</div>
                  <h3 className="text-sm font-medium text-black/80 dark:text-white/80 mb-1">
                    {template.name}
                  </h3>
                  <p className="text-xs text-black/40 dark:text-white/40">
                    {template.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Предпросмотр содержимого */}
          <div className="mt-6">
            <label className="block text-xs text-black/40 dark:text-white/40 mb-2">
              Предпросмотр содержимого
            </label>
            <div className="p-4 bg-black/5 dark:bg-white/5 rounded-xl">
              <pre className="text-xs font-mono whitespace-pre-wrap max-h-32 overflow-y-auto text-black/60 dark:text-white/60">
                {selectedTemplate.content.substring(0, 200)}...
              </pre>
            </div>
          </div>
        </div>

        {/* Действия */}
        <div className="px-6 py-4 border-t border-black/10 dark:border-white/10 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleCreate}
            className="px-6 py-2 bg-black/90 dark:bg-white/90 text-white dark:text-black rounded-lg text-sm font-medium hover:bg-black dark:hover:bg-white transition-colors flex items-center gap-2"
          >
            <span>Создать</span>
            <span className="text-xs opacity-60">⌘⏎</span>
          </button>
        </div>
      </div>

      <style jsx>{`
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
        .animate-slideUp {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
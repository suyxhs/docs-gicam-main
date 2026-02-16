"use client";

import { useState, useEffect } from "react";

interface Command {
  id: string;
  name: string;
  description: string;
  icon: string;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  onClose: () => void;
}

export function CommandPalette({ onClose }: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: Command[] = [
    {
      id: 'new-doc',
      name: 'Новый документ',
      description: 'Создать новый MDX документ',
      icon: '📄',
      shortcut: '⌘N',
      action: () => {
        const name = prompt('Введите имя файла:');
        if (name) console.log('Create doc:', name);
        onClose();
      }
    },
    {
      id: 'new-folder',
      name: 'Новая папка',
      description: 'Создать новую папку',
      icon: '📁',
      shortcut: '⌘⇧N',
      action: () => {
        const name = prompt('Введите имя папки:');
        if (name) console.log('Create folder:', name);
        onClose();
      }
    },
    {
      id: 'upload-media',
      name: 'Загрузить медиа',
      description: 'Загрузить изображение или видео',
      icon: '🖼️',
      shortcut: '⌘U',
      action: () => {
        console.log('Open media upload');
        onClose();
      }
    },
    {
      id: 'stats',
      name: 'Статистика',
      description: 'Просмотр статистики использования',
      icon: '📊',
      shortcut: '⌘S',
      action: () => {
        console.log('Open stats');
        onClose();
      }
    },
    {
      id: 'search',
      name: 'Поиск документов',
      description: 'Поиск по всем документам',
      icon: '🔍',
      shortcut: '⌘P',
      action: () => {
        console.log('Open search');
        onClose();
      }
    },
    {
      id: 'settings',
      name: 'Настройки',
      description: 'Настройки администратора',
      icon: '⚙️',
      shortcut: '⌘,',
      action: () => {
        console.log('Open settings');
        onClose();
      }
    },
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.name.toLowerCase().includes(search.toLowerCase()) ||
    cmd.description.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredCommands, selectedIndex, onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-[20vh] z-50 p-4">
      <div className="bg-white dark:bg-black rounded-2xl border border-black/10 dark:border-white/10 w-full max-w-2xl shadow-2xl animate-slideDown">
        
        {/* Поиск */}
        <div className="flex items-center gap-3 p-4 border-b border-black/10 dark:border-white/10">
          <span className="text-xl text-black/40 dark:text-white/40">🔍</span>
          <input
            type="text"
            placeholder="Введите команду или поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-black/80 dark:text-white/80 placeholder:text-black/40 dark:placeholder:text-white/40"
            autoFocus
          />
          <span className="text-xs text-black/40 dark:text-white/40">ESC</span>
        </div>

        {/* Список команд */}
        <div className="max-h-96 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-black/40 dark:text-white/40">
              Команды не найдены
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                    index === selectedIndex
                      ? 'bg-black/10 dark:bg-white/10'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="text-2xl">{cmd.icon}</span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-black/80 dark:text-white/80">
                      {cmd.name}
                    </p>
                    <p className="text-xs text-black/40 dark:text-white/40">
                      {cmd.description}
                    </p>
                  </div>
                  {cmd.shortcut && (
                    <span className="text-xs text-black/40 dark:text-white/40 bg-black/5 dark:bg-white/5 px-2 py-1 rounded">
                      {cmd.shortcut}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Подсказка */}
        <div className="px-4 py-3 border-t border-black/10 dark:border-white/10">
          <p className="text-xs text-center text-black/40 dark:text-white/40">
            ↑↓ для навигации • Enter для выбора • ESC для закрытия
          </p>
        </div>
      </div>
    </div>
  );
}
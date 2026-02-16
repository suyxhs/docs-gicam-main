export type DocItem = {
  filename: string;
  title: string;
  description: string;
  lastModified?: string;
  path: string; // полный путь относительно content/docs
  folder: string; // папка (пустая для корня)
  folders: string[]; // массив папок для навигации
};

export type FolderItem = {
  name: string;
  path: string;
  count: number;
  folders?: FolderItem[]; // для вложенных папок
};
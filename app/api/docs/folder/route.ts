import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const docsPath = path.join(process.cwd(), "content/docs");

export async function POST(req: NextRequest) {
  try {
    const { folder } = await req.json();

    if (!folder) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }

    // Защита от path traversal
    const folderPath = path.join(docsPath, folder);
    
    if (!folderPath.startsWith(docsPath)) {
      return NextResponse.json(
        { error: "Invalid folder path" },
        { status: 400 }
      );
    }

    // Проверяем, не существует ли уже папка
    if (fs.existsSync(folderPath)) {
      return NextResponse.json(
        { error: "Folder already exists" },
        { status: 400 }
      );
    }

    // Создаем папку
    fs.mkdirSync(folderPath, { recursive: true });

    return NextResponse.json({ 
      success: true, 
      message: "Folder created successfully",
      folder 
    });
    
  } catch (error) {
    console.error("Create folder error:", error);
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 }
    );
  }
}

// Функция для рекурсивного удаления папки со всем содержимым
const deleteFolderRecursive = (folderPath: string) => {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const curPath = path.join(folderPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // Рекурсивно удаляем вложенные папки
        deleteFolderRecursive(curPath);
      } else {
        // Удаляем файлы
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(folderPath);
  }
};

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const folder = searchParams.get("folder");
    const force = searchParams.get("force") === "true"; // Параметр для принудительного удаления

    if (!folder) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }

    const folderPath = path.join(docsPath, folder);
    
    if (!folderPath.startsWith(docsPath)) {
      return NextResponse.json(
        { error: "Invalid folder path" },
        { status: 400 }
      );
    }

    // Проверяем, существует ли папка
    if (!fs.existsSync(folderPath)) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      );
    }

    // Проверяем, пуста ли папка
    const items = fs.readdirSync(folderPath);
    
    if (items.length > 0 && !force) {
      // Возвращаем информацию о содержимом
      const files = items.filter(item => {
        const itemPath = path.join(folderPath, item);
        return !fs.lstatSync(itemPath).isDirectory();
      });
      
      const subfolders = items.filter(item => {
        const itemPath = path.join(folderPath, item);
        return fs.lstatSync(itemPath).isDirectory();
      });

      return NextResponse.json(
        { 
          error: "Folder is not empty",
          isEmpty: false,
          filesCount: files.length,
          foldersCount: subfolders.length,
          totalItems: items.length
        },
        { status: 400 }
      );
    }

    // Если force=true или папка пуста, удаляем
    if (force || items.length === 0) {
      if (items.length > 0) {
        // Рекурсивное удаление
        deleteFolderRecursive(folderPath);
      } else {
        // Удаляем пустую папку
        fs.rmdirSync(folderPath);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: force && items.length > 0 
        ? "Folder and all contents deleted successfully" 
        : "Folder deleted successfully" 
    });
    
  } catch (error) {
    console.error("Delete folder error:", error);
    return NextResponse.json(
      { error: "Failed to delete folder" },
      { status: 500 }
    );
  }
}
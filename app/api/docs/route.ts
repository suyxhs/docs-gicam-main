import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const docsPath = path.join(process.cwd(), "content/docs");

// 📥 Получение списка документов с поддержкой вложенных папок
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const folder = searchParams.get("folder") || "";
    
    // Проверяем, существует ли папка
    if (!fs.existsSync(docsPath)) {
      fs.mkdirSync(docsPath, { recursive: true });
      return NextResponse.json({ files: [], folders: [] });
    }

    const currentPath = folder 
      ? path.join(docsPath, folder)
      : docsPath;

    if (!fs.existsSync(currentPath)) {
      return NextResponse.json({ 
        files: [], 
        folders: [],
        currentFolder: folder,
        breadcrumbs: folder.split('/').filter(Boolean),
      });
    }

    const items = fs.readdirSync(currentPath);
    
    const folders: string[] = [];
    const files: any[] = [];

    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        folders.push(item);
      } else if (item.endsWith(".md") || item.endsWith(".mdx")) {
        try {
          const raw = fs.readFileSync(itemPath, "utf-8");
          const { data } = matter(raw);
          
          const relativePath = folder 
            ? path.join(folder, item)
            : item;
          
          files.push({
            filename: item,
            title: data.title || item.replace(/\.(md|mdx)$/, ""),
            description: data.description || "",
            lastModified: stat.mtime.toISOString().split('T')[0],
            path: relativePath,
            folder: folder,
            folders: folder.split('/').filter(Boolean),
          });
        } catch (e) {
          console.error(`Error reading file ${itemPath}:`, e);
          // Пропускаем файлы с ошибками
        }
      }
    }

    // Сортируем папки и файлы по алфавиту
    folders.sort((a, b) => a.localeCompare(b));
    files.sort((a, b) => a.title.localeCompare(b.title));

    const breadcrumbs = folder.split('/').filter(Boolean);
    const parentFolder = breadcrumbs.slice(0, -1).join('/');

    return NextResponse.json({
      files,
      folders,
      currentFolder: folder,
      parentFolder,
      breadcrumbs,
    });
    
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { error: "Failed to read documents" },
      { status: 500 }
    );
  }
}

// 💾 Создание / обновление документа (уже должно работать)
export async function POST(req: Request) {
  try {
    const { filename, title, description, content, folder = "" } = await req.json();

    if (!filename) {
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 }
      );
    }

    // Защита от path traversal
    const safeFilename = path.basename(filename);
    
    const targetDir = folder 
      ? path.join(docsPath, folder)
      : docsPath;
    
    const filePath = path.join(targetDir, safeFilename);

    if (!filePath.startsWith(docsPath)) {
      return NextResponse.json(
        { error: "Invalid file path" },
        { status: 400 }
      );
    }

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const fullContent = `---
title: "${title || "Без названия"}"
description: "${description || ""}"
---

${content || ""}
`;

    fs.writeFileSync(filePath, fullContent, "utf-8");

    const relativePath = folder ? path.join(folder, safeFilename) : safeFilename;

    return NextResponse.json({ 
      success: true, 
      message: "File saved successfully",
      filename: safeFilename,
      path: relativePath,
    });
    
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json(
      { error: "Failed to save file" },
      { status: 500 }
    );
  }
}

// 🗑️ Удаление документа
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filepath = searchParams.get("path");

    if (!filepath) {
      return NextResponse.json(
        { error: "File path is required" },
        { status: 400 }
      );
    }

    const safePath = filepath.replace(/\.\.\//g, '');
    const filePath = path.join(docsPath, safePath);
    
    if (!filePath.startsWith(docsPath)) {
      return NextResponse.json(
        { error: "Invalid file path" },
        { status: 400 }
      );
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    fs.unlinkSync(filePath);

    return NextResponse.json({ 
      success: true, 
      message: `File deleted successfully`,
    });
    
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
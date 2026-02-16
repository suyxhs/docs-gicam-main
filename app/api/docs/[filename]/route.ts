import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const docsPath = path.join(process.cwd(), "content/docs");

// 📥 ПОЛУЧЕНИЕ КОНКРЕТНОГО ДОКУМЕНТА (с поддержкой вложенных папок)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    // Получаем filename из params
    const { filename } = await params;
    
    // Декодируем filename (он может содержать слеши для вложенных папок)
    const decodedPath = decodeURIComponent(filename);
    
    // Защита от path traversal
    // Убираем любые попытки выйти за пределы docsPath
    const safePath = decodedPath.replace(/\.\.\//g, '');
    
    // Формируем полный путь к файлу
    const filePath = path.join(docsPath, safePath);

    // Проверяем, что файл находится внутри docsPath
    if (!filePath.startsWith(docsPath)) {
      return NextResponse.json(
        { error: "Invalid file path" },
        { status: 400 }
      );
    }

    // Проверяем, существует ли файл
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Проверяем, что это файл (не папка)
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      return NextResponse.json(
        { error: "Path is a directory" },
        { status: 400 }
      );
    }

    // Читаем и парсим файл
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);

    // Получаем относительный путь для folder
    const relativePath = path.relative(docsPath, filePath);
    const folder = path.dirname(relativePath);
    const filename_only = path.basename(relativePath);

    return NextResponse.json({
      filename: filename_only,
      title: data.title || "",
      description: data.description || "",
      content: content || "",
      lastModified: stat.mtime.toISOString().split('T')[0],
      path: relativePath,
      folder: folder === '.' ? '' : folder,
    });
    
  } catch (error) {
    console.error("GET specific file error:", error);
    return NextResponse.json(
      { error: "Failed to read file" },
      { status: 500 }
    );
  }
}

// 🗑️ УДАЛЕНИЕ КОНКРЕТНОГО ДОКУМЕНТА (с поддержкой вложенных папок)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    const decodedPath = decodeURIComponent(filename);
    const safePath = decodedPath.replace(/\.\.\//g, '');
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

    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      return NextResponse.json(
        { error: "Cannot delete directory with this endpoint" },
        { status: 400 }
      );
    }

    if (!filePath.endsWith(".md") && !filePath.endsWith(".mdx")) {
      return NextResponse.json(
        { error: "Can only delete .md or .mdx files" },
        { status: 400 }
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
      { error: error instanceof Error ? error.message : "Failed to delete file" },
      { status: 500 }
    );
  }
}
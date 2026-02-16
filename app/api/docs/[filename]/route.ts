import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const docsPath = path.join(process.cwd(), "content/docs");

// 📥 ПОЛУЧЕНИЕ КОНКРЕТНОГО ДОКУМЕНТА
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }  // Вот здесь добавили Promise
) {
  try {
    const { filename } = await params;  // И здесь добавили await
    
    // Декодируем filename (он может содержать спецсимволы)
    const decodedFilename = decodeURIComponent(filename);
    
    // Защита от path traversal
    const safeFilename = path.basename(decodedFilename);
    const filePath = path.join(docsPath, safeFilename);

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

    // Читаем и парсим файл
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);

    return NextResponse.json({
      filename: safeFilename,
      title: data.title || "",
      description: data.description || "",
      content: content || "",
      lastModified: fs.statSync(filePath).mtime.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error("GET specific file error:", error);
    return NextResponse.json(
      { error: "Failed to read file" },
      { status: 500 }
    );
  }
}

// 🗑️ УДАЛЕНИЕ КОНКРЕТНОГО ДОКУМЕНТА
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    // В Next.js 15 params нужно ожидать с await
    const { filename } = await params;
    
    // Декодируем filename
    const decodedFilename = decodeURIComponent(filename);
    
    // Защита от path traversal
    const safeFilename = path.basename(decodedFilename);
    const filePath = path.join(docsPath, safeFilename);

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

    // Проверяем расширение файла
    if (!filePath.endsWith(".md") && !filePath.endsWith(".mdx")) {
      return NextResponse.json(
        { error: "Can only delete .md or .mdx files" },
        { status: 400 }
      );
    }

    // Удаляем файл
    fs.unlinkSync(filePath);

    return NextResponse.json({ 
      success: true, 
      message: `File ${safeFilename} deleted successfully`,
      filename: safeFilename 
    });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete file" },
      { status: 500 }
    );
  }
}
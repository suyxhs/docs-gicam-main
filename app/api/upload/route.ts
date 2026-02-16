import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string || "files";

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Определяем тип файла и целевую папку
    const fileType = file.type;
    let targetFolder = folder;

    // Автоматическое определение папки по типу файла
    if (folder === "auto") {
      if (fileType.startsWith("image/")) {
        if (fileType === "image/gif") {
          targetFolder = "gifs";
        } else {
          targetFolder = "images";
        }
      } else if (fileType.startsWith("video/")) {
        targetFolder = "videos";
      } else {
        targetFolder = "files";
      }
    }

    // Создаем безопасное имя файла
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}-${originalName}`;
    
    // Путь для сохранения
    const uploadDir = path.join(process.cwd(), "public", targetFolder);
    const filePath = path.join(uploadDir, fileName);

    // Создаем папку если её нет
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Сохраняем файл
    await writeFile(filePath, buffer);

    // Возвращаем URL для вставки в MDX
    const fileUrl = `/${targetFolder}/${fileName}`;

    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileName,
      folder: targetFolder,
      type: fileType,
      size: file.size,
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const folder = searchParams.get("folder") || "";
    
    const targetDir = path.join(process.cwd(), "public", folder);
    
    if (!existsSync(targetDir)) {
      return NextResponse.json({ files: [] });
    }

    const fs = require("fs");
    const files = fs.readdirSync(targetDir);
    
    const mediaFiles = files
      .filter((file: string) => !file.startsWith('.'))
      .map((file: string) => {
        const filePath = path.join(targetDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          url: `/${folder}/${file}`,
          size: stats.size,
          modified: stats.mtime,
          type: path.extname(file).toLowerCase(),
        };
      })
      .sort((a: any, b: any) => b.modified - a.modified);

    return NextResponse.json({ files: mediaFiles });
    
  } catch (error) {
    console.error("List files error:", error);
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filepath = searchParams.get("path");
    
    if (!filepath) {
      return NextResponse.json(
        { error: "File path required" },
        { status: 400 }
      );
    }

    const fs = require("fs");
    const fullPath = path.join(process.cwd(), "public", filepath);
    
    if (!existsSync(fullPath)) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    fs.unlinkSync(fullPath);

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
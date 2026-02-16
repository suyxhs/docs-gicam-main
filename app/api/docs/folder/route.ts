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

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const folder = searchParams.get("folder");

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
    if (items.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete non-empty folder" },
        { status: 400 }
      );
    }

    // Удаляем папку
    fs.rmdirSync(folderPath);

    return NextResponse.json({ 
      success: true, 
      message: "Folder deleted successfully" 
    });
    
  } catch (error) {
    console.error("Delete folder error:", error);
    return NextResponse.json(
      { error: "Failed to delete folder" },
      { status: 500 }
    );
  }
}
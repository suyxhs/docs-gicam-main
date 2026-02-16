import { NextResponse } from "next/server";

const PASSWORD = "admin123"; // поменяй на свой

export async function POST(req: Request) {
  const { password } = await req.json();

  if (password === PASSWORD) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false }, { status: 401 });
}

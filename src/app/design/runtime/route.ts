import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";

const runtimeFile = "D:\\SuperCampus(Web)\\Super Campus student dashboard\\support.js";

export const dynamic = "force-dynamic";

export async function GET() {
  const runtime = await readFile(runtimeFile, "utf8");
  return new NextResponse(runtime, {
    headers: { "Content-Type": "application/javascript; charset=utf-8" },
  });
}

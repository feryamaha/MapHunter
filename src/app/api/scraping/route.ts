import { NextRequest, NextResponse } from "next/server";
import { runScraping } from "@/lib/scraping-engine";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location, radius, niche } = body;

    if (!location || !radius) {
      return NextResponse.json(
        { error: "location e radius são obrigatórios" },
        { status: 400 },
      );
    }

    const result = await runScraping({ location, radius, niche });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/scraping] Error:", error);
    const message =
      error instanceof Error ? error.message : "Erro ao executar scraping";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { runScraping } from "@/lib/scraping-engine";
import { searchParamsSchema } from "@/schema/search-params.schema";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

// Mesma proteção da rota /api/leads: esta rota também dispara chamadas às
// APIs externas gratuitas (Overpass/Geoapify), então precisa de rate limit e
// validação estrita — sem isso vira vetor de abuso e de injeção nos providers.
const RATE_LIMIT = 8;
const RATE_WINDOW_MS = 60_000;

export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(
      `scraping:${clientKey(request)}`,
      RATE_LIMIT,
      RATE_WINDOW_MS,
    );
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Muitas buscas em pouco tempo. Aguarde um instante." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = searchParamsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Parâmetros inválidos" },
        { status: 400 },
      );
    }

    const result = await runScraping(parsed.data);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/scraping] Error:", error);
    const message =
      error instanceof Error ? error.message : "Erro ao executar scraping";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

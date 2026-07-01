import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { enrichWithCnpj } from "@/lib/cnpj-enrichment";
import { rateLimit, clientKey } from "@/lib/rate-limit";

const SAFE_TEXT = /^[\p{L}\p{N}\s.,\-/&º°ª#()]+$/u;

const cnpjBodySchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(2, "companyName é obrigatório")
    .max(120, "companyName muito longo")
    .regex(SAFE_TEXT, "companyName contém caracteres inválidos"),
  address: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).regex(SAFE_TEXT).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(`cnpj:${clientKey(request)}`, 20, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Muitas consultas em pouco tempo. Aguarde." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = cnpjBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Parâmetros inválidos" },
        { status: 400 },
      );
    }

    const cnpjData = await enrichWithCnpj(parsed.data);
    return NextResponse.json(cnpjData);
  } catch (error) {
    console.error("[api/cnpj] Error:", error);
    return NextResponse.json(
      { error: "Erro ao consultar CNPJ" },
      { status: 500 },
    );
  }
}

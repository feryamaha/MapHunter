import { NextRequest, NextResponse } from "next/server";
import { runScraping } from "@/lib/scraping-engine";
import { resolveCepCity } from "@/lib/free-places-search";
import { enrichWithCnpj } from "@/lib/cnpj-enrichment";
import { qualifyLead } from "@/lib/lead-qualifier";
import { applyClassification } from "@/lib/lead-classifier";
import { searchParamsSchema } from "@/schema/search-params.schema";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import type { Lead, RawLead } from "@/types/dashboard-layout/lead.types";

export const runtime = "nodejs";
export const maxDuration = 60;

// Limite de requisições paralelas ao enriquecer via BrasilAPI/casadosdados.
// Evita estourar rate limits das APIs gratuitas e o maxDuration da rota.
const ENRICH_CONCURRENCY = 5;

const CEP_LIKE = /^\d{5}-?\d{3}$/;

// Executa `worker` sobre `items` respeitando um limite de concorrência,
// preservando a ordem original dos resultados.
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  });

  await Promise.all(runners);
  return results;
}

// Uma busca completa dispara muitas chamadas externas — limite conservador.
const RATE_LIMIT = 8; // requisições
const RATE_WINDOW_MS = 60_000; // por minuto

export async function POST(request: NextRequest) {
  try {
    // Rate limit por IP (anti-abuso + protege crédito das APIs externas).
    const rl = rateLimit(`leads:${clientKey(request)}`, RATE_LIMIT, RATE_WINDOW_MS);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Muitas buscas em pouco tempo. Aguarde um instante." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
      );
    }

    // Validação estrita do corpo (zod) — só entra o que casa com o schema.
    const body = await request.json().catch(() => null);
    const parsed = searchParamsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Parâmetros inválidos" },
        { status: 400 },
      );
    }
    const { location, radius, niche } = parsed.data;

    // Camada 1: Busca agregada (Overpass + BizData + Geoapify)
    const scrapingResult = await runScraping({ location, radius, niche });

    // Camada 1.5: Qualificação — descarta quem não é cliente potencial (órgãos
    // públicos, grandes redes, concessionárias, TI/concorrentes, nichos fora do
    // alvo) ANTES de gastar crédito de CNPJ e antes de entrar na tabela.
    const qualifiedLeads: RawLead[] = [];
    let excludedCount = 0;
    for (const rawLead of scrapingResult.leads) {
      const { qualified, reason } = qualifyLead(rawLead);
      if (qualified) {
        qualifiedLeads.push(rawLead);
      } else {
        excludedCount++;
        console.log(`[qualify] descartado "${rawLead.name}" — ${reason}`);
      }
    }
    console.log(
      `[qualify] ${scrapingResult.leads.length} brutos → ${qualifiedLeads.length} qualificados (${excludedCount} descartados)`,
    );

    // Pistas geográficas (município/UF) para refinar a busca de CNPJ por nome.
    // Busca por CEP: resolve o município via ViaCEP/BrasilAPI — antes o CEP era
    // ignorado e a CasaDosDados pesquisava sem filtro geográfico, o que derruba
    // a taxa de match (similaridade < 0.6 com homônimos de outras cidades).
    const locationText = location.trim();
    let cityHint: string | null = null;
    let ufHint: string | null = null;
    if (CEP_LIKE.test(locationText)) {
      const resolved = await resolveCepCity(locationText);
      cityHint = resolved?.city ?? null;
      ufHint = resolved?.state ?? null;
    } else {
      cityHint = locationText;
      // "Marília - SP" / "Marília, SP" → UF como filtro adicional.
      const ufMatch = locationText.match(/[-,/]\s*([A-Za-z]{2})\s*$/);
      ufHint = ufMatch ? ufMatch[1]!.toUpperCase() : null;
    }

    // Camada 2: Enriquecimento CNPJ (BrasilAPI) + Classificação.
    // Concorrência limitada para não sobrecarregar as APIs gratuitas.
    const timestamp = Date.now();
    const enrichedLeads: Lead[] = await mapWithConcurrency(
      qualifiedLeads,
      ENRICH_CONCURRENCY,
      async (rawLead: RawLead, index: number) => {
        const cnpjData = await enrichWithCnpj({
          companyName: rawLead.name,
          address: rawLead.address,
          knownCnpj: rawLead.cnpj,
          city: cityHint,
          uf: ufHint,
        });

        const details = cnpjData.details;

        const lead: Omit<Lead, "status"> = {
          id: `lead-${index}-${timestamp}`,
          name: rawLead.name,
          phone: rawLead.phone || details?.phone || "",
          email: rawLead.email || cnpjData.email || "",
          website: rawLead.website,
          instagram: rawLead.instagram,
          cnpj: cnpjData.cnpj,
          address: rawLead.address || details?.address || "",
          category: rawLead.category,
          situation: cnpjData.situation,
          placeId: rawLead.placeId,
          cnpjDetails: details,
        };

        return applyClassification(lead);
      },
    );

    // Filtrar empresas inativas (RN03)
    const activeLeads = enrichedLeads.filter(
      (lead) => lead.status !== "Inativa/Baixada",
    );

    return NextResponse.json({
      leads: activeLeads,
      total: activeLeads.length,
      totalScraped: scrapingResult.total,
      totalQualified: qualifiedLeads.length,
      totalExcluded: excludedCount,
      sources: scrapingResult.sources,
    });
  } catch (error) {
    console.error("[api/leads] Error:", error);
    const message =
      error instanceof Error ? error.message : "Erro ao processar leads";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

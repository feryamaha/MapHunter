import type { RawLead } from "@/types/dashboard-layout/lead.types";
import { searchFreePlaces } from "@/lib/free-places-search";

export interface ScrapingParams {
  location: string;
  radius: string;
  niche?: string;
}

export interface ScrapingResult {
  leads: RawLead[];
  total: number;
  sources: string[];
}

export async function runScraping(params: ScrapingParams): Promise<ScrapingResult> {
  const { location, radius, niche } = params;

  console.log(
    `[scraping-engine] Busca agregada: "${niche ?? "empresas"}" em ${location} (raio ${radius}km)`,
  );

  const result = await searchFreePlaces({ location, radius, niche });

  return {
    leads: result.leads,
    total: result.total,
    sources: result.sources,
  };
}

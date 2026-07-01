import type {
  CnpjData,
  CnpjDetails,
  CnpjPartner,
  LeadSituation,
} from "@/types/dashboard-layout/lead.types";
import { getCachedCnpj, setCachedCnpj } from "@/lib/cnpj-cache";

export interface CnpjEnrichmentParams {
  companyName: string;
  address?: string;
  // CNPJ já conhecido (ex.: extraído de tags OSM). Se presente, pula a busca por nome.
  knownCnpj?: string | null;
  // Pistas geográficas para refinar a busca por nome (reduz falsos positivos).
  uf?: string | null;
  city?: string | null;
}

const EMPTY_CNPJ_DATA: CnpjData = {
  cnpj: null,
  email: null,
  situation: null,
  cnae: null,
  details: null,
};

// ─── Tipos compartilhados (formato Receita Federal) ──────────────────────────
// BrasilAPI e MinhaReceita retornam o mesmo formato bruto da Receita Federal.

interface ReceitaFederalCnae {
  codigo?: number;
  descricao?: string;
}

interface ReceitaFederalPartner {
  nome_socio?: string;
  qualificacao_socio?: string;
}

interface ReceitaFederalCnpjResponse {
  cnpj: string;
  razao_social?: string | null;
  nome_fantasia?: string | null;
  // Pode vir como código numérico (2=ATIVA...) e/ou descrição textual.
  situacao_cadastral?: string | number | null;
  descricao_situacao_cadastral?: string | null;
  data_situacao_cadastral?: string | null;
  data_inicio_atividade?: string | null;
  cnae_fiscal?: number | null;
  cnae_fiscal_descricao?: string | null;
  cnaes_secundarios?: ReceitaFederalCnae[] | null;
  porte?: string | null;
  descricao_porte?: string | null;
  natureza_juridica?: string | null;
  capital_social?: number | string | null;
  ddd_telefone_1?: string | null;
  ddd_telefone_2?: string | null;
  email?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  municipio?: string | null;
  uf?: string | null;
  cep?: string | null;
  qsa?: ReceitaFederalPartner[] | null;
}

// Receita Federal numeric situation codes.
const SITUATION_CODE_MAP: Record<string, LeadSituation> = {
  "1": "NULA",
  "2": "ATIVA",
  "3": "SUSPENSA",
  "4": "INAPTA",
  "8": "BAIXADA",
};

function normalizeSituation(
  situacao: string | number | null | undefined,
  descricao?: string | null,
): LeadSituation | null {
  const text = (descricao ?? "").toUpperCase().trim();
  if (text === "ATIVA") return "ATIVA";
  if (text === "BAIXADA") return "BAIXADA";
  if (text === "INAPTA") return "INAPTA";
  if (text === "SUSPENSA") return "SUSPENSA";
  if (text === "NULA") return "NULA";

  if (situacao === null || situacao === undefined) return null;
  const raw = String(situacao).trim().toUpperCase();
  if (raw === "ATIVA") return "ATIVA";
  if (raw === "BAIXADA") return "BAIXADA";
  if (raw === "INAPTA") return "INAPTA";
  if (raw === "SUSPENSA") return "SUSPENSA";
  if (raw === "NULA") return "NULA";
  return SITUATION_CODE_MAP[raw] ?? null;
}

function formatPhone(ddd?: string | null): string | null {
  const digits = (ddd ?? "").replace(/\D/g, "");
  return digits.length >= 10 ? digits : null;
}

function buildAddress(data: ReceitaFederalCnpjResponse): string | null {
  const parts = [
    data.logradouro,
    data.numero,
    data.complemento,
    data.bairro,
    data.municipio,
    data.uf,
  ].filter((p): p is string => !!p && p.trim() !== "");
  return parts.length > 0 ? parts.join(", ") : null;
}

function mapPartners(qsa?: ReceitaFederalPartner[] | null): CnpjPartner[] {
  if (!qsa) return [];
  return qsa
    .filter((s) => s.nome_socio)
    .map((s) => ({
      name: s.nome_socio!,
      qualification: s.qualificacao_socio ?? null,
    }));
}

function receitaFederalToDetails(data: ReceitaFederalCnpjResponse): CnpjDetails {
  const situation = normalizeSituation(
    data.situacao_cadastral,
    data.descricao_situacao_cadastral,
  );
  const capital =
    data.capital_social === null || data.capital_social === undefined
      ? null
      : Number(data.capital_social);

  return {
    cnpj: data.cnpj,
    razaoSocial: data.razao_social ?? null,
    nomeFantasia: data.nome_fantasia ?? null,
    situation,
    situationDate: data.data_situacao_cadastral ?? null,
    openingDate: data.data_inicio_atividade ?? null,
    cnae: data.cnae_fiscal_descricao ?? null,
    secondaryCnaes: (data.cnaes_secundarios ?? [])
      .map((c) => c.descricao ?? "")
      .filter((d) => d.trim() !== ""),
    porte: data.descricao_porte ?? data.porte ?? null,
    naturezaJuridica: data.natureza_juridica ?? null,
    capitalSocial: capital !== null && Number.isFinite(capital) ? capital : null,
    phone:
      formatPhone(data.ddd_telefone_1) ??
      formatPhone(data.ddd_telefone_2),
    email: data.email ?? null,
    address: buildAddress(data),
    cep: data.cep ?? null,
    city: data.municipio ?? null,
    state: data.uf ?? null,
    partners: mapPartners(data.qsa),
  };
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 8000,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

// ─── Provider 1: BrasilAPI (CNPJ → dados completos) ──────────────────────────

async function fetchFromBrasilApi(cleanCnpj: string): Promise<CnpjDetails | null> {
  try {
    const res = await fetchWithTimeout(
      `https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) {
      console.warn(`[cnpj] BrasilAPI HTTP ${res.status} para ${cleanCnpj}`);
      return null;
    }
    const data = (await res.json()) as ReceitaFederalCnpjResponse;
    if (!data.cnpj) return null;
    console.log(`[cnpj] BrasilAPI OK para ${cleanCnpj}`);
    return receitaFederalToDetails(data);
  } catch (err) {
    console.warn(`[cnpj] BrasilAPI falhou para ${cleanCnpj}:`, err);
    return null;
  }
}

// ─── Provider 2: MinhaReceita (CNPJ → dados completos, formato idêntico) ──────

async function fetchFromMinhaReceita(cleanCnpj: string): Promise<CnpjDetails | null> {
  try {
    const res = await fetchWithTimeout(
      `https://minhareceita.org/${cleanCnpj}`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) {
      console.warn(`[cnpj] MinhaReceita HTTP ${res.status} para ${cleanCnpj}`);
      return null;
    }
    const data = (await res.json()) as ReceitaFederalCnpjResponse;
    if (!data.cnpj) return null;
    console.log(`[cnpj] MinhaReceita OK para ${cleanCnpj}`);
    return receitaFederalToDetails(data);
  } catch (err) {
    console.warn(`[cnpj] MinhaReceita falhou para ${cleanCnpj}:`, err);
    return null;
  }
}

// ─── Orquestração: busca CNPJ → detalhes com fallback multi-provider ──────────

export async function fetchCnpjDetails(
  cnpj: string,
): Promise<CnpjDetails | null> {
  const cleanCnpj = cnpj.replace(/\D/g, "");
  if (cleanCnpj.length !== 14) return null;

  // Tenta cada provider em sequência. Se um falhar, o próximo cobre.
  const providers = [
    { name: "BrasilAPI", fn: () => fetchFromBrasilApi(cleanCnpj) },
    { name: "MinhaReceita", fn: () => fetchFromMinhaReceita(cleanCnpj) },
  ];

  for (const provider of providers) {
    const details = await provider.fn();
    if (details) return details;
  }

  console.warn(`[cnpj] Todos os providers falharam para ${cleanCnpj}`);
  return null;
}

// ─── Name → CNPJ resolver (CasaDosDados API autenticada v5) ──────────────────
//
// BrasilAPI/MinhaReceita só consultam por CNPJ já conhecido; nenhuma faz busca
// por NOME. Esse elo (nome → CNPJ) é o que preenche o CNPJ da maioria dos leads
// vindos do OSM/Geoapify. Usamos a API oficial autenticada da CasaDosDados
// (POST /v5/cnpj/pesquisa, header `api-key`), que — diferente do endpoint
// interno /v2/public/* — NÃO passa pelo desafio Cloudflare e responde JSON.
//
// A chave vem de CASADOSDADOS_API_KEY. Sem a chave, o passo é pulado e o CNPJ
// só é preenchido quando já vem das tags OSM (degradação graciosa, sem quebrar).

const CASADOSDADOS_API_URL =
  "https://api.casadosdados.com.br/v5/cnpj/pesquisa";

interface CasaDosDadosMatch {
  cnpj?: string;
  razao_social?: string;
  nome_fantasia?: string | null;
}

interface CasaDosDadosResponse {
  total?: number;
  cnpjs?: CasaDosDadosMatch[] | null;
}

// Normaliza o nome do município para o formato aceito pelo filtro (minúsculas,
// sem acento) — ex.: "São Paulo" → "sao paulo".
function normalizeCity(city: string): string {
  return city
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// Extrai APENAS o nome do município para o filtro da CasaDosDados. A localização
// pode vir como "Marília, Brasil" ou "Marília - SP"; a base indexa só o nome
// ("marilia"), então descartamos país/UF e tudo após vírgula ou barra. Sem isso,
// o filtro vira "marilia, brasil" e NÃO casa com município nenhum → 0 resultados.
function cityForMunicipio(city: string): string {
  const firstSegment = city.split(/[,/]/)[0];
  return normalizeCity(firstSegment)
    .replace(/\s*-\s*[a-z]{2}$/i, "")
    .trim();
}

// Conectivos e sufixos que não distinguem uma empresa (não valem como filtro).
const SEARCH_STOPWORDS = new Set([
  "dos", "das", "com", "para", "por", "ltda", "mei", "cia", "eireli", "epp",
  "nos", "nas", "aos", "the",
]);

// Quebra o nome da empresa em tokens de busca: minúsculo, sem acento (a base
// guarda sem acento), sem conectivos e sem tokens de ≤2 caracteres. Cada token
// vira uma cláusula AND na pesquisa (uma entrada em busca_textual), devolvendo
// só empresas que contêm TODAS as palavras — é isso que faz um nome com várias
// palavras casar (enviar a frase inteira num único campo retorna 0).
function buildSearchTokens(name: string): string[] {
  const tokens = normalizeCity(name)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !SEARCH_STOPWORDS.has(t));
  // Dedup preservando ordem; limita a 4 (ANDar demais arrisca excluir o match
  // real quando o cadastro omite alguma palavra do nome fantasia).
  return [...new Set(tokens)].slice(0, 4);
}

function normalizeCompareName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Token-overlap similarity (0..1). Guards against matching the wrong company.
function nameSimilarity(a: string, b: string): number {
  const ta = new Set(normalizeCompareName(a).split(" ").filter(Boolean));
  const tb = new Set(normalizeCompareName(b).split(" ").filter(Boolean));
  if (ta.size === 0 || tb.size === 0) return 0;
  let common = 0;
  for (const t of ta) if (tb.has(t)) common++;
  return common / Math.min(ta.size, tb.size);
}

async function resolveCnpjByCasaDosDados(params: {
  name: string;
  uf?: string | null;
  city?: string | null;
}): Promise<string | null> {
  const { name, uf, city } = params;
  const term = name.trim();
  if (term.length < 3) return null;

  const apiKey = process.env.CASADOSDADOS_API_KEY;
  if (!apiKey) {
    console.warn(
      "[cnpj] CASADOSDADOS_API_KEY ausente — busca por nome desativada (CNPJ só via OSM)",
    );
    return null;
  }

  // API oficial v5: cada token do nome vira uma cláusula AND (busca_textual),
  // radical (substring) em razão social OU nome fantasia. Só empresas que
  // contêm TODAS as palavras entram — filtrando ainda por município/UF ativos.
  const tokens = buildSearchTokens(term);
  if (tokens.length === 0) {
    console.log(`[cnpj] "${term}" sem tokens pesquisáveis — pulando busca`);
    return null;
  }

  const municipio = city ? cityForMunicipio(city) : "";

  const body = {
    busca_textual: tokens.map((texto) => ({
      texto: [texto],
      tipo_busca: "radical",
      razao_social: true,
      nome_fantasia: true,
      nome_socio: false,
    })),
    uf: uf ? [uf.toUpperCase()] : [],
    municipio: municipio ? [municipio] : [],
    situacao_cadastral: ["ATIVA"],
    limite: 30,
    pagina: 1,
  };

  try {
    const res = await fetchWithTimeout(
      CASADOSDADOS_API_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify(body),
      },
      10000,
    );

    if (!res.ok) {
      // 401/403 = chave inválida/sem crédito; 429 = limite; demais = instabilidade.
      const hint =
        res.status === 401 || res.status === 403
          ? " (chave inválida ou sem crédito — confira CASADOSDADOS_API_KEY)"
          : res.status === 429
            ? " (limite de requisições atingido)"
            : "";
      console.warn(`[cnpj] CasaDosDados HTTP ${res.status}${hint} para "${term}"`);
      return null;
    }

    const json = (await res.json()) as CasaDosDadosResponse;
    const matches = json.cnpjs ?? [];
    if (matches.length === 0) {
      console.log(`[cnpj] CasaDosDados: 0 matches para "${term}"`);
      return null;
    }

    // Escolhe o melhor match por similaridade de nome (razão social OU fantasia).
    let best: { cnpj: string; score: number } | null = null;
    for (const m of matches) {
      if (!m.cnpj) continue;
      const score = Math.max(
        nameSimilarity(term, m.razao_social ?? ""),
        nameSimilarity(term, m.nome_fantasia ?? ""),
      );
      if (!best || score > best.score) {
        best = { cnpj: m.cnpj, score };
      }
    }

    // Exige similaridade mínima para evitar associar CNPJ de empresa errada.
    if (best && best.score >= 0.6) {
      console.log(
        `[cnpj] CasaDosDados resolveu "${term}" → ${best.cnpj} (score ${best.score.toFixed(2)})`,
      );
      return best.cnpj.replace(/\D/g, "");
    }
    console.log(
      `[cnpj] CasaDosDados: melhor match score ${best?.score.toFixed(2) ?? 0} < 0.6 para "${term}"`,
    );
    return null;
  } catch (err) {
    console.warn(`[cnpj] CasaDosDados erro para "${term}":`, err);
    return null;
  }
}

export async function resolveCnpjByName(params: {
  name: string;
  uf?: string | null;
  city?: string | null;
}): Promise<string | null> {
  // CasaDosDados (API autenticada) é a fonte de busca por nome. Sem chave ou
  // em caso de falha, retorna null e o fluxo segue (CNPJ só via tags OSM).
  return resolveCnpjByCasaDosDados(params);
}

// ─── Orquestração: enriquecer um lead com dados de CNPJ ──────────────────────

export async function enrichWithCnpj(
  params: CnpjEnrichmentParams,
): Promise<CnpjData> {
  const { companyName, knownCnpj, uf, city } = params;

  try {
    // 0) Cache: se já resolvemos esse nome+cidade antes, não gasta API.
    const cached = await getCachedCnpj(companyName, city);
    if (cached) {
      console.log(`[cnpj] cache HIT para "${companyName}"`);
      return cached;
    }

    // 1) Determina o CNPJ: usa o conhecido (OSM) ou tenta resolver pelo nome.
    let cnpj = knownCnpj ? knownCnpj.replace(/\D/g, "") : null;
    if (cnpj && cnpj.length === 14) {
      console.log(`[cnpj] CNPJ conhecido do OSM: ${cnpj} para "${companyName}"`);
    } else {
      cnpj = null;
    }

    if (!cnpj) {
      cnpj = await resolveCnpjByName({ name: companyName, uf, city });
    }

    let result: CnpjData;
    if (!cnpj) {
      console.log(`[cnpj] Sem CNPJ para "${companyName}" (sem tag OSM e sem match na busca por nome)`);
      result = EMPTY_CNPJ_DATA;
    } else {
      // 2) Busca os dados completos (multi-provider: BrasilAPI → MinhaReceita)
      const details = await fetchCnpjDetails(cnpj);
      result = details
        ? {
            cnpj: details.cnpj,
            email: details.email,
            situation: details.situation,
            cnae: details.cnae,
            details,
          }
        : EMPTY_CNPJ_DATA;
    }

    // 3) Grava no cache (inclusive "sem match", evitando reconsultar nomes que
    //    não existem na base). Erros inesperados no catch NÃO são cacheados.
    await setCachedCnpj(companyName, city, result);
    return result;
  } catch (error) {
    console.error(`[cnpj-enrichment] Erro ao enriquecer ${companyName}:`, error);
    return EMPTY_CNPJ_DATA;
  }
}

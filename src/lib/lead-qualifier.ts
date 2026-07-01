import type { RawLead } from "@/types/dashboard-layout/lead.types";

// ─── Qualificação de leads ───────────────────────────────────────────────────
//
// Roda sobre os leads BRUTOS (logo após a busca agregada e ANTES do
// enriquecimento de CNPJ). O objetivo é remover quem NÃO é cliente potencial de
// desenvolvimento de sistemas/sites/apps — órgãos públicos, grandes redes com TI
// própria, concessionárias, empresas de TI (concorrentes) e nichos que não
// compram esse serviço. Assim não gastamos crédito da CasaDosDados consultando
// CNPJ de quem nunca vira lead, e a tabela já nasce limpa.
//
// As listas abaixo são EDITÁVEIS: acrescente palavras-chave/marcas conforme
// aparecerem em novas regiões. A comparação é feita por palavra inteira, sem
// acento e sem diferenciar maiúsculas.

export interface LeadQualification {
  qualified: boolean;
  reason: string | null;
}

// Categorias que, por natureza, não são clientes de dev (bloqueio por categoria).
const EXCLUDED_CATEGORIES = new Set<string>([
  "Farmácia",
  "Saúde",
  "Posto de Combustível",
]);

// Sufixos de domínio de entidade pública/não-comercial.
const EXCLUDED_DOMAIN_SUFFIXES = [
  ".gov.br",
  ".gov",
  ".jus.br",
  ".leg.br",
  ".mil.br",
  ".org.br",
  ".coop.br",
];

// Órgãos públicos, repartições, entidades reguladoras e institutos com TI própria.
const PUBLIC_KEYWORDS = [
  "prefeitura", "prefeito", "secretaria", "ministerio", "governo do",
  "camara municipal", "camara dos", "assembleia", "instituto nacional", "inss",
  "receita federal", "conselho regional", "conselho federal", "cartorio",
  "tabeliao", "tabelionato", "oficio de registro", "oficial de registro",
  "registro de imoveis", "registro civil", "forum", "detran", "poupatempo",
  "ganha tempo", "diretoria de ensino", "sabesp", "correios", "delegacia",
  "procon", "procuradoria", "defensoria", "tribunal", "justica", "oab",
  "ordem dos advogados", "autarquia", "fundacao", "sindicato", "municipal",
  "departamento de aguas", "daee", "cetesb", "ceagesp", "senai", "senac",
  "sesi", "fatec", "incubadora",
];

// Bancos e grandes instituições financeiras (TI própria, nunca clientes).
const BANK_KEYWORDS = [
  "banco", "bancos", "bradesco", "itau", "santander", "banco do brasil",
  "caixa economica", "sicoob", "sicredi", "banrisul", "nubank", "banco inter",
  "safra", "unicred", "bradescard", "banco central",
];

// Empresas de TI/telecom → concorrentes, não clientes.
const IT_TELECOM_KEYWORDS = [
  "informatica", "tecnologia", "telecom", "sistemas", "software", "datacenter",
  "data center", "provedor", "solucoes em ti", "ti",
];

// Concessionárias / revendas de veículos (TI ditada pela montadora).
const CAR_BRAND_KEYWORDS = [
  "fiat", "ford", "chevrolet", "volkswagen", "vw", "jeep", "toyota", "honda",
  "hyundai", "renault", "nissan", "peugeot", "citroen", "mitsubishi", "kia",
  "bmw", "mercedes", "audi", "ram", "dodge", "chery", "caoa", "byd", "volvo",
  "yamaha", "harley",
];

// Grandes redes, franquias e empresas com TI própria. EDITÁVEL — adicione conforme surgirem.
const BIG_CHAIN_KEYWORDS = [
  "havan", "tauste", "confianca", "amigao", "big mart", "bigmart", "spani",
  "atacadao", "assai", "carrefour", "makro", "swift", "droga raia", "drogaraia",
  "drogasil", "pague menos", "pao de acucar", "magazine luiza", "casas bahia",
  "ponto frio", "loja do mecanico", "femsa", "mrv", "rodonaves", "dori",
  "boticario", "pernambucanas", "renner", "riachuelo", "lojas torra", "autozone",
  "mcdonald", "burger king", "subway", "habib", "china in box",
];

// Outros nichos/entidades não-cliente (shopping, borracharia, atacado, coop/ONG, postos).
const OTHER_EXCLUDED_KEYWORDS = [
  "shopping", "borracharia", "atacadista", "atacado", "cooperativa", "coop",
  "instituto assistencial", "associacao", "ong", "santa casa", "unimed",
  "posto", "auto posto", "ampm", "shell select",
];

// Normaliza para comparação por palavra inteira: minúsculo, sem acento, só
// alfanumérico, com espaço nas bordas (para casar " ti " sem pegar "patio").
function norm(text: string): string {
  return ` ${text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

function hostOf(url: string | null): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

// true se `haystack` (já normalizado) contém alguma keyword como palavra inteira.
function matchesAny(haystack: string, keywords: string[]): boolean {
  return keywords.some((kw) => haystack.includes(norm(kw)));
}

// Decide se um lead bruto é cliente potencial. Retorna o motivo da exclusão para
// log/telemetria — útil para auditar o filtro sem precisar rodar de novo.
export function qualifyLead(lead: RawLead): LeadQualification {
  const nameN = norm(lead.name);
  const host = hostOf(lead.website);

  // 1) Categoria bloqueada
  if (lead.category && EXCLUDED_CATEGORIES.has(lead.category)) {
    return { qualified: false, reason: `categoria não-cliente (${lead.category})` };
  }

  // 2) Domínio público / não-comercial
  const badDomain = EXCLUDED_DOMAIN_SUFFIXES.find((suf) => host.endsWith(suf));
  if (badDomain) {
    return { qualified: false, reason: `domínio institucional (${badDomain})` };
  }

  // 3) Palavras-chave no nome
  const rules: Array<[string[], string]> = [
    [PUBLIC_KEYWORDS, "órgão público/instituição"],
    [BANK_KEYWORDS, "banco/instituição financeira"],
    [IT_TELECOM_KEYWORDS, "empresa de TI/telecom (concorrente)"],
    [CAR_BRAND_KEYWORDS, "concessionária de veículos"],
    [BIG_CHAIN_KEYWORDS, "grande rede/empresa com TI própria"],
    [OTHER_EXCLUDED_KEYWORDS, "nicho não-cliente"],
  ];
  for (const [keywords, reason] of rules) {
    if (matchesAny(nameN, keywords)) {
      return { qualified: false, reason };
    }
  }

  return { qualified: true, reason: null };
}

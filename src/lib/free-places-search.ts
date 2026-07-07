import type { RawLead } from "@/types/dashboard-layout/lead.types";

export interface FreePlacesSearchParams {
  location: string;
  radius: string;
  niche?: string;
}

export interface FreePlacesSearchResult {
  leads: RawLead[];
  total: number;
  sources: string[];
}

// ─── Geocoding cache (per-instance, warm-start friendly) ─────────────────────
// Vercel serverless instances are ephemeral, but caching still helps across
// multiple searches hitting the same warm instance and avoids repeated Nominatim
// / ViaCEP calls for the same location.

const geocodeCache = new Map<string, { lat: number; lng: number }>();
const cepCache = new Map<string, ResolvedCep>();

function cacheKey(location: string): string {
  return location.trim().toLowerCase();
}

// ─── Geocoding (Nominatim + ViaCEP — free, no key) ───────────────────────────

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface ViaCepResult {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean | string;
}

interface BrasilApiCepResult {
  cep?: string;
  state?: string;
  city?: string;
  neighborhood?: string | null;
  street?: string | null;
  location?: {
    coordinates?: { longitude?: number; latitude?: number } | Record<string, never>;
  };
  errors?: unknown;
}

interface ResolvedCep {
  street: string | null;
  neighborhood: string | null;
  city: string;
  state: string;
  lat?: number;
  lng?: number;
}

const CEP_REGEX = /^\d{5}-?\d{3}$/;

// Try ViaCEP first, then fall back to BrasilAPI (broader coverage, e.g. general
// municipal CEPs that ViaCEP does not index). Neither requires an API key.
async function resolveCep(cep: string): Promise<ResolvedCep> {
  const digits = cep.replace(/\D/g, "");
  const cached = cepCache.get(digits);
  if (cached) return cached;

  // ── Provider 1: ViaCEP ──────────────────────────────────────────────
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data = (await res.json()) as ViaCepResult;
      // ViaCEP returns erro as boolean true OR the string "true"
      const failed = data.erro === true || data.erro === "true";
      if (!failed && data.localidade && data.uf) {
        const resolved: ResolvedCep = {
          street: data.logradouro || null,
          neighborhood: data.bairro || null,
          city: data.localidade,
          state: data.uf,
        };
        cepCache.set(digits, resolved);
        return resolved;
      }
    }
  } catch {
    // fall through to BrasilAPI
  }

  // ── Provider 2: BrasilAPI ───────────────────────────────────────────
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`, {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data = (await res.json()) as BrasilApiCepResult;
      if (data.city && data.state) {
        const coords = data.location?.coordinates as
          | { longitude?: number; latitude?: number }
          | undefined;
        const resolved: ResolvedCep = {
          street: data.street || null,
          neighborhood: data.neighborhood || null,
          city: data.city,
          state: data.state,
          lat: coords?.latitude,
          lng: coords?.longitude,
        };
        cepCache.set(digits, resolved);
        return resolved;
      }
    }
  } catch {
    // fall through to error
  }

  throw new Error(`CEP não encontrado: "${cep}"`);
}

// Resolve cidade/UF de um CEP para uso como pista geográfica fora do fluxo de
// geocoding (ex.: refinar a busca de CNPJ por nome na rota /api/leads).
// Best-effort: retorna null se ViaCEP e BrasilAPI falharem.
export async function resolveCepCity(
  cep: string,
): Promise<{ city: string; state: string } | null> {
  try {
    const resolved = await resolveCep(cep);
    return { city: resolved.city, state: resolved.state };
  } catch {
    return null;
  }
}

// Structured Nominatim geocoding. A structured query (city/state/country) is far
// more reliable than a free-text street address, which frequently returns empty.
async function geocodeStructured(params: {
  city: string;
  state: string;
  street?: string | null;
}): Promise<{ lat: number; lng: number } | null> {
  const search = new URLSearchParams({
    city: params.city,
    state: params.state,
    country: "Brasil",
    format: "json",
    limit: "1",
  });
  if (params.street) search.set("street", params.street);

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${search.toString()}`,
    { headers: { "User-Agent": "MapHunter/1.0 (https://github.com/maphunter)" } },
  );
  if (!res.ok) return null;

  const data = (await res.json()) as NominatimResult[];
  if (!data[0]) return null;
  return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
}

async function geocodeFreeText(
  query: string,
): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    query,
  )}&countrycodes=br&format=json&limit=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "MapHunter/1.0 (https://github.com/maphunter)" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as NominatimResult[];
  if (!data[0]) return null;
  return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
}

async function geocode(location: string): Promise<{ lat: number; lng: number }> {
  const input = location.trim();
  const key = cacheKey(input);
  const cached = geocodeCache.get(key);
  if (cached) return cached;

  let result: { lat: number; lng: number } | null = null;

  if (CEP_REGEX.test(input)) {
    const resolved = await resolveCep(input);

    // 1) If the CEP provider already gave coordinates, use them directly.
    if (typeof resolved.lat === "number" && typeof resolved.lng === "number") {
      result = { lat: resolved.lat, lng: resolved.lng };
    }

    // 2) Try structured geocoding with street precision, then city fallback.
    if (!result) {
      result = await geocodeStructured({
        city: resolved.city,
        state: resolved.state,
        street: resolved.street,
      });
    }
    if (!result) {
      result = await geocodeStructured({
        city: resolved.city,
        state: resolved.state,
      });
    }

    // 3) Last resort: free-text of the city name.
    if (!result) {
      result = await geocodeFreeText(`${resolved.city}, ${resolved.state}, Brasil`);
    }

    if (!result) {
      throw new Error(
        `Não foi possível localizar o CEP "${location}" (${resolved.city}/${resolved.state}).`,
      );
    }
  } else {
    // Plain city / place name search
    result = await geocodeFreeText(input);
    if (!result) {
      throw new Error(`Localização não encontrada: "${location}"`);
    }
  }

  geocodeCache.set(key, result);
  return result;
}

// ─── Normalization ───────────────────────────────────────────────────────────

// Instagram is NOT a website. Split social links out of the website field.
function normalizeLinks(
  website: string | null,
  instagram: string | null,
): { website: string | null; instagram: string | null } {
  let site = website?.trim() || null;
  let insta = instagram?.trim() || null;

  const isInstagram = (url: string) => /instagram\.com/i.test(url);
  const isSocial = (url: string) =>
    /(facebook\.com|instagram\.com|linktr\.ee|wa\.me|whatsapp\.com|twitter\.com|x\.com|tiktok\.com|linkedin\.com)/i.test(
      url,
    );

  // A website that is actually an Instagram link → move to instagram
  if (site && isInstagram(site)) {
    if (!insta) insta = site;
    site = null;
  }

  // A website that is some other social network is not a real site
  if (site && isSocial(site)) {
    site = null;
  }

  // Normalize instagram handle to a full URL
  if (insta && !/^https?:\/\//i.test(insta)) {
    const handle = insta.replace(/^@/, "").replace(/^instagram\.com\//i, "");
    insta = `https://instagram.com/${handle}`;
  }

  return { website: site, instagram: insta };
}

// Extracts a 14-digit CNPJ from OSM tags. Accepts formats like
// "BR12.345.678/0001-99" (ref:vatin) or plain "12345678000199".
function extractCnpj(raw: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  // ref:vatin may prefix the country code ("BR" → stripped by \D above),
  // leaving exactly 14 digits for a valid CNPJ.
  return digits.length === 14 ? digits : null;
}

// ─── Category classification (any provider tag → canonical PT-BR bucket) ─────
//
// Providers return category names in different languages/formats:
//   - Overpass/OSM: snake_case English tags ("fast_food", "hairdresser")
//   - Geoapify:     dotted English paths ("catering.restaurant")
//   - BizData:      free English names ("Advertising agency", "Bookmaker")
//
// To keep the filter dropdown short and 100% PT-BR, every raw value is mapped
// into ONE of a small, fixed set of canonical categories. Anything unrecognized
// falls back to "Outros". Rules are ordered from most specific to most generic.

const OTHER_CATEGORY = "Outros";

interface CategoryRule {
  label: string;
  // Single-word keywords are matched against whole tokens (avoids false
  // positives like "bar" inside "barbearia"). Multi-word keywords use substring.
  keywords: string[];
}

const CATEGORY_RULES: CategoryRule[] = [
  { label: "Odontologia", keywords: ["dentist", "dentista", "dental", "odonto", "ortodontia"] },
  { label: "Veterinária", keywords: ["veterinary", "veterinaria", "veterinária", "vet"] },
  { label: "Petshop", keywords: ["pet", "petshop", "pet shop", "pet store"] },
  { label: "Farmácia", keywords: ["pharmacy", "farmacia", "farmácia", "chemist", "drogaria", "drugstore"] },
  { label: "Saúde", keywords: ["hospital", "clinic", "clinica", "clínica", "health", "saude", "saúde", "medical", "doctor", "laboratory", "laboratorio", "laboratório", "psycholog", "physiotherap", "fisioterap"] },
  { label: "Padaria", keywords: ["bakery", "padaria", "panificadora"] },
  { label: "Açougue", keywords: ["butcher", "acougue", "açougue", "frigorifico", "frigorífico"] },
  { label: "Hortifruti", keywords: ["greengrocer", "hortifruti", "quitanda", "sacolao", "sacolão", "fruit"] },
  { label: "Supermercado", keywords: ["supermarket", "supermercado", "mercado", "market", "grocery", "hypermarket", "hipermercado", "mercearia", "convenience", "minimercado", "atacado"] },
  { label: "Café", keywords: ["cafe", "café", "coffee", "cafeteria", "confeitaria", "confectionery", "doceria"] },
  { label: "Lanchonete", keywords: ["fast_food", "fast food", "lanchonete", "snack", "burger", "hamburg", "hot dog", "cachorro quente", "salgados", "pastelaria"] },
  { label: "Restaurante", keywords: ["restaurant", "restaurante", "churrascaria", "pizzaria", "pizza", "steak", "sushi", "food court", "dining", "marmitaria", "self service"] },
  { label: "Beleza e Estética", keywords: ["beauty", "hairdresser", "salon", "salao", "salão", "barber", "barbearia", "estetica", "estética", "manicure", "spa", "cosmetic", "cosmetico", "cosmético", "nail", "makeup"] },
  { label: "Bar", keywords: ["bar", "pub", "biergarten", "boteco", "choperia", "cervejaria", "brewery", "nightclub", "night club", "balada", "distribuidora de bebidas"] },
  { label: "Academia", keywords: ["fitness", "gym", "academia", "sport", "sports", "crossfit", "pilates", "yoga", "martial", "luta"] },
  { label: "Hospedagem", keywords: ["hotel", "motel", "hostel", "guest_house", "guesthouse", "pousada", "resort", "accommodation", "lodging", "hospedagem"] },
  { label: "Vestuário", keywords: ["clothes", "clothing", "fashion", "roupa", "roupas", "vestuario", "vestuário", "boutique", "moda", "shoes", "calcado", "calçado", "calcados", "footwear", "sapato", "sapataria"] },
  { label: "Eletrônicos e Informática", keywords: ["electronics", "eletronico", "eletrônico", "eletronicos", "computer", "informatica", "informática", "cell phone", "celular", "mobile phone", "telecom", "telefonia"] },
  { label: "Móveis e Decoração", keywords: ["furniture", "moveis", "móveis", "decor", "decoracao", "decoração", "home goods", "colchao", "colchão"] },
  { label: "Construção", keywords: ["hardware", "doityourself", "construcao", "construção", "material de construcao", "ferragem", "ferragens", "tintas", "building materials", "madeireira"] },
  { label: "Automotivo", keywords: ["car_repair", "car repair", "car_parts", "car parts", "autopeca", "autopeça", "autopecas", "oficina", "mecanica", "mecânica", "car", "auto", "vehicle", "veiculo", "veículo", "tire", "pneu", "car dealer", "concessionaria", "concessionária", "lava rapido", "funilaria"] },
  { label: "Posto de Combustível", keywords: ["fuel", "gas_station", "gas station", "posto", "combustivel", "combustível", "petrol", "petroleo"] },
  { label: "Banco e Finanças", keywords: ["bank", "banco", "financial", "finance", "financeira", "atm", "insurance", "seguro", "seguros", "accountant", "accounting", "contabil", "contábil", "contabilidade", "contador", "corretora"] },
  { label: "Educação", keywords: ["school", "escola", "college", "faculdade", "university", "universidade", "education", "ensino", "curso", "cursos", "kindergarten", "creche", "autoescola"] },
  { label: "Livraria e Papelaria", keywords: ["books", "livraria", "bookstore", "stationery", "papelaria"] },
  { label: "Floricultura", keywords: ["florist", "floricultura", "flower", "flores"] },
  { label: "Imobiliária", keywords: ["real estate", "imobiliaria", "imobiliária", "realtor", "corretor de imoveis"] },
  { label: "Publicidade e Marketing", keywords: ["advertising", "marketing", "publicidade", "agency", "agencia", "agência", "grafica", "gráfica"] },
  { label: "Lazer e Turismo", keywords: ["tourism", "turismo", "leisure", "lazer", "cinema", "theatre", "theater", "teatro", "museum", "museu", "park", "parque", "travel", "viagem", "bookmaker", "lottery", "loteria", "casa lotérica"] },
  { label: "Serviços", keywords: ["service", "services", "servico", "serviço", "servicos", "serviços", "office", "escritorio", "escritório", "laundry", "lavanderia", "consultoria", "consulting", "advogado", "lawyer", "notary", "cartorio", "cartório", "chaveiro"] },
  { label: "Comércio", keywords: ["shop", "store", "commercial", "loja", "comercio", "comércio", "retail", "mall", "shopping", "kiosk", "quiosque", "jewelry", "joalheria", "gift", "optician", "otica", "óptica"] },
];

// Classifies a raw category string from any provider into a canonical PT-BR
// bucket. Returns null only for empty input; unknown values return "Outros".
function translateCategory(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // OSM tags may carry multiple semicolon-separated values (e.g.
  // "pharmacy;fast_food"); use only the first as the primary category.
  const first = raw.split(";")[0] ?? raw;
  const normalized = first
    .trim()
    .toLowerCase()
    .replace(/[_.\-/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return null;

  const tokens = new Set(normalized.split(" "));

  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      if (kw.includes(" ")) {
        if (normalized.includes(kw)) return rule.label;
      } else if (tokens.has(kw)) {
        return rule.label;
      }
    }
  }

  return OTHER_CATEGORY;
}

// ─── Niche → category mapping ────────────────────────────────────────────────

interface NicheMapping {
  overpassTags: string[];
  bizdataCategory: string | null;
  // null → skip Geoapify (e.g. free-text name searches, which Geoapify's
  // category-based Places API cannot filter and would only add noise).
  geoapifyCategory: string | null;
}

const NICHE_MAP: Record<string, NicheMapping> = {
  restaurante: {
    overpassTags: ['["amenity"~"restaurant|fast_food"]'],
    bizdataCategory: "restaurant",
    geoapifyCategory: "catering.restaurant",
  },
  cafe: {
    overpassTags: ['["amenity"~"cafe|biergarten"]'],
    bizdataCategory: "cafe",
    geoapifyCategory: "catering.cafe",
  },
  bar: {
    overpassTags: ['["amenity"~"bar|pub|biergarten"]'],
    bizdataCategory: "bar",
    geoapifyCategory: "catering.bar",
  },
  hotel: {
    overpassTags: ['["tourism"~"hotel|motel|guest_house|hostel"]'],
    bizdataCategory: "hotel",
    geoapifyCategory: "accommodation.hotel",
  },
  academia: {
    overpassTags: ['["leisure"~"fitness_centre|sports_centre"]'],
    bizdataCategory: "gym",
    geoapifyCategory: "sport.fitness",
  },
  farmacia: {
    overpassTags: ['["amenity"="pharmacy"]'],
    bizdataCategory: "pharmacy",
    geoapifyCategory: "healthcare.pharmacy",
  },
  hospital: {
    overpassTags: ['["amenity"~"hospital|clinic"]'],
    bizdataCategory: "hospital",
    geoapifyCategory: "healthcare.hospital",
  },
  dentista: {
    overpassTags: ['["amenity"="dentist"]', '["healthcare"="dentist"]'],
    bizdataCategory: "dentist",
    geoapifyCategory: "healthcare.dentist",
  },
  veterinario: {
    overpassTags: ['["amenity"="veterinary"]'],
    bizdataCategory: null,
    geoapifyCategory: "healthcare.veterinary",
  },
  padaria: {
    overpassTags: ['["shop"="bakery"]'],
    bizdataCategory: "bakery",
    geoapifyCategory: "commercial.bakery",
  },
  supermercado: {
    overpassTags: ['["shop"~"supermarket|convenience"]'],
    bizdataCategory: "supermarket",
    geoapifyCategory: "commercial.supermarket",
  },
  loja: {
    overpassTags: ['["shop"~"clothes|shoes|electronics|furniture"]'],
    bizdataCategory: "clothing",
    geoapifyCategory: "commercial",
  },
  salao: {
    overpassTags: ['["shop"~"hairdresser|beauty"]'],
    bizdataCategory: "beauty",
    geoapifyCategory: "service.beauty",
  },
  posto: {
    overpassTags: ['["amenity"="fuel"]'],
    bizdataCategory: "gas_station",
    geoapifyCategory: "service.gas_station",
  },
  banco: {
    overpassTags: ['["amenity"="bank"]'],
    bizdataCategory: "bank",
    geoapifyCategory: "service.financial",
  },
  escola: {
    overpassTags: ['["amenity"~"school|college|university"]'],
    bizdataCategory: "school",
    geoapifyCategory: "education",
  },
  petshop: {
    overpassTags: ['["shop"="pet"]'],
    bizdataCategory: "pet_shop",
    geoapifyCategory: "commercial.pet",
  },
  floricultura: {
    overpassTags: ['["shop"="florist"]'],
    bizdataCategory: "florist",
    geoapifyCategory: "commercial.florist",
  },
  livraria: {
    overpassTags: ['["shop"="books"]'],
    bizdataCategory: "bookstore",
    geoapifyCategory: "commercial.books",
  },
  automovel: {
    overpassTags: ['["shop"~"car|car_repair|car_parts"]'],
    bizdataCategory: "car_repair",
    geoapifyCategory: "service.car.repair",
  },
};

// Maps many PT-BR/EN synonyms to the canonical NICHE_MAP keys above.
const NICHE_ALIASES: Record<string, string> = {
  // restaurante
  restaurantes: "restaurante", comida: "restaurante", lanchonete: "restaurante",
  pizzaria: "restaurante", churrascaria: "restaurante", "fast food": "restaurante",
  // cafe
  cafeteria: "cafe", cafeterias: "cafe", "cafe colonial": "cafe",
  // bar
  bares: "bar", boteco: "bar", pub: "bar", choperia: "bar", cervejaria: "bar",
  // hotel
  hoteis: "hotel", pousada: "hotel", pousadas: "hotel", motel: "hotel", hostel: "hotel",
  hospedagem: "hotel",
  // academia
  academias: "academia", fitness: "academia", "cross fit": "academia", crossfit: "academia",
  // farmacia
  farmacias: "farmacia", drogaria: "farmacia", drogarias: "farmacia",
  // hospital
  clinica: "hospital", clinicas: "hospital", "posto de saude": "hospital", saude: "hospital",
  // dentista
  dentistas: "dentista", odontologia: "dentista", dental: "dentista",
  // veterinario
  veterinaria: "veterinario", veterinarios: "veterinario", vet: "veterinario",
  // padaria
  padarias: "padaria", panificadora: "padaria",
  // supermercado
  supermercados: "supermercado", mercado: "supermercado", mercados: "supermercado",
  mercearia: "supermercado", minimercado: "supermercado", hipermercado: "supermercado",
  // loja / vestuario
  loja: "loja", lojas: "loja", roupa: "loja", roupas: "loja", vestuario: "loja",
  moda: "loja", boutique: "loja", calcados: "loja", sapataria: "loja",
  // salao / beleza
  salao: "salao", "salao de beleza": "salao", beleza: "salao", barbearia: "salao",
  barbearias: "salao", estetica: "salao", manicure: "salao",
  // posto
  posto: "posto", "posto de combustivel": "posto", "posto de gasolina": "posto",
  // banco
  bancos: "banco", financeira: "banco",
  // escola
  escolas: "escola", colegio: "escola", faculdade: "escola", universidade: "escola",
  curso: "escola", cursos: "escola", ensino: "escola",
  // petshop
  pet: "petshop", "pet shop": "petshop", petshops: "petshop",
  // floricultura
  floricultura: "floricultura", floriculturas: "floricultura", flores: "floricultura",
  // livraria
  livraria: "livraria", livrarias: "livraria", papelaria: "livraria",
  // automovel
  automovel: "automovel", automoveis: "automovel", "auto pecas": "automovel",
  autopecas: "automovel", oficina: "automovel", mecanica: "automovel", carro: "automovel",
  carros: "automovel",
};

// Escape a user term for safe use inside an Overpass regex string.
function escapeOverpassRegex(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\"]/g, "\\$&");
}

// Builds an accent-insensitive regex fragment so an accent-stripped term like
// "informatica" also matches accented OSM names like "Informática". Overpass's
// ",i" flag only handles case, not accents.
const ACCENT_CLASSES: Record<string, string> = {
  a: "[aáàâãä]",
  e: "[eéèêë]",
  i: "[iíìîï]",
  o: "[oóòôõö]",
  u: "[uúùûü]",
  c: "[cç]",
  n: "[nñ]",
};

function buildAccentInsensitiveRegex(term: string): string {
  return escapeOverpassRegex(term)
    .split("")
    .map((ch) => ACCENT_CLASSES[ch] ?? ch)
    .join("");
}

function resolveNiche(niche?: string): NicheMapping {
  const raw = (niche ?? "").trim().toLowerCase();
  // Accent-insensitive key (e.g. "farmácia" → "farmacia")
  const key = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (key && NICHE_MAP[key]) {
    return NICHE_MAP[key];
  }
  const alias = NICHE_ALIASES[key];
  if (alias && NICHE_MAP[alias]) {
    return NICHE_MAP[alias];
  }

  // Unknown free-text niche: search business POIs whose NAME matches the term.
  // This refines results toward whatever the user typed instead of returning
  // every business in the area.
  if (key) {
    const rx = buildAccentInsensitiveRegex(key);
    return {
      overpassTags: [
        `["name"~"${rx}",i]["shop"]`,
        `["name"~"${rx}",i]["amenity"]`,
        `["name"~"${rx}",i]["office"]`,
        `["name"~"${rx}",i]["craft"]`,
      ],
      bizdataCategory: null,
      // Skip Geoapify: it can only filter by category, so it would flood the
      // results with unrelated commercial POIs instead of matching the term.
      geoapifyCategory: null,
    };
  }

  // No niche at all: curated set of common businesses.
  return {
    overpassTags: [
      '["shop"]',
      '["amenity"~"restaurant|fast_food|cafe|bar|pharmacy|bank|fuel|clinic|dentist"]',
      '["office"]',
      '["tourism"~"hotel|guest_house"]',
    ],
    // BizData needs one specific category; skip it for generic searches
    bizdataCategory: null,
    geoapifyCategory: "commercial",
  };
}

// ─── Provider 1: Overpass API (free, no key) ─────────────────────────────────

interface OverpassElement {
  id: number;
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

async function searchOverpass(
  center: { lat: number; lng: number },
  radiusMeters: number,
  tags: string[],
): Promise<RawLead[]> {
  const around = `(around:${radiusMeters},${center.lat},${center.lng})`;
  const queryParts = tags
    .map((tag) => `nwr${tag}${around};`)
    .join("\n  ");

  const query = `[out:json][timeout:25];
(
  ${queryParts}
);
out center;`;

  // The public Overpass instance is shared/rate-limited and occasionally
  // returns 429/504. Retry against mirror instances before giving up.
  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.openstreetmap.ru/api/interpreter",
  ];

  let res: Response | null = null;
  let lastError: unknown = null;

  for (const endpoint of endpoints) {
    try {
      const attempt = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "MapHunter/1.0 (https://github.com/maphunter)",
        },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (attempt.ok) {
        res = attempt;
        break;
      }
      lastError = new Error(`Overpass API falhou: ${attempt.status}`);
    } catch (err) {
      lastError = err;
    }
  }

  if (!res) {
    throw lastError instanceof Error
      ? lastError
      : new Error("Overpass API falhou em todos os mirrors");
  }

  const data = (await res.json()) as OverpassResponse;

  return data.elements
    .filter((el) => el.tags?.name)
    .map((el) => {
      const tags = el.tags!;
      const category =
        tags["shop"] ??
        tags["amenity"] ??
        tags["tourism"] ??
        tags["leisure"] ??
        tags["office"] ??
        tags["healthcare"] ??
        null;

      const { website, instagram } = normalizeLinks(
        tags["website"] ?? tags["contact:website"] ?? null,
        tags["contact:instagram"] ?? tags["instagram"] ?? null,
      );

      return {
        name: tags.name,
        phone: tags["phone"] ?? tags["contact:phone"] ?? "",
        email: tags["email"] ?? tags["contact:email"] ?? null,
        address: [
          tags["addr:housenumber"],
          tags["addr:street"],
          tags["addr:city"],
          tags["addr:postcode"],
        ]
          .filter(Boolean)
          .join(" "),
        website,
        instagram,
        category: translateCategory(category),
        cnpj: extractCnpj(
          tags["ref:vatin"] ?? tags["ref:cnpj"] ?? tags["cnpj"] ?? null,
        ),
        placeId: `osm_${el.type}_${el.id}`,
      } as RawLead;
    });
}

// ─── Provider 2: BizData API (free, no key) ──────────────────────────────────

interface BizDataBusiness {
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  category?: string;
  lat?: number;
  lon?: number;
}

interface BizDataResponse {
  businesses?: BizDataBusiness[];
  total?: number;
  error?: string;
}

async function searchBizData(
  location: string,
  radiusKm: string,
  category: string,
): Promise<RawLead[]> {
  const url = `https://bizdata-web.vercel.app/api/businesses?location=${encodeURIComponent(
    location,
  )}&category=${encodeURIComponent(category)}&radius_km=${radiusKm}&limit=100`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`BizData API falhou: ${res.status}`);
  }

  const data = (await res.json()) as BizDataResponse;
  if (data.error) {
    throw new Error(`BizData API: ${data.error}`);
  }
  const businesses = data.businesses ?? [];

  return businesses
    .filter((b) => b.name)
    .map((b) => {
      const { website, instagram } = normalizeLinks(b.website ?? null, null);
      return {
        name: b.name,
        phone: b.phone ?? "",
        email: b.email ?? null,
        address: b.address ?? "",
        website,
        instagram,
        category: translateCategory(b.category),
        cnpj: null,
        placeId: `bizdata_${b.name}_${b.lat ?? 0}_${b.lon ?? 0}`,
      };
    });
}

// ─── Provider 3: Geoapify (free tier, optional key) ──────────────────────────

interface GeoapifyFeature {
  properties: {
    name?: string;
    formatted?: string;
    phone?: string;
    website?: string;
    categories?: string[];
    datasource?: {
      raw?: {
        phone?: string;
        website?: string;
        email?: string;
        "contact:email"?: string;
        "contact:instagram"?: string;
      };
    };
  };
  geometry?: { coordinates: [number, number] };
}

interface GeoapifyResponse {
  features?: GeoapifyFeature[];
}

async function searchGeoapify(
  center: { lat: number; lng: number },
  radiusMeters: number,
  category: string,
): Promise<RawLead[]> {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) {
    return [];
  }

  const url = `https://api.geoapify.com/v2/places?categories=${encodeURIComponent(
    category,
  )}&filter=circle:${center.lng},${center.lat},${radiusMeters}&limit=100&apiKey=${apiKey}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Geoapify API falhou: ${res.status}`);
  }

  const data = (await res.json()) as GeoapifyResponse;
  const features = data.features ?? [];

  return features
    .filter((f) => f.properties?.name)
    .map((f, i) => {
      const props = f.properties!;
      const { website, instagram } = normalizeLinks(
        props.website ?? props.datasource?.raw?.website ?? null,
        props.datasource?.raw?.["contact:instagram"] ?? null,
      );
      return {
        name: props.name!,
        phone: props.phone ?? props.datasource?.raw?.phone ?? "",
        email:
          props.datasource?.raw?.email ??
          props.datasource?.raw?.["contact:email"] ??
          null,
        address: props.formatted ?? "",
        website,
        instagram,
        category: translateCategory(props.categories?.[0]),
        cnpj: null,
        placeId: `geoapify_${i}`,
      };
    });
}

// ─── Provider 4: Google Places API (New) — opcional, ativado por chave ────────
//
// Ativa automaticamente quando GOOGLE_PLACES_API_KEY existe no .env. Usa o
// endpoint Text Search (v1) com viés de localização (círculo), retornando os
// resultados no mesmo formato RawLead para entrar na busca unificada/dedup.

interface GooglePlace {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  primaryType?: string;
  types?: string[];
}

interface GooglePlacesResponse {
  places?: GooglePlace[];
  nextPageToken?: string;
}

async function searchGooglePlaces(
  center: { lat: number; lng: number },
  radiusMeters: number,
  textQuery: string,
): Promise<RawLead[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return [];
  }

  // Text Search circle bias caps radius at 50km.
  const radius = Math.min(radiusMeters, 50000);
  const fieldMask = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.nationalPhoneNumber",
    "places.internationalPhoneNumber",
    "places.websiteUri",
    "places.primaryType",
    "places.types",
    "nextPageToken",
  ].join(",");

  const leads: RawLead[] = [];
  let pageToken: string | undefined;
  const MAX_PAGES = 3; // 20 resultados por página → até 60 no total

  for (let page = 0; page < MAX_PAGES; page++) {
    const body: Record<string, unknown> = {
      textQuery,
      languageCode: "pt-BR",
      regionCode: "BR",
      maxResultCount: 20,
      locationBias: {
        circle: {
          center: { latitude: center.lat, longitude: center.lng },
          radius,
        },
      },
    };
    if (pageToken) body.pageToken = pageToken;

    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      // First page failing is a real error; later pages just stop pagination.
      if (page === 0) {
        throw new Error(`Google Places API falhou: ${res.status}`);
      }
      break;
    }

    const data = (await res.json()) as GooglePlacesResponse;
    for (const p of data.places ?? []) {
      const name = p.displayName?.text;
      if (!name) continue;
      const { website, instagram } = normalizeLinks(p.websiteUri ?? null, null);
      leads.push({
        name,
        phone: p.nationalPhoneNumber ?? p.internationalPhoneNumber ?? "",
        email: null,
        address: p.formattedAddress ?? "",
        website,
        instagram,
        category: translateCategory(p.primaryType ?? p.types?.[0]),
        cnpj: null,
        placeId: `google_${p.id ?? name}`,
      });
    }

    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }

  return leads;
}

// ─── Dedup / merge ───────────────────────────────────────────────────────────

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "");
}

function deduplicateLeads(leads: RawLead[]): RawLead[] {
  const seen = new Map<string, RawLead>();

  for (const lead of leads) {
    const key = normalizeName(lead.name);
    if (!key) continue;

    if (!seen.has(key)) {
      seen.set(key, lead);
    } else {
      const existing = seen.get(key)!;
      // Merge: fill missing fields from the duplicate
      if (!existing.phone && lead.phone) existing.phone = lead.phone;
      if (!existing.email && lead.email) existing.email = lead.email;
      if (!existing.address && lead.address) existing.address = lead.address;
      if (!existing.website && lead.website) existing.website = lead.website;
      if (!existing.instagram && lead.instagram) existing.instagram = lead.instagram;
      if (!existing.category && lead.category) existing.category = lead.category;
      if (!existing.cnpj && lead.cnpj) existing.cnpj = lead.cnpj;
    }
  }

  return Array.from(seen.values());
}

// ─── Main aggregator ─────────────────────────────────────────────────────────

export async function searchFreePlaces(
  params: FreePlacesSearchParams,
): Promise<FreePlacesSearchResult> {
  const { location, radius, niche } = params;
  const radiusKm = radius;
  const radiusMeters = Number(radius) * 1000;
  const nicheMap = resolveNiche(niche);

  console.log(
    `[free-places-search] Buscando "${niche ?? "empresas"}" em ${location} (raio ${radius}km)`,
  );

  // Step 1: Geocode the location
  const center = await geocode(location);
  console.log(`[free-places-search] Coordenadas: ${center.lat}, ${center.lng}`);

  // Step 2: Run all providers in parallel
  const sources: string[] = [];
  const results: RawLead[] = [];

  // Google Places uses a text query: the user's niche, or a generic term.
  const googleQuery = niche?.trim() || "estabelecimentos comerciais";

  const [overpassResult, bizdataResult, geoapifyResult, googleResult] =
    await Promise.allSettled([
      searchOverpass(center, radiusMeters, nicheMap.overpassTags),
      nicheMap.bizdataCategory
        ? searchBizData(location, radiusKm, nicheMap.bizdataCategory)
        : Promise.resolve<RawLead[]>([]),
      nicheMap.geoapifyCategory
        ? searchGeoapify(center, radiusMeters, nicheMap.geoapifyCategory)
        : Promise.resolve<RawLead[]>([]),
      // Optional: only runs if GOOGLE_PLACES_API_KEY is set (returns [] otherwise)
      searchGooglePlaces(center, radiusMeters, googleQuery),
    ]);

  if (overpassResult.status === "fulfilled") {
    results.push(...overpassResult.value);
    sources.push("Overpass");
    console.log(`[free-places-search] Overpass: ${overpassResult.value.length} leads`);
  } else {
    console.error("[free-places-search] Overpass falhou:", overpassResult.reason);
  }

  if (bizdataResult.status === "fulfilled" && nicheMap.bizdataCategory) {
    results.push(...bizdataResult.value);
    sources.push("BizData");
    console.log(`[free-places-search] BizData: ${bizdataResult.value.length} leads`);
  } else if (bizdataResult.status === "rejected") {
    console.error("[free-places-search] BizData falhou:", bizdataResult.reason);
  }

  if (geoapifyResult.status === "fulfilled" && geoapifyResult.value.length > 0) {
    results.push(...geoapifyResult.value);
    sources.push("Geoapify");
    console.log(`[free-places-search] Geoapify: ${geoapifyResult.value.length} leads`);
  } else if (geoapifyResult.status === "rejected") {
    console.error("[free-places-search] Geoapify falhou:", geoapifyResult.reason);
  }

  if (googleResult.status === "fulfilled" && googleResult.value.length > 0) {
    results.push(...googleResult.value);
    sources.push("Google Places");
    console.log(`[free-places-search] Google Places: ${googleResult.value.length} leads`);
  } else if (googleResult.status === "rejected") {
    console.error("[free-places-search] Google Places falhou:", googleResult.reason);
  }

  // If every provider failed, surface a real error instead of silently
  // returning an empty result (which looks like "no results" to the user).
  if (sources.length === 0) {
    const reasons = [overpassResult, bizdataResult, geoapifyResult, googleResult]
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map((r) => (r.reason instanceof Error ? r.reason.message : String(r.reason)));
    throw new Error(
      reasons.length > 0
        ? `Nenhuma fonte de dados respondeu: ${reasons.join(" | ")}`
        : "Nenhuma fonte de dados retornou resultados. Tente novamente em alguns segundos.",
    );
  }

  // Step 3: Deduplicate and merge
  const deduped = deduplicateLeads(results);
  console.log(
    `[free-places-search] Total: ${results.length} brutos → ${deduped.length} únicos (fontes: ${sources.join(", ")})`,
  );

  return {
    leads: deduped,
    total: deduped.length,
    sources,
  };
}

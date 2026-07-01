import { promises as fs } from "node:fs";
import path from "node:path";
import type { CnpjData } from "@/types/dashboard-layout/lead.types";

// ─── Cache persistente de CNPJ (server-side) ─────────────────────────────────
//
// Guarda o resultado do enriquecimento por nome+cidade em memória e em disco
// (.cache/cnpj-cache.json). Antes de consultar a CasaDosDados, o enrichment
// checa aqui — reduzindo consumo de API entre buscas e entre reinícios do
// servidor. Para forçar atualização, basta apagar o arquivo .cache/cnpj-cache.json.
//
// Observação: em ambientes serverless (ex.: Vercel) o disco é efêmero — o cache
// em memória continua valendo por instância; a persistência só é garantida
// rodando localmente/servidor dedicado.

interface CacheEntry {
  data: CnpjData;
  ts: number;
}

const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias
const CACHE_DIR = path.join(process.cwd(), ".cache");
const CACHE_FILE = path.join(CACHE_DIR, "cnpj-cache.json");

let memory: Map<string, CacheEntry> | null = null;
// Serializa as gravações em disco para não corromper o arquivo com writes
// concorrentes (o enrichment roda com concorrência).
let flushChain: Promise<void> = Promise.resolve();

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function keyOf(name: string, city?: string | null): string {
  return `${normalize(name)}|${city ? normalize(city) : ""}`;
}

async function load(): Promise<Map<string, CacheEntry>> {
  if (memory) return memory;
  const mem = new Map<string, CacheEntry>();
  try {
    const raw = await fs.readFile(CACHE_FILE, "utf8");
    const obj = JSON.parse(raw) as Record<string, CacheEntry>;
    const now = Date.now();
    for (const [k, v] of Object.entries(obj)) {
      if (v && typeof v.ts === "number" && now - v.ts < TTL_MS) mem.set(k, v);
    }
  } catch {
    // sem cache ainda — começa vazio
  }
  memory = mem;
  return mem;
}

function scheduleFlush(): void {
  flushChain = flushChain
    .then(async () => {
      if (!memory) return;
      const obj: Record<string, CacheEntry> = {};
      for (const [k, v] of memory) obj[k] = v;
      await fs.mkdir(CACHE_DIR, { recursive: true });
      const tmp = `${CACHE_FILE}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(obj), "utf8");
      await fs.rename(tmp, CACHE_FILE); // gravação atômica
    })
    .catch(() => {
      // persistência é best-effort — o cache em memória segue válido
    });
}

export async function getCachedCnpj(
  name: string,
  city?: string | null,
): Promise<CnpjData | null> {
  const mem = await load();
  const key = keyOf(name, city);
  const entry = mem.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts >= TTL_MS) {
    mem.delete(key);
    return null;
  }
  return entry.data;
}

export async function setCachedCnpj(
  name: string,
  city: string | null | undefined,
  data: CnpjData,
): Promise<void> {
  const mem = await load();
  mem.set(keyOf(name, city), { data, ts: Date.now() });
  scheduleFlush();
}

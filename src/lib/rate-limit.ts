// ─── Rate limiting simples (janela fixa, em memória) ─────────────────────────
//
// Protege as rotas de API contra abuso/força-bruta e contra estourar o crédito
// das APIs externas. Adequado para uso local e deploy single-instance. Em
// serverless multi-instância o limite passa a ser por instância (defesa
// parcial) — para produção séria, trocar por Redis/Upstash.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();

  // Poda preguiçosa de buckets expirados para não crescer indefinidamente.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      if (now >= b.resetAt) buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSec: 0 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count++;
  return { allowed: true, remaining: limit - bucket.count, retryAfterSec: 0 };
}

// Identifica o cliente pelos headers de proxy reverso (Vercel/NGINX). Sem cabeçalho
// confiável, cai em "unknown" (limita todos juntos — conservador, mas seguro).
export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

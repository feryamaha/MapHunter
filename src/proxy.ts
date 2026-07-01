import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─── Proxy (antigo middleware no Next ≤15) ───────────────────────────────────
//
// Gera um nonce único por request e aplica uma Content-Security-Policy forte
// (CSP Level 3, strict-dynamic). O Next injeta o nonce automaticamente nos
// scripts que ele mesmo emite (runtime React/Next + bundles da página), então
// não é preciso anotar cada <script> manualmente.
//
// Como TODA chamada a APIs externas (Overpass, Geoapify, BrasilAPI, CasaDosDados,
// Nominatim) acontece no servidor (BFF), o browser só precisa falar com a própria
// origem — por isso `connect-src 'self'`. Em dev, liberamos o websocket do HMR.
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  const csp = [
    "default-src 'self'",
    // strict-dynamic: só rodam os scripts com este nonce (e o que eles
    // carregarem). 'unsafe-eval' apenas em dev (React usa eval no HMR/debug).
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Tailwind + estilos inline de bibliotecas → 'unsafe-inline' (estilo tem
    // risco de XSS muito menor que script; usar nonce aqui quebra style attrs).
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

// Não roda em rotas de API, assets estáticos, imagens otimizadas nem favicon;
// também ignora prefetches do next/link (não precisam do header de CSP).
export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};

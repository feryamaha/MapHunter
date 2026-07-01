// next.config.js

// Headers ESTÁTICOS apenas (o CSP dinâmico com nonce vem do src/proxy.ts).
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" }, // Bloqueia clickjacking
  { key: "X-Content-Type-Options", value: "nosniff" }, // Anti-MIME sniffing
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }, // Controle de leaks
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" }, // Desabilita features desnecessárias
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }, // HTTPS forçado
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" }, // Isolamento contra Spectre / abuso de window.opener
  { key: "Cross-Origin-Resource-Policy", value: "same-site" }, // Limita quem pode embutir os recursos
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // Remove X-Powered-By

  experimental: {
    turbopackFileSystemCacheForDev: true,
  },

  // Configuração Turbopack - resolveAlias para substituir webpack.resolve.alias
  turbopack: {
    resolveAlias: {
      '@': './src',
    },
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;

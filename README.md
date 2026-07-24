# MapHunter

> Minerador de Leads B2B Regional: transforme o mapa em uma lista de clientes potenciais pronta para prospecção.

## O problema

Vender serviços de desenvolvimento de software para empresas locais exige uma lista de prospects qualificados. O problema é que **encontrar esses prospects manualmente é lento e ineficiente**: você abre o Google Maps, procura por nicho em cada cidade, anota os que não têm site, verifica o CNPJ um a um no site da Receita, descobre que metade é órgão público ou grande rede com TI própria, e perde horas antes de fazer a primeira ligação.

MapHunter automatiza todo esse funil: você digita uma cidade (ou CEP), um raio de alcance e um nicho opcional, e a ferramenta:

1. **Minera** empresas em até 4 fontes de dados simultaneamente (OpenStreetMap, BizData, Geoapify, Google Places)
2. **Qualifica** os leads: descarta automaticamente órgãos públicos, bancos, grandes redes, concessionárias e empresas de TI (concorrentes)
3. **Enriquece** com CNPJ completo da Receita Federal (razão social, situação cadastral, CNAE, capital social, quadro societário, contatos)
4. **Classifica** cada lead: *Sem Site*, *Sem Presença Digital*, *Ativa* ou *Inativa*
5. **Filtra** empresas inativas (baixada/suspensa/inapta) da lista final
6. **Exporta** tudo em CSV ou XLSX com um clique

O resultado é uma lista enxuta de empresas locais **ativas e sem presença digital**: o perfil exato de quem precisa dos seus serviços.

## Como usar para captar leads

1. **Busque por região**: digite a cidade (ou CEP) onde você atua, selecione um raio e, opcionalmente, um nicho (ex: "dentista", "restaurante", "academia")
2. **Filtre por "Sem site"**: use o filtro de presença para isolar as empresas sem website; essas são suas oportunidades mais quentes
3. **Expanda os detalhes**: clique numa linha para ver CNPJ completo, situação cadastral, capital social, sócios, telefone e e-mail da Receita
4. **Use o WhatsApp**: leads com telefone têm link direto para WhatsApp; abra a conversa com uma proposta já sabendo o porte e o ramo da empresa
5. **Exporte a lista**: baixe em CSV (compatível com Excel pt-BR) ou XLSX para importar no seu CRM, planilha de acompanhamento ou ferramenta de disparo
6. **Repita por nicho/cidade**: o histórico das últimas 3 buscas fica salvo na sidebar; reabra sem consumir API

## Stack tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, TailwindCSS 3, UI Kit próprio |
| Formulários | React Hook Form + Zod 4 |
| Linguagem | TypeScript 5 |
| Runtime | Node.js (API routes com `maxDuration: 60s`) |
| Lint/Format | Biome 2 |
| Pacotes | Bun |

## Arquitetura

```
Browser (client)
  │
  │  POST /api/leads  { location, radius, niche }
  ▼
BFF (Next.js API routes: server-side)
  │
  ├── Geocoding: Nominatim + ViaCEP + BrasilAPI (CEP → coords)
  │
  ├── Busca agregada (paralela, Promise.allSettled):
  │     ├── Overpass API (OpenStreetMap): gratuito, sem chave
  │     ├── BizData API: gratuito, sem chave
  │     ├── Geoapify: free tier 3k req/dia (opcional, por chave)
  │     └── Google Places API (New): opcional, por chave
  │
  ├── Deduplicação e merge (por nome normalizado)
  │
  ├── Qualificação (lead-qualifier.ts):
  │     descarta órgãos públicos, bancos, grandes redes,
  │     concessionárias, TI/telecom e nichos não-cliente
  │
  ├── Enriquecimento CNPJ (cnpj-enrichment.ts):
  │     ├── Cache server-side (.cache/cnpj-cache.json, TTL 30 dias)
  │     ├── CasaDosDados API (nome → CNPJ, requer chave)
  │     └── BrasilAPI → MinhaReceita (CNPJ → dados completos, fallback)
  │
  ├── Classificação (lead-classifier.ts):
  │     Sem Site | Sem Presença Digital | Ativa | Inativa/Baixada
  │
  └── Filtro final: remove empresas inativas
```

Todas as chamadas a APIs externas acontecem **no servidor** (BFF). O browser só fala com a própria origem (`/api/*`), o que permite uma CSP restritiva com `connect-src 'self'`.

## Estrutura do projeto

```
src/
├── app/
│   ├── page.tsx                    # Landing page (hero + CTA)
│   ├── layout.tsx                  # Root layout (fontes, metadata, force-dynamic)
│   ├── not-found.tsx               # Página 404
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar + Topbar + main
│   │   └── dashboard/page.tsx      # Dashboard: busca, stats, filtros, tabela
│   └── api/
│       ├── leads/route.ts          # Pipeline completo: scrape → qualify → enrich → classify
│       ├── cnpj/route.ts           # Consulta isolada de CNPJ (por nome)
│       └── scraping/route.ts       # Busca agregada sem enriquecimento
├── components/
│   ├── dashboard-layout/           # Sidebar, Topbar, Logo
│   ├── shared-dashboard/           # SearchBar, LeadsTable, LeadsTableSkeleton
│   └── ui/                         # UI Kit: Button, Badge, Alerts, Pagination, etc.
├── hooks/
│   ├── dashboard-layout/           # useSearchBar, useSearchHistory, useFloatingLabelInput
│   └── hook-fetch-api/             # useLeadsData, useLeadsFilters
├── lib/
│   ├── free-places-search.ts       # Agregador de 4 providers + geocoding + dedup
│   ├── scraping-engine.ts          # Wrapper do agregador
│   ├── cnpj-enrichment.ts          # CasaDosDados + BrasilAPI + MinhaReceita
│   ├── cnpj-cache.ts               # Cache persistente de CNPJ (disco, TTL 30 dias)
│   ├── lead-qualifier.ts           # Filtro de não-clientes (órgãos públicos, bancos, etc.)
│   ├── lead-classifier.ts          # Classificação por presença digital/situação
│   ├── rate-limit.ts               # Rate limit em memória (janela fixa por IP)
│   └── server-api.ts               # HTTP client com timeout/abort
├── schema/
│   └── search-params.schema.ts     # Validação Zod (location, radius, niche)
├── proxy.ts                        # CSP + nonce (Next 16 renomeou middleware → proxy)
├── types/                          # Tipos TypeScript (Lead, CnpjDetails, UI components)
└── utils/
    ├── export-csv.ts               # Exportação CSV (BOM UTF-8, separador ;)
    ├── export-xlsx.ts              # Exportação XLSX (OpenXML via fflate, sem deps pesadas)
    └── lead-formatters.helpers.ts  # Máscaras de CNPJ e telefone
```

## Fluxo de UI/UX

### Landing page (`/`)

Apresenta o produto com 3 cards de features (busca por região, leads qualificados, exportação fácil) e um CTA "Começar a buscar" que leva ao dashboard.

### Dashboard (`/dashboard`)

- **Sidebar** (esquerda, oculta no mobile): logo, navegação, histórico das últimas 3 buscas (com contador de "sem site" por busca), perfil do usuário
- **Topbar**: título da página, indicador "APIs online" (ping animado), avatar
- **SearchBar**: input de cidade/CEP com máscara automática, seletor de raio (1km a 1000km), campo de nicho opcional, botão de busca com spinner
- **Stat cards** (aparecem após a busca): total de leads, sem site (oportunidade), com WhatsApp, empresas ativas
- **Alerts**: feedback de sucesso/erro/aviso (busca concluída, nenhum lead, erro)
- **Filtros**: dropdown de presença (Todos, Com site, Sem site, Com telefone, Com Instagram, Com/Sem CNPJ, Sem dados), dropdown de categoria, busca por texto livre
- **Tabela de leads** (desktop): grid com colunas Empresa (sticky), Categoria, CNPJ, Endereço, WhatsApp, Presença digital; linhas expansíveis revelam painel completo de CNPJ (razão social, CNAE, porte, capital social, sócios, datas, contatos da Receita)
- **Cards de lead** (mobile): layout empilhado com botão de expandir/recolher detalhes
- **Paginação**: controle de itens por página + navegação
- **Exportação**: botões CSV e XLSX que exportam a lista filtrada atual

### Histórico de buscas

As 3 buscas mais recentes são salvas no `localStorage` **com o resultado completo** (leads + fontes). Clicar num card do histórico reabre a tabela instantaneamente, **sem consumir API**. Se o `localStorage` estourar a cota, os leads das entradas mais antigas são descartados (mantém os metadados).

## Configuração

### Pré-requisitos

- Node.js 20+ ou Bun
- As APIs gratuitas (Overpass, BizData, ViaCEP, BrasilAPI, Nominatim) funcionam sem configuração

### Variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha conforme necessário:

```bash
cp .env.local.example .env.local
```

| Variável | Obrigatória | Descrição |
|---|---|---|
| `GEOAPIFY_API_KEY` | Não | Free tier 3k req/dia. Melhora cobertura de resultados. |
| `GOOGLE_PLACES_API_KEY` | Não | Places API (New). Melhor cobertura de pequenos negócios. Requer billing ativo no Google Cloud. |
| `CASADOSDADOS_API_KEY` | Não* | Busca de CNPJ por nome da empresa. Sem ela, o CNPJ só aparece quando já vem nas tags do OpenStreetMap. |

*\*Recomendada: sem a chave da CasaDosDados, a maioria dos leads fica sem CNPJ (BrasilAPI/MinhaReceita só consultam CNPJ já conhecido, não buscam por nome).*

### Rodando localmente

```bash
bun install
bun dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Segurança

- **CSP Level 3** com nonce por request e `strict-dynamic` (`src/proxy.ts`)
- **Headers de segurança**: X-Frame-Options DENY, HSTS, nosniff, Referrer-Policy, Permissions-Policy, COOP/COEP
- **Validação de entrada** com Zod + regex `SAFE_TEXT` (bloqueia caracteres de injeção)
- **Rate limiting** por IP: 8 req/min para `/api/leads` e `/api/scraping`, 20 req/min para `/api/cnpj`
- **Chaves de API** nunca expostas no client (todas as chamadas externas rodam no servidor)
- `.env.local` e `.cache/` no `.gitignore`

## O que o MapHunter NÃO faz

- **Não tem autenticação**: é uma ferramenta de uso individual/local, sem login nem multi-usuário
- **Não tem banco de dados**: estado é efêmero; histórico vai no `localStorage` e cache de CNPJ em arquivo
- **Não faz outreach automático**: não envia e-mails, não dispara WhatsApp em massa, não integra com CRM
- **Não monitora em tempo real**: cada busca é uma operação sob demanda (não há webhook nem polling)
- **Não tem rate limit distribuído**: o limitador é em memória (por instância); para produção multi-instância, trocar por Redis/Upstash
- **Não persiste cache de CNPJ em serverless**: o cache em disco (`.cache/`) só funciona em servidor dedicado; em Vercel, o cache em memória vale por instância warm
- **Não valida dígito verificador de CNPJ**: confia no formato (14 dígitos) retornado pelas APIs
- **Não geocodifica CEP com dígito verificador**: valida formato `00000-000` mas não verifica o DV

## Licença

Distributed under the **MIT License** (see [`LICENSE`](LICENSE)). You are free to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of this software.

---

**Author / maintainer:** [@feryamaha](https://github.com/feryamaha)

**Networks:** [GitHub](https://github.com/feryamaha) · [LinkedIn](https://www.linkedin.com/in/feryamaha) · [X (Twitter)](https://x.com/_feryamaha) · [Email](mailto:feryamaha@hotmail.com)

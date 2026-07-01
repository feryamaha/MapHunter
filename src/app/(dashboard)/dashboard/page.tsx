"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Alerts } from "@/components/ui/Alerts";
import { DropdownMenu } from "@/components/ui/Dropdown";
import { Icon } from "@/script/Icon";
import { SearchBar } from "@/components/shared-dashboard/SearchBar";
import { LeadsTable } from "@/components/shared-dashboard/LeadsTable";
import {
  useLeadsData,
  useLeadsFilters,
  presenceFilterOptions,
} from "@/hooks/hook-fetch-api";
import {
  useSearchHistory,
  getHistoryEntry,
} from "@/hooks/dashboard-layout/useSearchHistory.hook";
import type { SearchParams } from "@/schema/search-params.schema";
import { downloadCsv } from "@/utils/export-csv";
import { downloadXlsx } from "@/utils/export-xlsx";
import type { MenuItem } from "@/types/dashboard-layout/dropdown.types";

function DashboardContent() {
  const searchParams = useSearchParams();
  const radiusParam = searchParams.get("radius");
  const initialParams: Partial<SearchParams> = {
    location: searchParams.get("location") ?? undefined,
    radius: radiusParam as SearchParams["radius"] | undefined,
    niche: searchParams.get("niche") ?? undefined,
  };
  const hasInitialParams = !!initialParams.location;

  const historyId = searchParams.get("historyId");

  const [hasSearched, setHasSearched] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const { data, loading, error, sources, fetchLeads, loadLeads } =
    useLeadsData();
  const {
    activeFilter,
    setActiveFilter,
    activeFilterLabel,
    activeCategory,
    setActiveCategory,
    categories,
    searchTerm,
    setSearchTerm,
    filteredLeads,
  } = useLeadsFilters(data);
  const { addSearch } = useSearchHistory();

  const autoRanRef = useRef<string | null>(null);

  // Reage a: (1) clique num card salvo (?historyId) → abre o resultado salvo
  // sem consumir API; (2) link com query params → auto-busca uma única vez.
  useEffect(() => {
    // 1) Resultado salvo do histórico
    if (historyId) {
      if (autoRanRef.current === `h:${historyId}`) return;
      const entry = getHistoryEntry(historyId);
      if (entry && entry.leads.length > 0) {
        autoRanRef.current = `h:${historyId}`;
        setHasSearched(true);
        setFromCache(true);
        loadLeads(entry.leads, entry.sources);
        return;
      }
    }

    // 2) Auto-busca por query params (uma vez por combinação)
    if (hasInitialParams) {
      const key = `q:${initialParams.location}|${radiusParam}|${initialParams.niche ?? ""}`;
      if (autoRanRef.current === key) return;
      autoRanRef.current = key;
      const params: SearchParams = {
        location: initialParams.location!,
        radius: (radiusParam as SearchParams["radius"]) ?? "5",
        niche: initialParams.niche ?? "",
      };
      setHasSearched(true);
      setFromCache(false);
      fetchLeads(params).then(({ leads, sources }) => {
        addSearch(params, {
          leads,
          sources,
          withoutSite: leads.filter((l) => !l.website).length,
        });
      });
    }
  }, [
    historyId,
    hasInitialParams,
    initialParams,
    radiusParam,
    fetchLeads,
    loadLeads,
    addSearch,
  ]);

  const handleSearch = async (params: SearchParams) => {
    setHasSearched(true);
    setFromCache(false);
    const { leads, sources } = await fetchLeads(params);
    addSearch(params, {
      leads,
      sources,
      withoutSite: leads.filter((l) => !l.website).length,
    });
  };

  const hasResults = data.length > 0;

  // Build dropdown items for presence filter
  const presenceItems: MenuItem[] = presenceFilterOptions.map((opt) => ({
    label: opt.label,
    onClick: () => setActiveFilter(opt.value),
  }));

  // Build dropdown items for category filter
  const categoryItems: MenuItem[] = [
    { label: "Todas categorias", onClick: () => setActiveCategory("all") },
    ...categories.map((cat) => ({
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      onClick: () => setActiveCategory(cat),
    })),
  ];

  const activeCategoryLabel =
    activeCategory === "all"
      ? "Todas categorias"
      : activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1);

  return (
    <Container className="py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1 @tablet:text-center @tablet:items-center">
          <h2 className="font-lato text-2xl @tablet:text-3xl font-bold text-neutral-900">
            Encontre leads na sua região
          </h2>
          <p className="font-inter text-sm text-neutral-500">
            Informe a localização ou CEP, o raio de alcance e o nicho para
            minerar empresas.
          </p>
        </div>

        <SearchBar onSubmit={handleSearch} defaults={initialParams} />

        {loading && (
          <Alerts
            type="info"
            layout="flat"
            styleVariant="filled"
            title="Buscando leads..."
            description="Aguarde enquanto mineramos os dados da região selecionada."
          />
        )}

        {error && (
          <Alerts
            type="danger"
            layout="flat"
            styleVariant="filled"
            title="Erro na busca"
            description={error}
          />
        )}

        {!loading && !error && hasSearched && hasResults && (
          <Alerts
            type={fromCache ? "info" : "success"}
            layout="flat"
            styleVariant="filled"
            title={fromCache ? "Resultado salvo" : "Busca concluída!"}
            description={
              fromCache
                ? `${data.length} leads carregados do histórico (sem consumir API), via ${sources.join(", ")}.`
                : `${data.length} leads encontrados via ${sources.join(", ")}.`
            }
          />
        )}

        {!loading && !error && hasSearched && !hasResults && (
          <Alerts
            type="warning"
            layout="flat"
            styleVariant="filled"
            title="Nenhum lead encontrado"
            description="Tente ajustar os parâmetros de busca ou ampliar o raio."
          />
        )}

        {hasResults && !loading && (
          <>
            <div className="flex flex-col @tablet:flex-row items-stretch @tablet:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <DropdownMenu
                  items={presenceItems}
                  triggerText={activeFilterLabel}
                  triggerClassName="rounded-full"
                />
                {categories.length > 0 && (
                  <DropdownMenu
                    items={categoryItems}
                    triggerText={activeCategoryLabel}
                    triggerClassName="rounded-full"
                  />
                )}
                <div className="relative w-full @tablet:w-64">
                  <Icon
                    name="iconSearch"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                  />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filtrar por nome ou tipo..."
                    className="h-9 w-full rounded-full border border-stroke-100 bg-white pl-9 pr-8 font-inter text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      aria-label="Limpar filtro"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                    >
                      <Icon name="iconClose" className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => downloadCsv(filteredLeads)}
                  className="w-auto gap-2"
                >
                  <Icon name="iconDownload" className="w-4 h-4" />
                  CSV
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => downloadXlsx(filteredLeads)}
                  className="w-auto gap-2"
                >
                  <Icon name="iconDownload" className="w-4 h-4" />
                  XLSX
                </Button>
              </div>
            </div>

            <div className="relative left-1/2 w-screen -translate-x-1/2 px-4 @tablet:px-8">
              <LeadsTable
                leads={filteredLeads}
                className="mx-auto max-w-[1600px]"
              />
            </div>
          </>
        )}
      </div>
    </Container>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}

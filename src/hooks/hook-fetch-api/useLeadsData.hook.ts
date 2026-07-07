"use client";

import { useState, useEffect } from "react";
import type { Lead } from "@/types/dashboard-layout/lead.types";
import type { SearchParams } from "@/schema/search-params.schema";

interface LeadsDataState {
  data: Lead[];
  loading: boolean;
  error: string | null;
  sources: string[];
  partial: boolean;
  totalEnriched: number;
}

export function useLeadsData() {
  const [state, setState] = useState<LeadsDataState>({
    data: [],
    loading: false,
    error: null,
    sources: [],
    partial: false,
    totalEnriched: 0,
  });

  const fetchLeads = async (
    params: SearchParams,
  ): Promise<{ leads: Lead[]; sources: string[] }> => {
    setState({ data: [], loading: true, error: null, sources: [], partial: false, totalEnriched: 0 });

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error ?? "Erro ao buscar leads");
      }

      const result = await response.json();
      const leads: Lead[] = result.leads ?? [];
      const sources: string[] = result.sources ?? [];
      const partial = Boolean(result.partial);
      const totalEnriched = Number(result.totalEnriched ?? 0);
      setState({ data: leads, loading: false, error: null, sources, partial, totalEnriched });
      return { leads, sources };
    } catch (err) {
      setState({
        data: [],
        loading: false,
        error: err instanceof Error ? err.message : "Erro desconhecido",
        sources: [],
        partial: false,
        totalEnriched: 0,
      });
      return { leads: [], sources: [] };
    }
  };

  const reset = () => {
    setState({ data: [], loading: false, error: null, sources: [], partial: false, totalEnriched: 0 });
  };

  // Carrega um resultado salvo (histórico) sem tocar na API.
  const loadLeads = (leads: Lead[], sources: string[]) => {
    setState({ data: leads, loading: false, error: null, sources, partial: false, totalEnriched: leads.length });
  };

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    sources: state.sources,
    partial: state.partial,
    totalEnriched: state.totalEnriched,
    fetchLeads,
    loadLeads,
    reset,
  };
}

"use client";

import { useState, useEffect } from "react";
import type { Lead } from "@/types/dashboard-layout/lead.types";
import type { SearchParams } from "@/schema/search-params.schema";

interface LeadsDataState {
  data: Lead[];
  loading: boolean;
  error: string | null;
  sources: string[];
}

export function useLeadsData() {
  const [state, setState] = useState<LeadsDataState>({
    data: [],
    loading: false,
    error: null,
    sources: [],
  });

  const fetchLeads = async (
    params: SearchParams,
  ): Promise<{ leads: Lead[]; sources: string[] }> => {
    setState({ data: [], loading: true, error: null, sources: [] });

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
      setState({ data: leads, loading: false, error: null, sources });
      return { leads, sources };
    } catch (err) {
      setState({
        data: [],
        loading: false,
        error: err instanceof Error ? err.message : "Erro desconhecido",
        sources: [],
      });
      return { leads: [], sources: [] };
    }
  };

  const reset = () => {
    setState({ data: [], loading: false, error: null, sources: [] });
  };

  // Carrega um resultado salvo (histórico) sem tocar na API.
  const loadLeads = (leads: Lead[], sources: string[]) => {
    setState({ data: leads, loading: false, error: null, sources });
  };

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    sources: state.sources,
    fetchLeads,
    loadLeads,
    reset,
  };
}

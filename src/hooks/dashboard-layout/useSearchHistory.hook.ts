"use client";

import { useCallback, useEffect, useState } from "react";
import type { SearchParams } from "@/schema/search-params.schema";
import type { Lead } from "@/types/dashboard-layout/lead.types";

export interface SearchHistoryEntry {
  id: string;
  location: string;
  radius: string;
  niche: string;
  total: number;
  withoutSite: number;
  timestamp: number;
  // Resultado completo salvo — permite reabrir a tabela sem nova consulta às
  // APIs (economiza crédito). Pode ser removido pelo controle de cota.
  leads: Lead[];
  sources: string[];
}

const STORAGE_KEY = "maphunter:search-history";
const MAX_ENTRIES = 3;
const EVENT_NAME = "maphunter:history-updated";

function readHistory(): SearchHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Retrocompatibilidade: entradas antigas sem leads/sources.
    return parsed.map((e) => ({
      ...e,
      leads: Array.isArray(e.leads) ? e.leads : [],
      sources: Array.isArray(e.sources) ? e.sources : [],
    }));
  } catch {
    return [];
  }
}

// Lê uma única entrada por id (usado ao clicar num card do histórico).
export function getHistoryEntry(id: string): SearchHistoryEntry | null {
  return readHistory().find((e) => e.id === id) ?? null;
}

// Persiste com tratamento de cota: se o localStorage estourar (muitos leads),
// mantém os metadados e descarta os leads das entradas mais antigas.
function writeHistory(entries: SearchHistoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    const trimmed = entries.map((e, i) =>
      i === 0 ? e : { ...e, leads: [] },
    );
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // Último recurso: só metadados, sem nenhum lead.
      const metaOnly = entries.map((e) => ({ ...e, leads: [] }));
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(metaOnly));
      } catch {
        // desiste silenciosamente — histórico é best-effort
      }
    }
  }
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);

  // Load + subscribe to updates (cross-component sync)
  useEffect(() => {
    setHistory(readHistory());

    const sync = () => setHistory(readHistory());
    window.addEventListener(EVENT_NAME, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT_NAME, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const addSearch = useCallback(
    (
      params: SearchParams,
      result: { leads: Lead[]; sources: string[]; withoutSite: number },
    ) => {
      const entry: SearchHistoryEntry = {
        id: `${Date.now()}`,
        location: params.location,
        radius: params.radius,
        niche: params.niche ?? "",
        total: result.leads.length,
        withoutSite: result.withoutSite,
        timestamp: Date.now(),
        leads: result.leads,
        sources: result.sources,
      };

      const current = readHistory();
      // De-dupe by location+radius+niche, newest first, cap at MAX_ENTRIES
      const deduped = current.filter(
        (e) =>
          !(
            e.location === entry.location &&
            e.radius === entry.radius &&
            e.niche === entry.niche
          ),
      );
      const next = [entry, ...deduped].slice(0, MAX_ENTRIES);
      writeHistory(next);
      setHistory(next);
    },
    [],
  );

  const clearHistory = useCallback(() => {
    writeHistory([]);
    setHistory([]);
  }, []);

  return { history, addSearch, clearHistory };
}

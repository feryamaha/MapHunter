"use client";

import { useState, useMemo } from "react";
import type { Lead } from "@/types/dashboard-layout/lead.types";

export type FilterType =
  | "all"
  | "with-site"
  | "no-site"
  | "with-phone"
  | "with-instagram"
  | "with-cnpj"
  | "no-cnpj"
  | "no-data";

export const presenceFilterOptions: { value: FilterType; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "with-site", label: "Com site" },
  { value: "no-site", label: "Sem site" },
  { value: "with-phone", label: "Com telefone" },
  { value: "with-instagram", label: "Com Instagram" },
  { value: "with-cnpj", label: "Com CNPJ" },
  { value: "no-cnpj", label: "Sem CNPJ" },
  { value: "no-data", label: "Sem dados (site/tel/insta)" },
];

const hasValue = (v: string | null | undefined) => !!v && v.trim() !== "";

// Accent-insensitive, lowercased normalization for free-text matching
const normalizeText = (v: string) =>
  v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export function useLeadsFilters(leads: Lead[]) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Unique categories present in the current result set
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const lead of leads) {
      if (lead.category) set.add(lead.category);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const term = normalizeText(searchTerm.trim());

    return leads.filter((lead) => {
      // Category filter
      if (activeCategory !== "all" && lead.category !== activeCategory) {
        return false;
      }

      // Free-text search: match against name AND category
      if (term) {
        const haystack = normalizeText(
          `${lead.name} ${lead.category ?? ""}`,
        );
        if (!haystack.includes(term)) return false;
      }

      // Presence filter
      switch (activeFilter) {
        case "with-site":
          return hasValue(lead.website);
        case "no-site":
          return !hasValue(lead.website);
        case "with-phone":
          return hasValue(lead.phone);
        case "with-instagram":
          return hasValue(lead.instagram);
        case "with-cnpj":
          return hasValue(lead.cnpj);
        case "no-cnpj":
          return !hasValue(lead.cnpj);
        case "no-data":
          return (
            !hasValue(lead.website) &&
            !hasValue(lead.phone) &&
            !hasValue(lead.instagram)
          );
        default:
          return true;
      }
    });
  }, [leads, activeFilter, activeCategory, searchTerm]);

  const activeFilterLabel =
    presenceFilterOptions.find((o) => o.value === activeFilter)?.label ?? "Todos";

  return {
    activeFilter,
    setActiveFilter,
    activeFilterLabel,
    activeCategory,
    setActiveCategory,
    categories,
    searchTerm,
    setSearchTerm,
    filteredLeads,
  };
}

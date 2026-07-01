import type { Lead } from "@/types/dashboard-layout/lead.types";
import { maskCnpj, maskPhone } from "@/utils/lead-formatters.helpers";

const CSV_HEADERS = [
  "Nome",
  "Categoria",
  "CNPJ",
  "Telefone",
  "E-mail",
  "Website",
  "Instagram",
  "Endereço",
  "Situação",
  "Razão Social",
  "Nome Fantasia",
  "CNAE",
  "Porte",
  "Natureza Jurídica",
  "Capital Social",
  "Abertura",
  "Sócios",
];

function escapeCsvValue(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatCapital(value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : iso;
}

export function exportToCsv(leads: Lead[]): string {
  const rows = leads.map((lead) => {
    const d = lead.cnpjDetails;
    return [
      lead.name,
      lead.category ?? "",
      maskCnpj(lead.cnpj),
      maskPhone(lead.phone),
      lead.email,
      lead.website ?? "",
      lead.instagram ?? "",
      lead.address,
      lead.situation ?? "",
      d?.razaoSocial ?? "",
      d?.nomeFantasia ?? "",
      d?.cnae ?? "",
      d?.porte ?? "",
      d?.naturezaJuridica ?? "",
      formatCapital(d?.capitalSocial),
      formatDate(d?.openingDate),
      d?.partners.map((p) => p.name).join("; ") ?? "",
    ]
      .map(escapeCsvValue)
      .join(",");
  });

  return [CSV_HEADERS.join(","), ...rows].join("\n");
}

export function downloadCsv(leads: Lead[], filename = "maphunter-leads.csv") {
  const csv = exportToCsv(leads);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

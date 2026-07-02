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

// Excel pt-BR usa ";" como separador de lista — CSV com vírgula abre tudo numa
// coluna só. O ";" também evita conflito com vírgulas de endereços/nomes.
const SEPARATOR = ";";

function escapeCsvValue(value: string): string {
  if (
    value.includes(SEPARATOR) ||
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n")
  ) {
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

export function leadToExportRow(lead: Lead): string[] {
  const d = lead.cnpjDetails;
  return [
    lead.name,
    lead.category ?? "",
    // Campos vazios exportam como "" (a máscara devolve "—" para null,
    // que sujaria a planilha e quebraria filtros no Excel).
    lead.cnpj ? maskCnpj(lead.cnpj) : "",
    lead.phone ? maskPhone(lead.phone) : "",
    lead.email ?? "",
    lead.website ?? "",
    lead.instagram ?? "",
    lead.address ?? "",
    lead.situation ?? "",
    d?.razaoSocial ?? "",
    d?.nomeFantasia ?? "",
    d?.cnae ?? "",
    d?.porte ?? "",
    d?.naturezaJuridica ?? "",
    formatCapital(d?.capitalSocial),
    formatDate(d?.openingDate),
    d?.partners.map((p) => p.name).join("; ") ?? "",
  ];
}

export { CSV_HEADERS as EXPORT_HEADERS };

export function exportToCsv(leads: Lead[]): string {
  const rows = leads.map((lead) =>
    leadToExportRow(lead).map(escapeCsvValue).join(SEPARATOR),
  );
  // \r\n: fim de linha esperado pelo Excel no Windows (RFC 4180).
  return [CSV_HEADERS.join(SEPARATOR), ...rows].join("\r\n");
}

export function downloadCsv(leads: Lead[], filename = "maphunter-leads.csv") {
  const csv = exportToCsv(leads);
  // BOM UTF-8 (\uFEFF): sem ele o Excel assume Windows-1252 e corrompe
  // acentos/ç ("São Paulo" vira "SÃ£o Paulo").
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

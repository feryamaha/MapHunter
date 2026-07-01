import type { Lead } from "@/types/dashboard-layout/lead.types";
import { maskCnpj, maskPhone } from "@/utils/lead-formatters.helpers";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const COLUMN_WIDTHS = [
  { width: 200 },
  { width: 120 },
  { width: 140 },
  { width: 140 },
  { width: 200 },
  { width: 200 },
  { width: 200 },
  { width: 250 },
  { width: 100 },
  { width: 220 },
  { width: 180 },
  { width: 220 },
  { width: 140 },
  { width: 200 },
  { width: 140 },
  { width: 110 },
  { width: 280 },
];

const HEADERS = [
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

export function exportToXlsx(leads: Lead[]): string {
  const headerCells = HEADERS.map((header, i) => {
    const width = COLUMN_WIDTHS[i]?.width ?? 100;
    return `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`;
  }).join("");

  const dataRows = leads
    .map((lead) => {
      const d = lead.cnpjDetails;
      const values = [
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
      ];

      const cells = values
        .map(
          (value) =>
            `<Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`,
        )
        .join("");

      return `<Row>${cells}</Row>`;
    })
    .join("");

  const colDefinitions = COLUMN_WIDTHS.map(
    (col) => `<Column ss:Width="${col.width}"/>`,
  ).join("");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1"/>
   <Interior ss:Color="#F0F0F0" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Leads">
  <Table>
   ${colDefinitions}
   <Row ss:StyleID="Header">${headerCells}</Row>
   ${dataRows}
  </Table>
 </Worksheet>
</Workbook>`;
}

export function downloadXlsx(leads: Lead[], filename = "maphunter-leads.xlsx") {
  const xml = exportToXlsx(leads);
  const blob = new Blob([xml], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

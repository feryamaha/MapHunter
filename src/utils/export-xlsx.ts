import { zipSync, strToU8 } from "fflate";
import type { Lead } from "@/types/dashboard-layout/lead.types";
import { EXPORT_HEADERS, leadToExportRow } from "@/utils/export-csv";

// ─── Exportação XLSX (Office Open XML de verdade) ─────────────────────────────
//
// A versão anterior gerava SpreadsheetML 2003 (XML puro) com extensão .xlsx —
// o Excel exibia o aviso "formato e extensão não correspondem" e o LibreOffice
// nem abria. Um .xlsx real é um ZIP com XMLs do padrão OpenXML; aqui montamos o
// pacote mínimo (workbook + worksheet + styles) com a fflate, sem depender de
// bibliotecas pesadas. UTF-8 é nativo do formato: acentos e ç nunca corrompem.

// Largura das colunas em "caracteres" (unidade do OpenXML ≈ px / 7).
const COLUMN_WIDTHS = [30, 18, 20, 18, 28, 30, 28, 38, 12, 32, 26, 32, 20, 28, 18, 14, 40];

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Remove caracteres de controle proibidos no XML 1.0 (podem vir de dados sujos
// de scraping e corromperiam o arquivo).
function sanitize(value: string): string {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: filtro intencional
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

function cell(value: string, styleId?: number): string {
  const s = styleId ? ` s="${styleId}"` : "";
  if (value === "") return `<c${s}/>`;
  return `<c${s} t="inlineStr"><is><t xml:space="preserve">${escapeXml(sanitize(value))}</t></is></c>`;
}

function buildSheetXml(rows: string[][]): string {
  const cols = COLUMN_WIDTHS.map(
    (w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`,
  ).join("");

  const headerRow = `<row r="1">${EXPORT_HEADERS.map((h) => cell(h, 1)).join("")}</row>`;
  const dataRows = rows
    .map((r, i) => `<row r="${i + 2}">${r.map((v) => cell(v)).join("")}</row>`)
    .join("");

  // Coluna final = letra(s) da última coluna para o autofiltro do cabeçalho.
  const lastCol = String.fromCharCode(64 + ((EXPORT_HEADERS.length - 1) % 26) + 1);
  const lastColRef =
    EXPORT_HEADERS.length > 26
      ? `A${String.fromCharCode(64 + EXPORT_HEADERS.length - 26)}`
      : lastCol;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<cols>${cols}</cols>
<sheetData>${headerRow}${dataRows}</sheetData>
<autoFilter ref="A1:${lastColRef}${rows.length + 1}"/>
</worksheet>`;
}

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="2">
<font><sz val="11"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color rgb="FF142E54"/><name val="Calibri"/></font>
</fonts>
<fills count="3">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFF5F8FC"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="2">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
</cellXfs>
</styleSheet>`;

const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

const ROOT_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

const WORKBOOK_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="Leads" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;

const WORKBOOK_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

export function exportToXlsx(leads: Lead[]): Uint8Array {
  const rows = leads.map((lead) => leadToExportRow(lead));
  return zipSync({
    "[Content_Types].xml": strToU8(CONTENT_TYPES_XML),
    "_rels/.rels": strToU8(ROOT_RELS_XML),
    "xl/workbook.xml": strToU8(WORKBOOK_XML),
    "xl/_rels/workbook.xml.rels": strToU8(WORKBOOK_RELS_XML),
    "xl/styles.xml": strToU8(STYLES_XML),
    "xl/worksheets/sheet1.xml": strToU8(buildSheetXml(rows)),
  });
}

export function downloadXlsx(leads: Lead[], filename = "maphunter-leads.xlsx") {
  const bytes = exportToXlsx(leads);
  const blob = new Blob([bytes as BlobPart], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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

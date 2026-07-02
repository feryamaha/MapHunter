"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import { Icon } from "@/script/Icon";
import { Pagination } from "@/components/ui/Pagination";
import {
  Table,
  TableContainer,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/ui-table";
import type { Lead } from "@/types/dashboard-layout/lead.types";
import { maskCnpj, maskPhone } from "@/utils/lead-formatters.helpers";

interface LeadsTableProps {
  leads: Lead[];
  className?: string;
}

function prettyUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function instagramHandle(url: string): string {
  const match = url.match(/instagram\.com\/([^/?#]+)/i);
  return match ? `@${match[1]}` : url.replace(/^https?:\/\//, "");
}

const EmptyDash = () => <span className="text-neutral-300">—</span>;

// Grid da tabela (desktop): larguras equilibradas + coluna de detalhes.
const gridCols =
  "grid grid-cols-[40px_minmax(190px,1.5fr)_140px_172px_minmax(170px,1.3fr)_178px_minmax(150px,1.1fr)_150px] items-center gap-[14px] px-[18px]";

// Cor do indicador de situação (bolinha) por status da Receita.
function situationDotClass(situation: string | null): string {
  switch (situation) {
    case "ATIVA":
      return "bg-complementary-500";
    case "SUSPENSA":
      return "bg-auxiliary-warning-default";
    case "INAPTA":
    case "BAIXADA":
      return "bg-auxiliary-danger-default";
    default:
      return "bg-neutral-300";
  }
}

function formatCurrency(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  return iso;
}

const situationStyles: Record<string, string> = {
  ATIVA: "bg-complementary-50 text-complementary-700",
  SUSPENSA: "bg-auxiliary-warning-background text-auxiliary-warning-dark",
  INAPTA: "bg-auxiliary-danger-background text-auxiliary-danger-dark",
  BAIXADA: "bg-auxiliary-danger-background text-auxiliary-danger-dark",
  NULA: "bg-secondary-100 text-neutral-600",
};

function DetailField({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-IbmPlexMono text-[10.5px] font-medium uppercase tracking-[0.05em] text-neutral-400">
        {label}
      </span>
      <span className="font-inter text-sm text-neutral-800 break-words">
        {value || <EmptyDash />}
      </span>
    </div>
  );
}

function CnpjDetailsPanel({ lead }: { lead: Lead }) {
  const d = lead.cnpjDetails;
  if (!d) {
    return (
      <div className="bg-surface-detail-panel border-t border-surface-detail-border px-6 py-4 font-inter text-sm text-neutral-500">
        Nenhum dado de CNPJ encontrado para esta empresa na Receita Federal
        (via BrasilAPI).
      </div>
    );
  }

  return (
    <div className="bg-surface-detail-panel border-t border-surface-detail-border px-6 py-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="font-lato text-sm font-bold text-neutral-900">
          {d.razaoSocial ?? lead.name}
        </span>
        <span className="font-IbmPlexMono text-xs text-neutral-500">
          {maskCnpj(d.cnpj)}
        </span>
        {d.situation && (
          <span
            className={twMerge(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
              situationStyles[d.situation] ?? "bg-secondary-100 text-neutral-600",
            )}
          >
            {d.situation}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4 @tablet:grid-cols-3 @laptop:grid-cols-4">
        <DetailField label="Nome fantasia" value={d.nomeFantasia} />
        <DetailField label="Atividade (CNAE)" value={d.cnae} />
        <DetailField label="Porte" value={d.porte} />
        <DetailField label="Natureza jurídica" value={d.naturezaJuridica} />
        <DetailField
          label="Capital social"
          value={formatCurrency(d.capitalSocial)}
        />
        <DetailField label="Abertura" value={formatDate(d.openingDate)} />
        <DetailField
          label="Situação desde"
          value={formatDate(d.situationDate)}
        />
        <DetailField
          label="Telefone (Receita)"
          value={d.phone ? maskPhone(d.phone) : null}
        />
        <DetailField label="E-mail (Receita)" value={d.email} />
        <DetailField label="CEP" value={d.cep} />
        <DetailField
          label="Município / UF"
          value={
            d.city || d.state
              ? `${d.city ?? ""}${d.city && d.state ? " / " : ""}${d.state ?? ""}`
              : null
          }
        />
        <DetailField label="Endereço (Receita)" value={d.address} />
      </div>

      {d.secondaryCnaes.length > 0 && (
        <div className="mt-4">
          <span className="font-IbmPlexMono text-[10.5px] font-medium uppercase tracking-[0.05em] text-neutral-400">
            Atividades secundárias
          </span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {d.secondaryCnaes.map((cnae, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full bg-secondary-100 px-2 py-0.5 text-xs text-neutral-600"
              >
                {cnae}
              </span>
            ))}
          </div>
        </div>
      )}

      {d.partners.length > 0 && (
        <div className="mt-4">
          <span className="font-IbmPlexMono text-[10.5px] font-medium uppercase tracking-[0.05em] text-neutral-400">
            Quadro societário
          </span>
          <ul className="mt-1 flex flex-col gap-1">
            {d.partners.map((p, i) => (
              <li key={i} className="font-inter text-sm text-neutral-800">
                {p.name}
                {p.qualification && (
                  <span className="text-neutral-400"> — {p.qualification}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Links de contato reutilizados na tabela e nos cards mobile. */
function WhatsappLink({ phone }: { phone: string }) {
  return (
    <a
      href={`https://wa.me/${phone.replace(/\D/g, "")}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-complementary-700 hover:text-complementary-800 font-semibold whitespace-nowrap"
    >
      <Icon name="iconWhatsapp" className="w-4 h-4 shrink-0" />
      <span className="font-IbmPlexMono text-[12.5px]">{maskPhone(phone)}</span>
    </a>
  );
}

// Card usado no layout mobile (abaixo de @tablet).
function LeadCard({
  lead,
  isOpen,
  onToggle,
}: {
  lead: Lead;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-[15px] border border-stroke-100 bg-white shadow-10 overflow-hidden">
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start gap-2.5">
          <span
            className={twMerge(
              "mt-[5px] w-[9px] h-[9px] shrink-0 rounded-full",
              situationDotClass(lead.situation),
            )}
          />
          <div className="flex-1 min-w-0">
            <div className="font-lato font-bold text-[15px] leading-tight text-neutral-900">
              {lead.name}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {lead.category && (
                <span className="rounded-full bg-primary-25 px-2.5 py-0.5 text-[11.5px] font-medium text-primary-400 capitalize">
                  {lead.category}
                </span>
              )}
              {lead.cnpj && (
                <span className="font-IbmPlexMono text-[11.5px] text-neutral-400">
                  {maskCnpj(lead.cnpj)}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onToggle}
            aria-label={isOpen ? "Recolher detalhes" : "Expandir detalhes"}
            aria-expanded={isOpen}
            className="shrink-0 flex h-[30px] w-[30px] items-center justify-center rounded-[9px] border border-stroke-100 bg-secondary-50 text-neutral-500 hover:bg-primary-25 hover:text-primary-500"
          >
            <Icon
              name="iconArrow2Down"
              className={twMerge("h-4 w-4 transition-transform", isOpen && "rotate-180")}
            />
          </button>
        </div>

        <div className="flex items-start gap-2 text-neutral-600 text-[12.5px]">
          <Icon name="iconSearch" className="w-3.5 h-3.5 mt-0.5 shrink-0 text-neutral-300" />
          <span>{lead.address || "—"}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {lead.phone && (
            <a
              href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-[9px] bg-complementary-25 px-3 py-1.5 text-[12.5px] font-semibold text-complementary-700"
            >
              <Icon name="iconWhatsapp" className="w-3.5 h-3.5" />
              WhatsApp
            </a>
          )}
          {lead.website && (
            <a
              href={lead.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-[9px] bg-primary-25 px-3 py-1.5 text-[12.5px] font-medium text-primary-500"
            >
              <Icon name="iconWebsite" className="w-3.5 h-3.5" />
              Site
            </a>
          )}
          {lead.instagram && (
            <a
              href={lead.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-[9px] bg-pink-50 px-3 py-1.5 text-[12.5px] font-medium text-pink-600"
            >
              <Icon name="iconInstagram" className="w-3.5 h-3.5" />
              Instagram
            </a>
          )}
        </div>
      </div>
      {isOpen && <CnpjDetailsPanel lead={lead} />}
    </div>
  );
}

export function LeadsTable({ leads, className }: LeadsTableProps) {
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Reset to first page whenever the dataset changes size (new search/filter)
  useEffect(() => {
    setPage(1);
    setExpanded(new Set());
  }, [leads.length]);

  const pageLeads = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return leads.slice(start, start + itemsPerPage);
  }, [leads, page, itemsPerPage]);

  if (leads.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-neutral-500 font-inter text-sm">
        Nenhum lead encontrado. Use a barra de pesquisa para começar.
      </div>
    );
  }

  return (
    <div
      className={twMerge(
        clsx("rounded-2xl border border-stroke-100 bg-white shadow-10 overflow-hidden"),
        className,
      )}
    >
      {/* ─── Layout mobile: cards empilhados (abaixo de @tablet) ─── */}
      <div className="@tablet:hidden flex flex-col gap-3 p-3 bg-secondary-25">
        {pageLeads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            isOpen={expanded.has(lead.id)}
            onToggle={() => toggleExpanded(lead.id)}
          />
        ))}
      </div>

      {/* ─── Layout tablet/desktop: tabela em grid ─── */}
      <div className="hidden @tablet:block">
        <TableContainer className="overflow-x-auto overflow-y-auto max-h-[62vh]">
          <Table className="min-w-[1140px]">
            <TableHeader sticky>
              <TableRow
                className={twMerge(
                  gridCols,
                  "bg-surface-table-header hover:bg-surface-table-header border-b border-stroke-100",
                )}
              >
                <TableHead className="text-center font-IbmPlexMono text-[11px] tracking-[0.05em] uppercase text-neutral-500 font-semibold">
                  <span className="sr-only">Detalhes</span>
                </TableHead>
                <TableHead className="font-IbmPlexMono text-[11px] tracking-[0.05em] uppercase text-neutral-500 font-semibold">Empresa</TableHead>
                <TableHead className="font-IbmPlexMono text-[11px] tracking-[0.05em] uppercase text-neutral-500 font-semibold">Categoria</TableHead>
                <TableHead className="font-IbmPlexMono text-[11px] tracking-[0.05em] uppercase text-neutral-500 font-semibold">CNPJ</TableHead>
                <TableHead className="font-IbmPlexMono text-[11px] tracking-[0.05em] uppercase text-neutral-500 font-semibold">Endereço</TableHead>
                <TableHead className="font-IbmPlexMono text-[11px] tracking-[0.05em] uppercase text-neutral-500 font-semibold">Contato</TableHead>
                <TableHead className="font-IbmPlexMono text-[11px] tracking-[0.05em] uppercase text-neutral-500 font-semibold">Website</TableHead>
                <TableHead className="font-IbmPlexMono text-[11px] tracking-[0.05em] uppercase text-neutral-500 font-semibold">Instagram</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="border-b-0">
              {pageLeads.map((lead) => {
                const isOpen = expanded.has(lead.id);
                return (
                  <div key={lead.id} className="border-b border-surface-table-divider last:border-b-0">
                    <TableRow
                      className={twMerge(
                        gridCols,
                        "transition-colors hover:bg-surface-table-hover",
                        isOpen && "bg-surface-table-hover",
                      )}
                    >
                      <TableCell className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(lead.id)}
                          aria-label={isOpen ? "Recolher detalhes" : "Expandir detalhes"}
                          aria-expanded={isOpen}
                          className={twMerge(
                            "flex h-[30px] w-[30px] items-center justify-center rounded-[9px] border transition-colors",
                            isOpen
                              ? "border-primary-100 bg-primary-50 text-primary-500"
                              : "border-stroke-100 bg-secondary-50 text-neutral-500 hover:bg-primary-25 hover:text-primary-500",
                          )}
                        >
                          <Icon
                            name="iconArrow2Down"
                            className={twMerge(
                              "h-4 w-4 transition-transform",
                              isOpen && "rotate-180",
                            )}
                          />
                        </button>
                      </TableCell>

                      <TableCell className="min-w-0" truncate>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={twMerge(
                              "w-2 h-2 shrink-0 rounded-full",
                              situationDotClass(lead.situation),
                            )}
                          />
                          <span className="truncate font-semibold text-neutral-900">
                            {lead.name}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="truncate" truncate>
                        {lead.category ? (
                          <span className="inline-flex items-center rounded-full bg-primary-25 px-2.5 py-0.5 text-xs font-medium text-primary-400 capitalize">
                            {lead.category}
                          </span>
                        ) : (
                          <EmptyDash />
                        )}
                      </TableCell>

                      <TableCell className="truncate font-IbmPlexMono text-[12.5px] text-neutral-600" truncate>
                        {lead.cnpj ? (
                          <span title={maskCnpj(lead.cnpj)}>{maskCnpj(lead.cnpj)}</span>
                        ) : (
                          <EmptyDash />
                        )}
                      </TableCell>

                      <TableCell className="text-neutral-600 truncate" truncate>
                        {lead.address || <EmptyDash />}
                      </TableCell>

                      <TableCell>
                        {lead.phone ? (
                          <WhatsappLink phone={lead.phone} />
                        ) : (
                          <EmptyDash />
                        )}
                      </TableCell>

                      <TableCell className="truncate" truncate>
                        {lead.website ? (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-primary-500 hover:text-primary-600 hover:underline truncate"
                            title={lead.website}
                          >
                            <Icon name="iconWebsite" className="w-4 h-4 shrink-0" />
                            <span className="truncate">{prettyUrl(lead.website)}</span>
                          </a>
                        ) : (
                          <EmptyDash />
                        )}
                      </TableCell>

                      <TableCell className="truncate" truncate>
                        {lead.instagram ? (
                          <a
                            href={lead.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-pink-600 hover:text-pink-700 hover:underline truncate"
                            title={lead.instagram}
                          >
                            <Icon name="iconInstagram" className="w-4 h-4 shrink-0" />
                            <span className="truncate">
                              {instagramHandle(lead.instagram)}
                            </span>
                          </a>
                        ) : (
                          <EmptyDash />
                        )}
                      </TableCell>
                    </TableRow>
                    {isOpen && <CnpjDetailsPanel lead={lead} />}
                  </div>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      <div className="border-t border-stroke-100">
        <Pagination
          totalItems={leads.length}
          page={page}
          itemsPerPage={itemsPerPage}
          onChange={(_, p) => setPage(p)}
          onItemsPerPageChange={(n) => {
            setItemsPerPage(n);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}

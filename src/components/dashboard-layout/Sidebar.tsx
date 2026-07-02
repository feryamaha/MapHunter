"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import { Icon } from "@/script/Icon";
import { Logo } from "@/components/dashboard-layout/Logo";
import { sidebarNavItems } from "@/data/dashboard-layout/sidebar-config";
import { useSearchHistory } from "@/hooks/dashboard-layout/useSearchHistory.hook";

export function Sidebar() {
  const pathname = usePathname();
  const { history, clearHistory } = useSearchHistory();

  return (
    <aside className="hidden @tablet:flex w-[264px] shrink-0 flex-col h-full overflow-hidden bg-gradient-to-b from-primary-600 to-sidebar-gradient-end">
      <div className="flex items-center px-[22px] h-[66px] shrink-0">
        <Logo variant="light" size={30} />
      </div>

      <div className="px-[14px] pt-1">
        <p className="font-IbmPlexMono text-[10.5px] tracking-[0.09em] uppercase text-sidebar-text-label px-[10px] pb-2 pt-3">
          Menu
        </p>
        <nav className="flex flex-col gap-[3px]">
          {sidebarNavItems.map((item) => {
            const isActive = pathname === item.href;

            const linkClasses = twMerge(
              clsx(
                "flex items-center gap-3 px-3 py-[11px] rounded-[11px] font-inter text-sm transition-colors",
                isActive
                  ? "font-semibold text-primary-25 bg-complementary-400/15 border-l-[3px] border-complementary-400"
                  : "font-medium text-sidebar-text-inactive hover:bg-white/[0.06] hover:text-primary-25",
              ),
            );

            return (
              <Link key={item.href} href={item.href} className={linkClasses}>
                <Icon
                  name={item.iconName}
                  className={isActive ? "w-[19px] h-[19px] text-complementary-400" : "w-[19px] h-[19px]"}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto px-[14px] pb-4 pt-2 min-h-0">
        <div className="flex items-center justify-between px-[10px] pt-3 pb-2">
          <span className="font-IbmPlexMono text-[10.5px] tracking-[0.09em] uppercase text-sidebar-text-label">
            Últimas pesquisas
          </span>
          {history.length > 0 && (
            <button
              type="button"
              onClick={clearHistory}
              className="text-[11px] text-sidebar-text-label hover:text-sidebar-danger-hover transition-colors"
            >
              limpar
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <p className="px-[10px] pt-1 font-inter text-[11.5px] text-sidebar-text-muted">
            Suas 3 buscas mais recentes aparecerão aqui.
          </p>
        ) : (
          <ul className="flex flex-col gap-[7px]">
            {history.map((entry) => {
              // Abre o resultado SALVO (sem nova consulta às APIs). O fallback
              // para re-busca por location fica só se a entrada não tiver leads.
              const query =
                entry.leads.length > 0
                  ? `historyId=${encodeURIComponent(entry.id)}`
                  : (() => {
                      const p = new URLSearchParams({
                        location: entry.location,
                        radius: entry.radius,
                      });
                      if (entry.niche) p.set("niche", entry.niche);
                      return p.toString();
                    })();

              return (
                <li key={entry.id}>
                  <Link
                    href={`/dashboard?${query}`}
                    className="group flex flex-col gap-[3px] rounded-[11px] border border-white/[0.08] bg-white/[0.03] px-3 py-[10px] transition-colors hover:bg-white/[0.07] hover:border-complementary-400/40"
                  >
                    <span className="truncate font-inter text-[13px] font-semibold text-sidebar-text">
                      {entry.location}
                    </span>
                    <span className="truncate font-inter text-[11.5px] text-sidebar-text-muted">
                      {entry.niche ? `${entry.niche} · ` : ""}
                      {entry.radius}km · {entry.total} leads
                    </span>
                    <span className="flex items-center gap-[5px] font-inter text-[11px] text-sidebar-danger-text">
                      <span className="inline-block w-[5px] h-[5px] rounded-full bg-sidebar-danger" />
                      {entry.withoutSite} sem site
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-white/[0.08] px-[18px] py-[13px] flex items-center gap-[11px]">
        <div className="w-[34px] h-[34px] shrink-0 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center font-lato font-bold text-[13px] text-primary-25">
          FM
        </div>
        <div className="min-w-0 leading-tight">
          <div className="truncate font-inter text-[13px] font-semibold text-sidebar-text">
            Fernando Moreira
          </div>
          <div className="font-inter text-[11px] text-sidebar-text-muted">Plano Prospector</div>
        </div>
      </div>
    </aside>
  );
}

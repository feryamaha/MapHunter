"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import { Icon } from "@/script/Icon";
import { sidebarNavItems } from "@/data/dashboard-layout/sidebar-config";
import { useSearchHistory } from "@/hooks/dashboard-layout/useSearchHistory.hook";

export function Sidebar() {
  const pathname = usePathname();
  const { history, clearHistory } = useSearchHistory();

  return (
    <aside className="hidden @tablet:flex w-[240px] shrink-0 flex-col bg-white border-r border-stroke-100 h-full">
      <div className="flex items-center gap-2 px-6 h-[64px] border-b border-stroke-100">
        <span className="font-lato text-xl font-bold text-primary-600">
          MapHunter
        </span>
      </div>

      <nav className="flex flex-col gap-1 p-4">
        {sidebarNavItems.map((item) => {
          const isActive = pathname === item.href;

          const linkClasses = twMerge(
            clsx(
              "flex items-center gap-3 px-4 py-3 rounded-lg font-inter text-sm font-medium transition-colors",
              isActive
                ? "bg-primary-25 text-primary-600"
                : "text-neutral-600 hover:bg-secondary-50 hover:text-neutral-900",
            ),
          );

          return (
            <Link key={item.href} href={item.href} className={linkClasses}>
              <Icon name={item.iconName} className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="mt-2 flex items-center justify-between px-2">
          <span className="font-inter text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Últimas pesquisas
          </span>
          {history.length > 0 && (
            <button
              type="button"
              onClick={clearHistory}
              className="text-xs text-neutral-400 hover:text-danger-500 transition-colors"
            >
              limpar
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <p className="px-2 pt-2 font-inter text-xs text-neutral-400">
            Suas 3 buscas mais recentes aparecerão aqui.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1">
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
                    className="group flex flex-col gap-0.5 rounded-lg border border-stroke-100 px-3 py-2 hover:bg-secondary-50 transition-colors"
                  >
                    <span className="truncate font-inter text-sm font-medium text-neutral-800">
                      {entry.location}
                    </span>
                    <span className="truncate font-inter text-xs text-neutral-500">
                      {entry.niche ? `${entry.niche} · ` : ""}
                      {entry.radius}km · {entry.total} leads
                    </span>
                    <span className="font-inter text-xs text-danger-500">
                      {entry.withoutSite} sem site
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}

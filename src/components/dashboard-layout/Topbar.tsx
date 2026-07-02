"use client";

import { usePathname } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/dashboard-layout/Logo";

const pageTitles: Record<string, string> = {
  "/dashboard": "Buscar Leads",
};

export function Topbar() {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "MapHunter";

  return (
    <header className="flex items-center h-[66px] border-b border-stroke-100 bg-white shrink-0 z-20">
      <Container>
        <div className="flex items-center justify-between w-full gap-4">
          {/* Logo no mobile (a sidebar fica oculta) */}
          <Logo variant="dark" size={24} className="@tablet:hidden" />

          {/* Título no tablet/desktop */}
          <div className="hidden @tablet:flex flex-col leading-tight">
            <span className="font-IbmPlexMono text-[10.5px] tracking-[0.08em] uppercase text-neutral-300">
              Dashboard
            </span>
            <h1 className="font-lato text-[17px] font-bold text-neutral-900">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-3 @tablet:gap-4">
            <div className="hidden @mobile:flex items-center gap-[7px] rounded-full border border-complementary-100 bg-complementary-25 px-3 py-[5px]">
              <span className="relative inline-flex w-2 h-2">
                <span className="absolute inset-0 rounded-full bg-complementary-400 animate-ping" />
                <span className="relative w-2 h-2 rounded-full bg-complementary-500" />
              </span>
              <span className="font-IbmPlexMono text-[11px] font-medium text-complementary-700">
                APIs online
              </span>
            </div>
            <div className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center font-lato font-bold text-[13px] text-primary-25">
              FM
            </div>
          </div>
        </div>
      </Container>
    </header>
  );
}

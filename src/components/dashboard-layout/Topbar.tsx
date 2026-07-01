"use client";

import { usePathname } from "next/navigation";
import { Container } from "@/components/ui/Container";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
};

export function Topbar() {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "MapHunter";

  return (
    <header className="flex items-center h-[64px] border-b border-stroke-100 bg-white shrink-0">
      <Container>
        <div className="flex items-center justify-between w-full">
          <h1 className="font-lato text-lg font-bold text-neutral-900">
            {title}
          </h1>
          <div className="flex items-center gap-4">
            <span className="font-inter text-sm text-neutral-500">
              Bem-vindo
            </span>
          </div>
        </div>
      </Container>
    </header>
  );
}

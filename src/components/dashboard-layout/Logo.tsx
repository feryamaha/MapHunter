import { twMerge } from "tailwind-merge";

interface LogoProps {
  /** "light" = para fundos escuros (sidebar navy) · "dark" = para fundos claros */
  variant?: "light" | "dark";
  /** Exibe o wordmark "MapHunter" ao lado da marca */
  showWordmark?: boolean;
  /** Tamanho da marca (px) */
  size?: number;
  className?: string;
}

/**
 * Marca do MapHunter: pin de mapa + mira/crosshair ("a caça em mapa").
 * Auto-contida (SVG inline) — não depende de assets externos.
 */
export function Logo({
  variant = "dark",
  showWordmark = true,
  size = 30,
  className,
}: LogoProps) {
  const isLight = variant === "light";

  return (
    <span className={twMerge("inline-flex items-center gap-[9px]", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        aria-label="MapHunter"
        role="img"
      >
        <path
          d="M16 3C10.5 3 6 7.4 6 12.9c0 6.8 8.5 15 9.3 15.8a1 1 0 0 0 1.4 0C17.5 27.9 26 19.7 26 12.9 26 7.4 21.5 3 16 3Z"
          className={isLight ? "fill-primary-400" : "fill-primary-500"}
        />
        <circle cx="16" cy="13" r="6.4" className="fill-primary-800" />
        <circle
          cx="16"
          cy="13"
          r="6.4"
          className={isLight ? "stroke-complementary-400" : "stroke-complementary-500"}
          strokeWidth="1.5"
        />
        <path
          d="M16 5v3.2M16 17.8V21M8 13h3.2M20.8 13H24"
          className={isLight ? "stroke-complementary-400" : "stroke-complementary-500"}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle
          cx="16"
          cy="13"
          r="2"
          className={isLight ? "fill-complementary-300" : "fill-complementary-500"}
        />
      </svg>
      {showWordmark && (
        <span
          className="font-lato font-black tracking-[-0.4px] leading-none"
          style={{ fontSize: `${Math.round(size * 0.66)}px` }}
        >
          <span className={isLight ? "text-primary-25" : "text-primary-600"}>Map</span>
          <span className={isLight ? "text-complementary-400" : "text-complementary-500"}>
            Hunter
          </span>
        </span>
      )}
    </span>
  );
}

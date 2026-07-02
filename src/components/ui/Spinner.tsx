import { twMerge } from "tailwind-merge";

interface SpinnerProps {
  className?: string;
}

// Spinner circular em CSS puro (sem depender de ícone SVG). Herda a cor do
// texto via border-current — basta aplicar text-* no elemento ou no pai.
export function Spinner({ className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Carregando"
      className={twMerge(
        "inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
    />
  );
}

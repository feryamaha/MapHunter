// Skeleton exibido enquanto a busca de leads está em andamento. Reproduz a
// silhueta da tabela real (header + linhas) para evitar "salto" de layout e
// dar feedback visual claro de carregamento.

const SKELETON_ROWS = 8;

function SkeletonBar({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-neutral-100 ${className}`} />;
}

export function LeadsTableSkeleton() {
  return (
    <div className="rounded-2xl border border-stroke-100 bg-white shadow-10 overflow-hidden">
      <div className="flex items-center gap-6 border-b border-stroke-100 bg-surface-table-header px-6 py-3.5">
        <SkeletonBar className="h-3 w-40" />
        <SkeletonBar className="hidden h-3 w-24 @tablet:block" />
        <SkeletonBar className="hidden h-3 w-32 @tablet:block" />
        <SkeletonBar className="hidden h-3 w-48 @laptop:block" />
        <SkeletonBar className="hidden h-3 w-28 @laptop:block" />
      </div>
      {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-6 border-b border-surface-table-divider px-6 py-4 last:border-b-0"
          style={{ opacity: 1 - i * 0.09 }}
        >
          <div className="flex items-center gap-2.5">
            <SkeletonBar className="h-2.5 w-2.5 rounded-full" />
            <SkeletonBar className="h-3.5 w-44" />
          </div>
          <SkeletonBar className="hidden h-5 w-24 rounded-full @tablet:block" />
          <SkeletonBar className="hidden h-3.5 w-32 @tablet:block" />
          <SkeletonBar className="hidden h-3.5 w-52 @laptop:block" />
          <SkeletonBar className="hidden h-3.5 w-28 @laptop:block" />
        </div>
      ))}
    </div>
  );
}

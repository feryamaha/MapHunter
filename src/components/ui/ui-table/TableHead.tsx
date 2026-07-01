import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { TableHeadProps } from '@/types/dashboard-layout/table-cell.types'

export function TableHead({
    className,
    children,
    align = 'left',
    width,
    noWrap = true,
    sortable = false,
    sortDirection,
    onSort,
    ...props
}: TableHeadProps) {
    const style = width ? { width: typeof width === 'number' ? `${width}px` : width } : undefined

    return (
        <div
            role="columnheader"
            data-slot="table-head"
            data-sortable={sortable ? 'true' : undefined}
            data-sort-direction={sortDirection}
            className={twMerge(
                clsx(
                    'h-10 px-2 font-medium text-sm text-neutral-600',
                    align === 'left' && 'text-left',
                    align === 'center' && 'text-center',
                    align === 'right' && 'text-right',
                    noWrap && 'whitespace-nowrap',
                    sortable && 'cursor-pointer hover:bg-neutral-100 select-none',
                    '[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]'
                ),
                className
            )}
            style={style}
            onClick={sortable ? onSort : undefined}
            {...props}
        >
            {children}
        </div>
    )
}

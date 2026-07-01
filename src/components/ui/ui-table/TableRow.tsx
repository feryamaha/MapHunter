import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { TableRowProps } from '@/types/dashboard-layout/table-row.types'

export function TableRow({
    className,
    children,
    selected = false,
    clickable = false,
    expandable = false,
    expanded = false,
    onClick,
    ...props
}: TableRowProps) {
    return (
        <div
            role="row"
            data-slot="table-row"
            data-state={selected ? 'selected' : undefined}
            data-expanded={expanded ? 'true' : undefined}
            className={twMerge(
                clsx(
                    'border-b transition-colors',
                    clickable && 'cursor-pointer hover:bg-neutral-50',
                    selected && 'bg-neutral-100',
                    expandable && 'group'
                ),
                className
            )}
            onClick={onClick}
            {...props}
        >
            {children}
        </div>
    )
}

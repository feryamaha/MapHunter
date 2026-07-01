import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { TableCellProps } from '@/types/dashboard-layout/table-cell.types'

export function TableCell({
    className,
    children,
    align = 'left',
    width,
    noWrap = false,
    actionable = false,
    truncate = false,
    maxLines,
    ...props
}: TableCellProps) {
    const style = {
        ...(width ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
        ...(maxLines ? {
            display: '-webkit-box',
            WebkitLineClamp: maxLines,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden'
        } : {})
    }

    return (
        <div
            role="cell"
            data-slot="table-cell"
            data-actionable={actionable ? 'true' : undefined}
            className={twMerge(
                clsx(
                    'p-2 text-sm text-neutral-900',
                    align === 'left' && 'text-left',
                    align === 'center' && 'text-center',
                    align === 'right' && 'text-right',
                    noWrap && 'whitespace-nowrap',
                    truncate && 'truncate',
                    actionable && 'cursor-pointer',
                    '[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]'
                ),
                className
            )}
            style={Object.keys(style).length > 0 ? style : undefined}
            {...props}
        >
            {children}
        </div>
    )
}

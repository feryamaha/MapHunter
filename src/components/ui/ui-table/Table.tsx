import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { TableProps, TableContainerProps } from '@/types/dashboard-layout/table.types'

export function TableContainer({ className, children, ...props }: TableContainerProps) {
    return (
        <div
            data-slot="table-container"
            className={twMerge(
                clsx('relative'),
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

export function Table({ className, children, identifier, variant = 'default', ...props }: TableProps) {
    return (
        <div
            role="table"
            data-slot="table"
            data-portal={identifier?.portal}
            data-table-id={identifier?.tableId}
            className={twMerge(
                clsx(
                    'w-full text-sm',
                    variant === 'default' && 'flex flex-col',
                    variant === 'grid' && 'flex flex-col',
                    variant === 'flex' && 'flex flex-col'
                ),
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

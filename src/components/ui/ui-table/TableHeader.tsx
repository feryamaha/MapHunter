import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { TableHeaderProps } from '@/types/dashboard-layout/table-header.types'

export function TableHeader({ className, children, sticky = false, ...props }: TableHeaderProps) {
    return (
        <div
            role="rowgroup"
            data-slot="table-header"
            className={twMerge(
                clsx(
                    '[&_[role=row]]:border-b',
                    sticky && 'sticky top-0 z-10'
                ),
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

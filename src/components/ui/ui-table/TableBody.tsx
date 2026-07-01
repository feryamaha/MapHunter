import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { TableBodyProps } from '@/types/dashboard-layout/table-body.types'

export function TableBody({ className, children, ...props }: TableBodyProps) {
    return (
        <div
            role="rowgroup"
            data-slot="table-body"
            className={twMerge(
                clsx('border-b-[0.5px] border-stroke-100'),
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { TableCaptionProps } from '@/types/dashboard-layout/table-caption.types'

export function TableCaption({
    className,
    children,
    position = 'bottom',
    ...props
}: TableCaptionProps) {
    return (
        <div
            role="caption"
            data-slot="table-caption"
            className={twMerge(
                clsx(
                    'text-neutral-500 text-sm',
                    position === 'top' && 'mb-4',
                    position === 'bottom' && 'mt-4'
                ),
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

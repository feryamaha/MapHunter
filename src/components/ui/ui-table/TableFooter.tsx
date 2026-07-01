import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Pagination } from '@/components/ui/Pagination'
import type { TableFooterProps } from '@/types/dashboard-layout/table-footer.types'

export function TableFooter({
    className,
    children,
    showPagination = false,
    totalItems,
    itemsPerPage = 10,
    currentPage,
    onPageChange,
    onItemsPerPageChange,
    itemsPerPageOptions,
    paginationDisabled = false,
    ...props
}: TableFooterProps) {
    return (
        <div
            role="rowgroup"
            data-slot="table-footer"
            className={twMerge(
                clsx('bg-white border-t font-medium'),
                className
            )}
            {...props}
        >
            {children}
            {showPagination && (
                <div role="row">
                    <div role="cell" data-colspan={100} className="w-full">
                        <Pagination
                            totalItems={totalItems}
                            itemsPerPage={itemsPerPage}
                            page={currentPage}
                            onChange={onPageChange}
                            onItemsPerPageChange={onItemsPerPageChange}
                            itemsPerPageOptions={itemsPerPageOptions}
                            disabled={paginationDisabled}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

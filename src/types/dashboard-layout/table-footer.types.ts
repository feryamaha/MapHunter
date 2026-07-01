import type { ReactNode } from 'react'

/** Props do componente TableFooter */
export interface TableFooterProps extends React.ComponentProps<'tfoot'> {
    /** Filhos do componente */
    children?: ReactNode
    /** Classes CSS adicionais */
    className?: string
    /** Se deve exibir paginação */
    showPagination?: boolean
    /** Total de itens para paginação */
    totalItems?: number
    /** Itens por página */
    itemsPerPage?: number
    /** Página atual (controlado) */
    currentPage?: number
    /** Callback quando a página muda */
    onPageChange?: (event: React.MouseEvent | null, page: number) => void
    /** Callback quando itens por página muda */
    onItemsPerPageChange?: (itemsPerPage: number) => void
    /** Opções de itens por página */
    itemsPerPageOptions?: number[]
    /** Se a paginação está desabilitada */
    paginationDisabled?: boolean
}

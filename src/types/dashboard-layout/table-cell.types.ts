import type { ReactNode } from 'react'

/** Alinhamento do conteúdo da célula */
export type TableCellAlign = 'left' | 'center' | 'right'

/** Props base compartilhadas entre TableHead e TableCell */
export interface TableCellBaseProps {
    /** Filhos do componente */
    children?: ReactNode
    /** Classes CSS adicionais */
    className?: string
    /** Alinhamento do conteúdo */
    align?: TableCellAlign
    /** Largura da coluna */
    width?: string | number
    /** Se o conteúdo não deve quebrar linha */
    noWrap?: boolean
}

/** Props do componente TableHead (célula de cabeçalho) */
export interface TableHeadProps extends TableCellBaseProps, Omit<React.ComponentProps<'th'>, 'align' | 'width'> {
    /** Se a coluna é ordenável */
    sortable?: boolean
    /** Direção da ordenação atual */
    sortDirection?: 'asc' | 'desc' | null
    /** Callback ao clicar para ordenar */
    onSort?: () => void
}

/** Props do componente TableCell (célula de dados) */
export interface TableCellProps extends TableCellBaseProps, Omit<React.ComponentProps<'td'>, 'align' | 'width'> {
    /** Se a célula contém ação clicável */
    actionable?: boolean
    /** Se a célula é truncável com ellipsis */
    truncate?: boolean
    /** Número máximo de linhas antes de truncar */
    maxLines?: number
}

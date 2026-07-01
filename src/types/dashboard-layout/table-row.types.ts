import type { ReactNode } from 'react'

/** Props do componente TableRow */
export interface TableRowProps extends React.ComponentProps<'tr'> {
    /** Filhos do componente (TableHead ou TableCell) */
    children: ReactNode
    /** Classes CSS adicionais */
    className?: string
    /** Se a linha está selecionada */
    selected?: boolean
    /** Se a linha é clicável */
    clickable?: boolean
    /** Se a linha é expansível */
    expandable?: boolean
    /** Se a linha está expandida */
    expanded?: boolean
    /** Callback ao clicar na linha */
    onClick?: (event: React.MouseEvent<HTMLTableRowElement>) => void
}

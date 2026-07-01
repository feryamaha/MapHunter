import type { ReactNode } from 'react'

/** Props do componente TableBody */
export interface TableBodyProps extends React.ComponentProps<'div'> {
    /** Filhos do componente (TableRow com TableCell) */
    children: ReactNode
    /** Classes CSS adicionais */
    className?: string
}

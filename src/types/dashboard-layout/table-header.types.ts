import type { ReactNode } from 'react'

/** Props do componente TableHeader */
export interface TableHeaderProps extends React.ComponentProps<'div'> {
    /** Filhos do componente (TableRow com TableHead) */
    children: ReactNode
    /** Classes CSS adicionais */
    className?: string
    /** Se o header deve ser sticky */
    sticky?: boolean
}

import type { ReactNode } from 'react'

/** Props do componente TableCaption */
export interface TableCaptionProps extends React.ComponentProps<'div'> {
    /** Filhos do componente (texto da legenda) */
    children: ReactNode
    /** Classes CSS adicionais */
    className?: string
    /** Posição da legenda */
    position?: 'top' | 'bottom'
}

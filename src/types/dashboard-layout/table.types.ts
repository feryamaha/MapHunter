import type { ReactNode } from 'react'

/** Slugs dos portais do sistema */
export type PortalSlug = 'beneficiario' | 'dentista' | 'comercial' | 'empresa' | 'representante'

/** IDs de tabelas do portal Dentista */
export type DentistaTableId =
    | 'modal-protocolo'
    | 'section-protocolos'
    | 'protocolos-list'
    | 'faturas'
    | 'faturas-header'
    | 'faturas-body'
    | 'arquivos-uteis'
    | 'guias'
    | 'calendario'
    | 'classificados'
    | 'arquivos-uteis'

/** IDs de tabelas do portal Beneficiário */
export type BeneficiarioTableId =
    | 'modal-protocolo'
    | 'boletos'
    | 'extrato'
    | 'guias-list'

/** IDs de tabelas do portal Comercial */
export type ComercialTableId =
    | 'modal-protocolo'
    | 'relatorios'

/** IDs de tabelas do portal Empresa */
export type EmpresaTableId =
    | 'modal-protocolo'
    | 'funcionarios'
    | 'faturas'

/** IDs de tabelas do portal Representante */
export type RepresentanteTableId =
    | 'modal-protocolo'
    | 'comissoes'
    | 'vendas'
    | 'vendedores-list'

/** Union type para todos os IDs de tabela */
export type TableId =
    | DentistaTableId
    | BeneficiarioTableId
    | ComercialTableId
    | EmpresaTableId
    | RepresentanteTableId

/** Identificador único de uma tabela no sistema */
export interface TableIdentifier {
    portal: PortalSlug
    tableId: TableId
}

/** Props do componente Table (container principal) */
export interface TableProps extends React.ComponentProps<'div'> {
    /** Identificador opcional para rastreamento */
    identifier?: TableIdentifier
    /** Filhos do componente (TableHeader, TableBody, TableFooter) */
    children: ReactNode
    /** Classes CSS adicionais */
    className?: string
    /** Variante de layout da tabela */
    variant?: 'default' | 'grid' | 'flex'
}

/** Props do container wrapper da tabela */
export interface TableContainerProps extends React.ComponentProps<'div'> {
    /** Filhos do componente */
    children: ReactNode
    /** Classes CSS adicionais */
    className?: string
}

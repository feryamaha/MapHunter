export type LeadStatus = "Sem Site" | "Sem Presença Digital" | "Inativa/Baixada" | "Ativa";

export type LeadSituation = "ATIVA" | "BAIXADA" | "INAPTA" | "SUSPENSA" | "NULA";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  website: string | null;
  instagram: string | null;
  cnpj: string | null;
  address: string;
  category: string | null;
  status: LeadStatus;
  situation: LeadSituation | null;
  placeId: string | null;
  cnpjDetails: CnpjDetails | null;
}

export interface RawLead {
  name: string;
  phone: string;
  email: string | null;
  address: string;
  website: string | null;
  instagram: string | null;
  category: string | null;
  cnpj: string | null;
  placeId: string | null;
}

export interface CnpjPartner {
  name: string;
  qualification: string | null;
}

export interface CnpjDetails {
  cnpj: string;
  razaoSocial: string | null;
  nomeFantasia: string | null;
  situation: LeadSituation | null;
  situationDate: string | null;
  openingDate: string | null;
  cnae: string | null;
  secondaryCnaes: string[];
  porte: string | null;
  naturezaJuridica: string | null;
  capitalSocial: number | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  cep: string | null;
  city: string | null;
  state: string | null;
  partners: CnpjPartner[];
}

export interface CnpjData {
  cnpj: string | null;
  email: string | null;
  situation: LeadSituation | null;
  cnae: string | null;
  details: CnpjDetails | null;
}

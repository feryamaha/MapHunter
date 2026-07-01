import type { Lead, LeadStatus, LeadSituation } from "@/types/dashboard-layout/lead.types";

export function classifyLead(params: {
  website: string | null;
  instagram: string | null;
  situation: LeadSituation | null;
}): LeadStatus {
  const { website, instagram, situation } = params;

  if (situation === "BAIXADA" || situation === "INAPTA" || situation === "SUSPENSA") {
    return "Inativa/Baixada";
  }

  const hasWebsite = website !== null && website.trim() !== "";
  const hasInstagram = instagram !== null && instagram.trim() !== "";

  if (!hasWebsite && !hasInstagram) {
    return "Sem Presença Digital";
  }

  if (!hasWebsite) {
    return "Sem Site";
  }

  return "Ativa";
}

export function applyClassification(lead: Omit<Lead, "status">): Lead {
  return {
    ...lead,
    status: classifyLead({
      website: lead.website,
      instagram: lead.instagram,
      situation: lead.situation,
    }),
  };
}

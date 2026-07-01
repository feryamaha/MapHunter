import { z } from "zod";

// Charset seguro para campos de texto livre: letras (com acento), números,
// espaço e pontuação comum de endereços/nomes. Bloqueia < > { } ; " ' ` \ etc.,
// que só apareceriam em tentativas de injeção — defesa em profundidade, já que
// esses valores alimentam URLs e queries de APIs externas.
const SAFE_TEXT = /^[\p{L}\p{N}\s.,\-/&º°ª#()]+$/u;

export const searchParamsSchema = z.object({
  location: z
    .string()
    .trim()
    .min(2, "Informe uma localização ou CEP válido")
    .max(100, "Localização muito longa")
    .regex(SAFE_TEXT, "Localização contém caracteres inválidos"),
  radius: z.enum(["1", "2", "5", "10", "20", "50", "100", "200", "500", "1000"], {
    message: "Selecione um raio válido",
  }),
  niche: z
    .string()
    .trim()
    .max(100, "Nicho muito longo")
    .regex(SAFE_TEXT, "Nicho contém caracteres inválidos")
    .optional()
    .or(z.literal("")),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;

export const radiusOptions = [
  { value: "1", label: "Até 1 km" },
  { value: "2", label: "Até 2 km" },
  { value: "5", label: "Até 5 km" },
  { value: "10", label: "Até 10 km" },
  { value: "20", label: "Até 20 km" },
  { value: "50", label: "Até 50 km" },
  { value: "100", label: "Até 100 km" },
  { value: "200", label: "Até 200 km" },
  { value: "500", label: "Até 500 km" },
  { value: "1000", label: "Até 1000 km (Nacional)" },
] as const;

const CEP_REGEX = /^\d{5}-?\d{3}$/;

export function isCep(value: string): boolean {
  return CEP_REGEX.test(value.trim());
}

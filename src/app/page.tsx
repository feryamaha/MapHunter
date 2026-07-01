import Link from "next/link";
import { Icon } from "@/script/Icon";

const features = [
  {
    icon: "iconSearch",
    title: "Busca por região",
    description:
      "Encontre empresas por localização e raio de alcance usando o Google Places.",
  },
  {
    icon: "iconLeads",
    title: "Leads qualificados",
    description:
      "Classificação automática: sem site, sem presença digital ou inativa.",
  },
  {
    icon: "iconDownload",
    title: "Exportação fácil",
    description: "Baixe seus leads em CSV ou XLSX com um clique.",
  },
];

export default function Home() {
  return (
    <div className="h-screen overflow-y-auto bg-gradient-to-b from-primary-25 via-white to-secondary-50">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white px-4 py-1.5 text-sm font-medium text-primary-600 shadow-10">
          <Icon name="iconLeads" className="h-4 w-4" />
          Minerador de Leads B2B Regional
        </span>

        <h1 className="text-center font-lato text-5xl font-bold tracking-tight text-neutral-900 @tablet:text-6xl">
          Map<span className="text-primary-600">Hunter</span>
        </h1>

        <p className="mt-5 max-w-xl text-center font-inter text-lg text-neutral-600">
          Descubra e qualifique empresas da sua região automaticamente.
          Transforme o mapa em uma lista de leads pronta para prospecção.
        </p>

        <Link
          href="/dashboard"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary-600 px-8 py-3.5 font-inter text-base font-semibold text-white shadow-10 transition-colors hover:bg-primary-700"
        >
          <Icon name="iconSearch" className="h-5 w-5" />
          Começar a buscar
        </Link>

        <div className="mt-16 grid w-full gap-5 @tablet:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col gap-3 rounded-2xl border border-stroke-100 bg-white p-6 shadow-10"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-25 text-primary-600">
                <Icon name={feature.icon} className="h-5 w-5" />
              </span>
              <h3 className="font-lato text-lg font-bold text-neutral-900">
                {feature.title}
              </h3>
              <p className="font-inter text-sm leading-relaxed text-neutral-500">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

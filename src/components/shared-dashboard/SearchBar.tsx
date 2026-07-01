"use client";

import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import { FloatingLabelInput } from "@/components/ui/FloatingLabelInput";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/script/Icon";
import { useSearchBar } from "@/hooks/dashboard-layout/useSearchBar.hook";
import { radiusOptions } from "@/schema/search-params.schema";
import type { SearchParams } from "@/schema/search-params.schema";

interface SearchBarProps {
  onSubmit?: (data: SearchParams) => void;
  defaults?: Partial<SearchParams>;
  className?: string;
}

export function SearchBar({ onSubmit, defaults, className }: SearchBarProps) {
  const { register, errors, handleSubmit, isSearching } = useSearchBar(
    onSubmit,
    defaults,
  );

  const fieldClasses = "border-0 rounded-none bg-transparent focus:ring-0 h-14 px-5 hover:border-0";

  return (
    <form
      onSubmit={handleSubmit}
      className={twMerge(
        clsx(
          "flex flex-col @tablet:flex-row items-stretch",
          "bg-white rounded-3xl @tablet:rounded-full shadow-10 p-2",
          "border border-stroke-100",
        ),
        className,
      )}
    >
      <div className="flex-1 min-w-0 flex items-center @tablet:pl-2">
        <Icon
          name="iconSearch"
          className="w-5 h-5 text-neutral-400 shrink-0 ml-3 @tablet:ml-0"
        />
        <FloatingLabelInput
          label="Cidade ou CEP (ex: 01310-100)"
          name="location"
          register={register}
          errors={errors}
          validation={{ required: "Localização é obrigatória" }}
          disableLabelFloat
          mask="cepOrCity"
          className="flex-1"
          inputClassName={fieldClasses}
        />
      </div>

      <div className="hidden @tablet:block w-px bg-stroke-100 my-2" />

      <div className="relative w-full @tablet:w-[220px] shrink-0">
        <select
          {...register("radius")}
          aria-label="Raio de alcance"
          className={twMerge(
            clsx(
              "w-full h-14 pl-5 pr-10 text-sm font-inter text-neutral-900",
              "border-0 bg-transparent rounded-none cursor-pointer",
              "focus:outline-none appearance-none",
            ),
          )}
        >
          {radiusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Icon
          name="iconArrow2Down"
          className="w-5 h-5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        />
      </div>

      <div className="hidden @tablet:block w-px bg-stroke-100 my-2" />

      <div className="flex-1 min-w-0 flex items-center">
        <FloatingLabelInput
          label="Nicho / Segmento (opcional)"
          name="niche"
          register={register}
          errors={errors}
          disableLabelFloat
          className="flex-1"
          inputClassName={fieldClasses}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={isSearching}
        className="rounded-full shrink-0 @tablet:w-auto @tablet:px-8 h-14 mt-2 @tablet:mt-0"
      >
        <Icon name="iconSearch" className="w-5 h-5" />
        <span className={isSearching ? "animate-pulse text-black" : ""}>
          {isSearching ? "Buscando..." : "Buscar"}
        </span>
      </Button>
    </form>
  );
}

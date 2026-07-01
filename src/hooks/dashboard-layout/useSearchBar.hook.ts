"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  searchParamsSchema,
  type SearchParams,
} from "@/schema/search-params.schema";

export function useSearchBar(
  onSubmit?: (data: SearchParams) => void,
  defaults?: Partial<SearchParams>,
) {
  const [isSearching, setIsSearching] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SearchParams>({
    resolver: zodResolver(searchParamsSchema),
    defaultValues: {
      location: defaults?.location ?? "",
      radius: defaults?.radius ?? "5",
      niche: defaults?.niche ?? "",
    },
  });

  const handleFormSubmit = handleSubmit(async (data) => {
    setIsSearching(true);
    try {
      await onSubmit?.(data);
    } finally {
      setIsSearching(false);
    }
  });

  return {
    register,
    errors,
    handleSubmit: handleFormSubmit,
    isSearching,
  };
}

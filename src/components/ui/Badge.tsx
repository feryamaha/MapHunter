import clsx from "clsx";
import { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";
import type { BadgeProps } from "@/types/dashboard-layout/badge.types";

export function Badge({ variant, disabled = false, className, ...props }: BadgeProps) {
  const classes = twMerge(
    clsx(
      "font-inter text-xs font-normal leading-[150%] rounded-[8px] flex justify-center items-center duration-200 ease-linear transition-colors gap-[2px] whitespace-nowrap",
      !disabled &&
      "shadow-[0_1px_4px_0_rgba(0,0,0,0.08),0_1px_2px_0_rgba(25,25,25,0.08)]",

      variant === "default" &&
      (disabled
        ? "w-max bg-secondary-100 grayscale opacity-60 p-[2px_8px]"
        : "w-max bg-secondary-25 text-secondary-800 border border-secondary-100 p-[2px_8px]"),

      variant === "light" &&
      (disabled
        ? "bg-secondary-200 grayscale opacity-60 border border-secondary-100 p-[2px_8px]"
        : "bg-secondary-0 text-secondary-800 border border-secondary-100 p-[2px_8px]"),

      variant === "success" &&
      (disabled
        ? "w-max bg-secondary-200 grayscale opacity-60 border border-secondary-100 p-[2px_8px]"
        : "w-max bg-auxiliary-success-background text-auxiliary-success-default border border-auxiliary-success-border p-[2px_8px]"),

      variant === "info" &&
      (disabled
        ? "bg-neutral-200 grayscale opacity-60 border border-neutral-100 p-[2px_8px]"
        : "bg-auxiliary-info-background text-auxiliary-info-default border border-auxiliary-info-border p-[2px_8px]"),

      variant === "warning" &&
      (disabled
        ? "bg-neutral-200 grayscale opacity-60 border border-neutral-100 p-[2px_8px]"
        : "bg-auxiliary-warning-background text-auxiliary-warning-default border border-auxiliary-warning-border p-[2px_8px]"),

      variant === "danger" &&
      (disabled
        ? "w-max bg-neutral-200 grayscale opacity-60 border border-neutral-100 p-[2px_8px]"
        : "w-max bg-accent-light text-accent-default border border-primary-50 p-[2px_8px]"),

      variant === "number" &&
      (disabled
        ? "w-[24px] h-[24px] px-[2px] rounded-full bg-secondary-100 text-[10px] text-secondary-800 border border-secondary-100 grayscale opacity-60"
        : "w-[24px] h-[24px] px-[2px] rounded-full bg-secondary-25 text-[10px] text-secondary-800 border border-secondary-100"),
    ),
    className,
  );

  return <span className={classes} {...props} />;
}
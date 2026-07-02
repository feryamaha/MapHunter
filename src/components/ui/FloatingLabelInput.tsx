"use client";

import clsx from "clsx";
import type { FieldValues } from "react-hook-form";
import type { FloatingLabelInputProps } from "@/types/dashboard-layout/floating-label-input.types";
import { useFloatingLabelInput } from "@/hooks/dashboard-layout/useFloatingLabelInput.hook";
import { borderRadius, padding } from "tailwindcss/defaultTheme";

export function FloatingLabelInput<
  TFieldValues extends FieldValues = FieldValues,
>({
  label,
  name,
  register,
  errors,
  validation,
  value,
  onChange,
  type = "text",
  className = "",
  inputClassName = "",
  inputSize = "lg",
  disableLabelFloat = false,
  placeholder = "",
  onBlur,
  onFocus,
  maxLength,
  readOnly,
  disabled,
  control,
  onlyLetters = false,
  onlyNumbers = false,
  allowAllCharacters = false,
  mask, // agora aceitamos mask como prop
}: FloatingLabelInputProps<TFieldValues>) {
  const { registerProps, currentValue, uncontrolledValue, hasValue, shouldShowLabel, errorMessage, hasError, baseProps, handleChange, applyMask } =
    useFloatingLabelInput<TFieldValues>({
      label,
      name,
      register,
      errors,
      validation,
      value,
      onChange,
      type,
      placeholder,
      onBlur,
      onFocus,
      maxLength,
      readOnly,
      disabled,
      control,
      onlyLetters,
      onlyNumbers,
      allowAllCharacters,
      mask,
      disableLabelFloat,
    });

  const sizeClass = inputSize === "sm" ? "h-[32px]" : inputSize === "md" ? "h-[36px]" : "h-12";

  const resolvedInputClassName = clsx(
    `w-full ${sizeClass} border rounded-lg px-4 pt-2 pb-2 transition-colors focus:outline-none focus:ring-1 focus:rounded-lg overflow-hidden`,
    hasError
      ? "border-primary-400 text-primary-400 ring-primary-400 focus:ring-primary-400 focus:border-primary-400"
      : "border-secondary-100 text-neutral-900 ring-neutral-900 focus:ring-primary-200 focus:border-primary-200 focus:rounded-lg",
    readOnly ? "cursor-default bg-neutral-50 " : "hover:border-neutral-900",
    inputClassName,
  );

  if (registerProps) {
    return (
      <div className={`relative ${className}`}>
        <input
          {...baseProps}
          {...registerProps}
          onChange={(e) => {
            handleChange(e);
            if (registerProps.onChange) registerProps.onChange(e);
          }}
          className={`${resolvedInputClassName} focus-visible:outline-2 focus-visible:outline-offset-2 focus:rounded-lg`}
          style={{
            WebkitBorderRadius: '0.5rem',
            borderRadius: '0.5rem',
            padding: '1.32rem',
            width: '90%',
            height: '90%',

          }}
        />
        <label
          className={`absolute left-4 pointer-events-none font-normal ${disableLabelFloat
            ? `${hasValue ? "opacity-0" : "opacity-100"} top-1/2 -translate-y-1/2 text-base ${hasError ? "text-primary-400" : "text-secondary-500"}`
            : `transition-all duration-200 ${shouldShowLabel
              ? `top-[-10px] text-sm bg-white px-2 rounded-lg ${hasError ? "text-primary-400" : "text-secondary-500"}`
              : `top-1/2 -translate-y-1/2 text-base ${hasError ? "text-primary-400" : "text-secondary-500"}`
            }`
            }`}
        >
          {label}
        </label>
        {hasError && errorMessage && (
          <p className="pt-1 pl-2 text-[10px] text-primary-400">{errorMessage}</p>
        )}
      </div>
    );
  }
  return (
    <div className={`relative ${className}`}>
      <input
        {...baseProps}
        value={uncontrolledValue}
        onChange={handleChange}
        className={`${resolvedInputClassName}`}
        style={{
          WebkitBorderRadius: '0.5rem',
          borderRadius: '0.5rem',
        }}
      />
      <label
        className={`absolute left-4 pointer-events-none font-normal ${disableLabelFloat
          ? `${hasValue ? "opacity-0" : "opacity-100"} top-1/2 -translate-y-1/2 text-base ${hasError ? "text-primary-400" : "text-secondary-500"}`
          : `transition-all duration-200 ${shouldShowLabel
            ? `top-[-10px] text-sm bg-white px-2 rounded-lg ${hasError ? "text-primary-400" : "text-secondary-500"}`
            : `top-1/2 -translate-y-1/2 text-base ${hasError ? "text-primary-400" : "text-secondary-500"}`
          }`
          }`}
      >
        {label}
      </label>
      {hasError && errorMessage && (
        <p className="pt-1 pl-2 text-[10px] text-primary-400">{errorMessage}</p>
      )}
    </div>
  );
}

import type * as React from "react";
import type {
    UseFormRegister,
    FieldErrors,
    Control,
    FieldValues,
    Path,
} from "react-hook-form";

export interface FloatingLabelInputProps<
    TFieldValues extends FieldValues = FieldValues,
> {
    label?: string;
    name: Path<TFieldValues>; // Tipado como Path para compatibilidade com TFieldValues
    register?: UseFormRegister<TFieldValues>;
    errors?: FieldErrors<TFieldValues>;
    validation?: Record<string, unknown>;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    className?: string;
    inputClassName?: string;
    inputSize?: 'sm' | 'md' | 'lg';
    disableLabelFloat?: boolean;
    placeholder?: string;
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
    onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
    maxLength?: number;
    readOnly?: boolean;
    disabled?: boolean;
    control?: Control<TFieldValues>;
    onlyLetters?: boolean;
    onlyNumbers?: boolean;
    allowAllCharacters?: boolean;
    mask?: string; // ADICIONADO para permitir máscaras
}

// AlternativeInputProps - reutilizando estrutura existente
export interface AlternativeInputProps extends React.ComponentProps<'input'> {
    className?: string;
    label: string;
    description?: string;
    id: string;
    value?: string;
    mask?: (value: string) => string;
    isFocused?: boolean;
    hasValue?: boolean;
    onFocus?: () => void;
    onBlur?: () => void;
}

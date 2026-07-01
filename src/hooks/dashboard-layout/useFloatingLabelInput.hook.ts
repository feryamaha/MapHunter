import { useMemo, useState } from "react";
import { applyMask } from "@/utils/input-mask.helpers";
import { getErrorMessage } from "@/utils/react-hook-form-error-message.helpers";
import type {
    Control,
    FieldErrors,
    FieldValues,
    Path,
    UseFormRegister,
} from "react-hook-form";
import { useFormContext, useWatch } from "react-hook-form";

export function useFloatingLabelInput<TFieldValues extends FieldValues = FieldValues>(params: {
    label?: string;
    name: Path<TFieldValues>;
    register?: UseFormRegister<TFieldValues>;
    errors?: FieldErrors<TFieldValues>;
    validation?: Record<string, unknown>;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type: string;
    placeholder: string;
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
    onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
    maxLength?: number;
    readOnly?: boolean;
    disabled?: boolean;
    control?: Control<TFieldValues>;
    onlyLetters: boolean;
    onlyNumbers: boolean;
    allowAllCharacters: boolean;
    mask?: string;
    disableLabelFloat?: boolean;
}) {
    const {
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
        disableLabelFloat = false,
    } = params;

    const [isFocused, setIsFocused] = useState(false);
    const [localHasValue, setLocalHasValue] = useState(false);

    const applyMaskFn = useMemo(() => {
        return (val: string): string => applyMask(val, mask);
    }, [mask]);

    // Obter control via contexto se disponível (fallback para props)
    let formContext;
    try {
        formContext = useFormContext<TFieldValues>();
    } catch {
        // useFormContext lança erro se chamado fora de FormProvider
        formContext = null;
    }
    const contextControl = formContext?.control;

    // Usar props ou contexto (fallback)
    const effectiveControl = control ?? contextControl;

    // Usar useWatch para obter valor atual do campo via contexto (apenas se control disponível)
    const watchedValue = effectiveControl ? useWatch({
        control: effectiveControl as unknown as Control<FieldValues>,
        name: name as string,
        defaultValue: '',
    }) as string | undefined : undefined;

    // Derivar currentValue com fallback para value prop
    const currentValue: string = watchedValue ?? value ?? "";

    const registerProps = register
        ? (validation ? register(name, validation) : register(name))
        : null;
    const hasContent = currentValue.length > 0;
    const uncontrolledValue =
        value !== undefined ? (mask ? applyMaskFn(value) : value) : undefined;
    const hasValue =
        (currentValue && String(currentValue).length > 0) || hasContent || localHasValue;
    const shouldShowLabel = isFocused || hasValue;

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        if (disabled) return;
        setIsFocused(true);
        if (onFocus) onFocus(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        if (disabled) return;
        setIsFocused(false);
        setLocalHasValue(e.target.value.length > 0);
        if (onBlur) onBlur(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) return;
        let val = e.target.value;
        if (mask) {
            val = applyMaskFn(val);
            e.target.value = val;
        }
        let isValid = true;
        if (!allowAllCharacters) {
            if (onlyLetters) {
                isValid = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]*$/.test(val);
            } else if (onlyNumbers) {
                isValid = /^[0-9]*$/.test(val.replace(/\D/g, ""));
            }
            if (!isValid) return;
        }
        setLocalHasValue(val.length > 0);
        if (onChange) onChange(e);
    };

    const controlKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];
    const _handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Nunca bloquear atalhos do sistema (Cmd/Ctrl + tecla): copiar, colar, recortar, selecionar tudo, etc.
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (controlKeys.includes(e.key)) return;
        if (mask) {
            const maskChars = [".", "-", "/", " "];
            if (maskChars.includes(e.key)) return;
        }
        if (!allowAllCharacters) {
            if (onlyLetters && !/[A-Za-zÀ-ÖØ-öø-ÿ\s]/.test(e.key)) e.preventDefault();
            else if (onlyNumbers && !/[0-9]/.test(e.key)) e.preventDefault();
        }
    };

    const errorMessage = getErrorMessage({
        errors,
        name: name as string,
        label,
    });
    const hasError = !disabled && !!errorMessage;
    let inputType = type;
    if (onlyNumbers && type === "text") {
        inputType = "tel";
    }
    const baseProps = {
        type: inputType,
        name,
        onFocus: handleFocus,
        onBlur: handleBlur,
        placeholder: disableLabelFloat ? placeholder : (isFocused ? placeholder : ""),
        maxLength,
        readOnly,
        disabled,
        onKeyDown: _handleKeyDown,
    };

    return {
        registerProps,
        currentValue,
        uncontrolledValue,
        hasValue,
        shouldShowLabel,
        errorMessage,
        hasError,
        baseProps,
        handleChange,
        applyMask: applyMaskFn,
    };
}

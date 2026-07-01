export function getErrorMessage(params: {
    errors: unknown;
    name: string;
    label?: string;
}): string | null {
    const { errors, name, label } = params;

    if (!errors || !name) return null;

    const nameParts = name.split(".");
    let currentError: unknown = errors;

    for (const part of nameParts) {
        if (
            currentError &&
            typeof currentError === "object" &&
            part in (currentError as Record<string, unknown>)
        ) {
            currentError = (currentError as Record<string, unknown>)[part];
        } else {
            return null;
        }
    }

    if (!currentError) return null;

    if (typeof currentError === "object" && currentError !== null) {
        if (
            "message" in currentError &&
            typeof (currentError as { message?: unknown }).message === "string"
        ) {
            return (currentError as { message: string }).message;
        }
        if (
            "type" in currentError &&
            (currentError as { type?: unknown }).type === "required"
        ) {
            return `${label?.replace("*", "").trim() || "Campo"} é obrigatório`;
        }
    }

    return null;
}

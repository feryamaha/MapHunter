import type { ComponentProps } from "react";

export interface BadgeProps extends ComponentProps<"span"> {
    variant:
    | "default"
    | "light"
    | "success"
    | "info"
    | "warning"
    | "danger"
    | "number";
    disabled?: boolean;
}

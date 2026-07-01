import type { ComponentProps } from "react";

export interface ButtonProps extends ComponentProps<"button"> {
    href?: string;
    target?: string;
    rel?: string;
    variant: "primary" | "primary-icon" | "secondary" | "tertiary" | "link";
    size: "sm" | "md" | "lg" | "default";
    background?:
    | "bg-primary"
    | "bg-secondary"
    | "dangerPrimary"
    | "dangerSecondary"
    | "dangerTertiary";
    icon?: "none" | "icon";
    positionIcon?: "left" | "md" | "right";
}

"use client";

import React, { useState } from "react";

import { Icon, type IconProps } from "@/script/Icon";
import type { ButtonProps } from "@/types/dashboard-layout/button.types";

export function useButton(params: {
    variant: ButtonProps["variant"];
    size: ButtonProps["size"];
    disabled?: ButtonProps["disabled"];
    background?: ButtonProps["background"];
    icon?: ButtonProps["icon"];
    positionIcon?: ButtonProps["positionIcon"];
    children: ButtonProps["children"];
}) {
    const {
        variant,
        size,
        disabled,
        background,
        icon = "none",
        positionIcon = "left",
        children,
    } = params;

    const [isHovered, setIsHovered] = useState(false);

    const isDangerSecondaryCombo =
        variant === "secondary" && background === "dangerSecondary";

    const hasManualIcon = React.Children.toArray(children).some(
        child => React.isValidElement(child) && child.type === Icon
    );

    const processedChildren = React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        const isIcon = child.type === Icon;
        const isDangerIcon =
            isIcon && (child.props as IconProps).name === "iconHome";
        const shouldSwap =
            isIcon &&
            isDangerIcon &&
            isDangerSecondaryCombo &&
            isHovered &&
            !disabled;
        return shouldSwap
            ? (React.cloneElement(child, {
                name: "iconToAdd",
            } as IconProps) as typeof child)
            : child;
    });

    const resolveAutoIconName = (): IconProps["name"] | null => {
        if (icon !== "icon" || hasManualIcon) return null;

        let autoIconName: IconProps["name"] = "iconToAdd";

        if (!disabled) {
            if (
                (variant === "tertiary" && isHovered) ||
                (background === "dangerTertiary" && isHovered) ||
                (variant === "secondary" && isDangerSecondaryCombo && isHovered)
            ) {
                autoIconName = "iconToAdd";
            } else if (variant === "primary" || variant === "secondary") {
                autoIconName = "iconToAdd";
            }
        }
        return autoIconName;
    };

    const autoIconName = resolveAutoIconName();

    const onMouseEnter = () => !disabled && setIsHovered(true);
    const onMouseLeave = () => setIsHovered(false);

    return {
        positionIcon,
        processedChildren,
        autoIconName,
        onMouseEnter,
        onMouseLeave,
    };
}

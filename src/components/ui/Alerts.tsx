import { Icon } from "@/script/Icon";
import { Button } from "@/components/ui/Button";
import { clsx } from "clsx";
import React from "react";
import { twMerge } from "tailwind-merge";

type AlertType = "info" | "warning" | "success" | "danger";
type AlertLayout = "flat" | "flat-toast" | "column" | "column-toast";
type AlertStyleVariant = "filled" | "basic" | "toast";
type AlertIconName =
    | "iconAlertInfo"
    | "iconAlertWarning"
    | "iconAlertSucess"
    | "iconAlertDanger"
    | "IconClose";
interface AlertButton {
    text: string;
    onClick: () => void;
}
interface AlertsProps {
    type: AlertType;
    layout: AlertLayout;
    styleVariant: AlertStyleVariant;
    title?: string;
    description?: string;
    buttons?: AlertButton[];
    onClose?: () => void;
    showCloseButton?: boolean;
    closeButtonText?: string;
    className?: string;
    children?: React.ReactNode;
    icon?: string;
}

const alertIconName: Record<AlertType, Exclude<AlertIconName, "IconClose">> = {
    info: "iconAlertInfo",
    warning: "iconAlertWarning",
    success: "iconAlertSucess",
    danger: "iconAlertDanger",
};

export function Alerts({
    type,
    layout,
    styleVariant,
    title,
    description,
    buttons,
    onClose,
    showCloseButton = true,
    closeButtonText,
    className,
    children,
    icon,
}: AlertsProps) {
    const isHorizontalToast = layout === "flat-toast";
    const hideDefaultIcon = isHorizontalToast || layout === "column-toast";

    return (
        <div
            className={twMerge(
                clsx(
                    "p-[16px] rounded-lg shadow-[0_1px_4px_0_rgba(0,0,0,0.08),0_1px_2px_0_rgba(25,25,25,0.08)] relative",
                    {
                        "bg-auxiliary-info-background border border-auxiliary-info-border text-auxiliary-info-default":
                            type === "info" && styleVariant === "filled",
                        "bg-white text-auxiliary-info-default":
                            type === "info" && styleVariant === "basic",
                        "bg-white text-auxiliary-info-default border-l-[8px] border-auxiliary-info-default":
                            type === "info" && styleVariant === "toast",

                        "bg-auxiliary-warning-background border border-auxiliary-warning-border text-auxiliary-warning-default":
                            type === "warning" && styleVariant === "filled",
                        "bg-white text-auxiliary-warning-default":
                            type === "warning" && styleVariant === "basic",
                        "bg-white text-auxiliary-warning-default border-l-[8px] border-auxiliary-warning-border":
                            type === "warning" && styleVariant === "toast",

                        "bg-auxiliary-success-background border border-auxiliary-success-border text-auxiliary-success-default":
                            type === "success" && styleVariant === "filled",
                        "bg-white text-auxiliary-success-default":
                            type === "success" && styleVariant === "basic",
                        "bg-white text-auxiliary-success-default border-l-[8px] border-auxiliary-success-border":
                            type === "success" && styleVariant === "toast",

                        "bg-auxiliary-danger-background border border-auxiliary-danger-border text-accent-default":
                            type === "danger" && styleVariant === "filled",
                        "bg-white text-accent-default":
                            type === "danger" && styleVariant === "basic",
                        "bg-white text-accent-default border-l-[8px] border-accent-default":
                            type === "danger" && styleVariant === "toast",
                    },
                    className,
                ),
            )}
        >
            <div
                className={`flex ${layout === "flat" || layout === "flat-toast"
                    ? "items-center justify-between"
                    : "flex-col "
                    }`}
            >
                <div
                    className={`flex gap-[8px] ${layout === "column" || layout === "column-toast"
                        ? "w-full flex items-start"
                        : "w-full flex items-center"
                        } ${isHorizontalToast ? "justify-between" : ""}`}
                >
                    <div
                        className={`flex gap-[8px] ${layout === "column" || layout === "column-toast"
                            ? "w-full flex items-start"
                            : "w-full flex items-center"
                            }`}
                    >
                        {icon
                            ? icon
                            : !hideDefaultIcon && (
                                <Icon name={alertIconName[type]} className="w-6 h-6" />
                            )}
                        <div className="flex flex-col gap-[12px]">
                            {title && (
                                <h3 className="font-inter text-base font-medium">{title}</h3>
                            )}
                            {description && (
                                <p className="font-inter text-xs text-secondary-600">
                                    {description}
                                </p>
                            )}
                            {children && <div className="mt-2">{children}</div>}
                        </div>
                    </div>

                    {isHorizontalToast ? (
                        <div className="flex items-center gap-[24px]">
                            {buttons && buttons.length > 0 && (
                                <div className="min-w-max flex items-center gap-[24px]">
                                    {buttons.map((btn, index) =>
                                        btn.text ? (
                                            <Button
                                                key={index}
                                                variant="tertiary"
                                                size="default"
                                                onClick={btn.onClick}
                                                className="animate-pulse"

                                            >
                                                <span className="pr-[4px]">
                                                    <Icon name="iconToAdd" />
                                                </span>
                                                {btn.text}
                                            </Button>
                                        ) : null,
                                    )}
                                </div>
                            )}
                            {showCloseButton && onClose && (
                                <Button
                                    size="lg"
                                    variant="tertiary"
                                    onClick={onClose}
                                    aria-label="Fechar alerta"

                                >
                                    <span className="flex min-w-max gap-[12px]">
                                        {closeButtonText}
                                        <Icon name="iconClose" />
                                    </span>
                                </Button>
                            )}
                        </div>
                    ) : (
                        showCloseButton &&
                        onClose && (
                            <Button
                                size="lg"
                                variant="tertiary"
                                onClick={onClose}
                                aria-label="Fechar alerta"
                                className="w-max p-0 text-neutral-900"
                            >
                                <span className="flex min-w-max gap-[12px]">
                                    {closeButtonText}
                                    <Icon name="iconClose" />
                                </span>
                            </Button>
                        )
                    )}
                </div>
                {!isHorizontalToast && buttons && buttons.length > 0 && (
                    <div
                        className={clsx("flex gap-[24px] mt-[16px]", {
                            "px-0": layout === "column-toast",
                            "px-[28px]": layout === "column",
                        })}
                    >
                        {buttons.map((btn, index) =>
                            btn.text ? (
                                <Button
                                    key={index}
                                    variant="tertiary"
                                    size="default"
                                    onClick={btn.onClick}
                                >
                                    <span className="pr-[4px]">
                                        <Icon name="iconToAdd" />
                                    </span>
                                    {btn.text}
                                </Button>
                            ) : null,
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
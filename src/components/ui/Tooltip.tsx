// SMART COMPONENT
import { Icon } from "@/script/Icon";
import type { CSSProperties, ReactNode } from "react";
import { ComponentProps } from "react";
import { useState } from "react";
import { TooltipCardText } from "./TooltipCardText";

interface TooltipProps extends Omit<ComponentProps<"div">, "children"> {
    contentText: string;
    isVisible?: boolean;
    controlled?: boolean;
    hideIcon?: boolean;
    containerClassName?: string;
    containerStyle?: CSSProperties;
    showArrow?: boolean;
    arrowPosition?: 'top' | 'bottom';
    compact?: boolean;
    positionClass?: string;
    // Conteúdo que dispara o tooltip no hover. Quando presente, substitui o
    // ícone padrão — permite envolver texto truncado de células de tabela.
    children?: ReactNode;
}

export function Tooltip({
    contentText,
    className,
    isVisible,
    controlled = false,
    hideIcon = false,
    containerClassName,
    containerStyle,
    showArrow = true,
    arrowPosition = 'top',
    compact = false,
    positionClass,
    children,
    ...props
}: TooltipProps) {

    const [isHoverVisible, setIsHoverVisible] = useState(false);
    const resolvedVisibility = controlled ? Boolean(isVisible) : isHoverVisible;

    return (
        <div
            className={containerClassName ?? "relative inline-block"}
            style={containerStyle}
            onMouseEnter={() => {
                if (!controlled) {
                    setIsHoverVisible(true);
                }
            }}
            onMouseLeave={() => {
                if (!controlled) {
                    setIsHoverVisible(false);
                }
            }}
        >
            {children ?? (!hideIcon && <Icon name="iconInfoCircleTooltip" className="cursor-pointer" />)}
            {/* Só monta o card quando visível: mesmo com opacity-0, um card
                montado ocupa área de scroll (estoura containers overflow). */}
            {resolvedVisibility && <TooltipCardText
                contentText={contentText}
                isVisible={resolvedVisibility}
                showArrow={showArrow}
                arrowPosition={arrowPosition}
                compact={compact}
                positionClass={positionClass}
                className={className}
                {...props}
            />}
        </div>
    );
}
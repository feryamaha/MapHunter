// SMART COMPONENT
import { Icon } from "@/script/Icon";
import type { CSSProperties } from "react";
import { ComponentProps } from "react";
import { useState } from "react";
import { TooltipCardText } from "./TooltipCardText";

interface TooltipProps extends ComponentProps<"div"> {
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
            {!hideIcon && <Icon name="iconInfoCircleTooltip" className="cursor-pointer" />}
            <TooltipCardText
                contentText={contentText}
                isVisible={resolvedVisibility}
                showArrow={showArrow}
                arrowPosition={arrowPosition}
                compact={compact}
                positionClass={positionClass}
                className={className}
                {...props}
            />
        </div>
    );
}
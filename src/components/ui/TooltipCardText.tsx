import { Icon } from "@/script/Icon";
import type { ComponentProps } from "react";

interface TooltipCardTextProps extends ComponentProps<"div"> {
    contentText: string;
    isVisible?: boolean;
    showArrow?: boolean;
    arrowPosition?: 'top' | 'bottom';
    compact?: boolean;
    positionClass?: string;
}

export function TooltipCardText({ contentText, className, isVisible = true, showArrow = true, arrowPosition = 'top', compact = false, positionClass = 'absolute', ...props }: TooltipCardTextProps) {
    const widthClass = compact ? 'w-max' : 'w-[202px]';

    return (
        <div className={`${positionClass} ${widthClass} transition-all duration-900 ease-in-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'} ${className}`} {...props}>
            {showArrow && arrowPosition === 'top' && <Icon name="iconArrowTooltip" className="absolute -top-[6px] left-[50%] -translate-x-1/2 z-10" />}
            <div className="p-[4px_8px] bg-neutral-800 rounded-[4px] z-5">
                <p className="font-inter text-[12px] font-semibold text-white">{contentText}</p>
            </div>
            {showArrow && arrowPosition === 'bottom' && <Icon name="iconArrowTooltip" className="absolute -bottom-[6px] left-[50%] -translate-x-1/2 rotate-180 z-10" />}
        </div>
    );
}
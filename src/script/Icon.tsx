
import { forwardRef, SVGProps, FC } from "react";
import { icons } from "./IconsList";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: string;
  className?: string;
  fill?: string;
  size?: number | string;
}

export const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ name, className = "", size, fill, style, ...props }, ref) => {
    const IconComponent = Object.prototype.hasOwnProperty.call(icons, name)
      ? (icons as Record<string, FC<SVGProps<SVGSVGElement>>>)[
      name
      ]
      : undefined;

    if (!IconComponent) return null;

    const resolvedSize = size ?? "1em";

    return (
      <IconComponent
        ref={ref}
        className={className}
        fill={fill}
        width={resolvedSize}
        height={resolvedSize}
        style={style}
        {...props}
      />
    );
  }
);

Icon.displayName = "Icon";

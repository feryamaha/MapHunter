export interface MenuItem {
    label: string;
    icon?: string;
    onClick?: () => void;
}

export interface DropdownMenuProps {
    items: MenuItem[];
    triggerText?: string;
    showIcon?: boolean;
    triggerClassName?: string;
    className?: string;
}

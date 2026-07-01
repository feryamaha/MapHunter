import { Icon } from "@/script/Icon";
import type { DropdownMenuProps, MenuItem } from "@/types/dashboard-layout/dropdown.types";
import { useDropdownMenu } from "@/hooks/dashboard-layout/useDropdownMenu.hook";

export function DropdownMenu({ items, triggerText = "Status", showIcon = true, triggerClassName, className }: DropdownMenuProps) {
  const { isOpen, setIsOpen, dropdownRef } = useDropdownMenu();

  const handleItemClick = (item: MenuItem) => {
    if (item.onClick) {
      item.onClick();
    }
    setIsOpen(false);
  };

  const handleTriggerClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div ref={dropdownRef} className="relative w-max">
      <button
        onClick={handleTriggerClick}
        className={`w-max h-[32px] px-3 py-2 flex items-center gap-[8px] text-sm text-neutral-700 font-medium rounded-md border border-stroke-100 bg-white hover:bg-neutral-50 transition-colors ${triggerClassName ?? ""}`}
      >
        <span>{triggerText}</span>
        {showIcon && <Icon name="iconArrow2Down" />}
      </button>

      {isOpen && (
        <div className={`absolute top-full left-0 mt-2 w-full min-w-max bg-white flex flex-col gap-[8px] py-2 rounded-md border border-stroke-100 shadow-[0_1px_4px_0_rgba(0,0,0,0.08),0_1px_2px_0_rgba(25,25,25,0.08)] z-50 ${className ?? ""}`}>
          {items.map((item, index) => (
            <div
              key={index}
              onClick={() => handleItemClick(item)}
              className="w-full min-w-max flex items-center gap-[8px] text-sm text-neutral-700 font-medium cursor-pointer p-[8px_16px] hover:bg-neutral-100 transition-colors"
            >
              {item.label}
              {item.icon && <Icon name={item.icon} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

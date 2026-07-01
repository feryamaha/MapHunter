// SMART COMPONENT
"use client";
import { Icon } from "@/script/Icon";
import { useCallback, useEffect, useRef, useState } from "react";

interface PaginationProps {
    count?: number;
    totalItems?: number;
    page?: number;
    defaultPage?: number;
    onChange?: (event: React.MouseEvent | null, page: number) => void;
    disabled?: boolean;
    hideNextButton?: boolean;
    hidePrevButton?: boolean;
    itemsPerPage?: number;
    onItemsPerPageChange?: (itemsPerPage: number) => void;
    itemsPerPageOptions?: number[];
}

function getPaginationItems(
    count: number,
    currentPage: number,
    disabled: boolean,
    hidePrevButton: boolean,
    hideNextButton: boolean,
    handleClick: (event: React.MouseEvent, value: number) => void,
) {
    const items: any[] = [];
    const createItem = (type: string, page: number | null, selected = false) => ({
        type,
        page,
        selected,
        disabled: type.includes("ellipsis") || disabled,
        onClick: page ? (e: React.MouseEvent) => handleClick(e, page) : undefined,
    });

    if (!hidePrevButton)
        items.push(createItem("previous", Math.max(currentPage - 1, 1)));

    if (count <= 6) {
        for (let i = 1; i <= count; i++)
            items.push(createItem("page", i, i === currentPage));
    } else {
        items.push(createItem("page", 1, currentPage === 1));
        if (currentPage > 4) items.push(createItem("start-ellipsis", null));
        const start = Math.max(2, Math.min(currentPage - 1, count - 3));
        const end = Math.min(start + 2, count - 1);
        for (let i = start; i <= end; i++)
            items.push(createItem("page", i, i === currentPage));
        if (currentPage < count - 3) items.push(createItem("end-ellipsis", null));
        if (count > 1) items.push(createItem("page", count, currentPage === count));
    }

    if (!hideNextButton)
        items.push(createItem("next", Math.min(currentPage + 1, count)));
    return items;
}

export function Pagination({
    count,
    totalItems = 0,
    page: pageProp,
    defaultPage = 1,
    onChange,
    disabled = false,
    hideNextButton = false,
    hidePrevButton = false,
    itemsPerPage = 10,
    onItemsPerPageChange,
    itemsPerPageOptions = [10, 20, 50, 100],
}: PaginationProps) {
    const [internalPage, setInternalPage] = useState(defaultPage);
    const [internalItemsPerPage, setInternalItemsPerPage] =
        useState(itemsPerPage);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const currentPage = pageProp ?? internalPage;
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleClick = useCallback(
        (event: React.MouseEvent, value: number) => {
            if (!pageProp) setInternalPage(value);
            onChange?.(event, value);
        },
        [pageProp, onChange],
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const totalPages =
        count ??
        (totalItems > 0 ? Math.ceil(totalItems / internalItemsPerPage) : 1);
    const items = getPaginationItems(
        totalPages,
        currentPage,
        disabled,
        hidePrevButton,
        hideNextButton,
        handleClick,
    );

    return (
        <div className="w-full px-4 py-3 bg-white flex flex-col @tablet:flex-row @tablet:justify-between items-center gap-4">
            <div className="flex items-center">
                <p className="text-secondary-900 font-normal">
                    <span className="text-secondary-600">Mostrando </span>
                    {totalItems > 0
                        ? `${(currentPage - 1) * internalItemsPerPage + 1}-${Math.min(
                            currentPage * internalItemsPerPage,
                            totalItems,
                        )} de ${totalItems} itens`
                        : `${currentPage.toString().padStart(2, "0")} de ${totalPages
                            .toString()
                            .padStart(2, "0")}`}
                </p>
            </div>

            <nav
                className="flex items-center gap-2"
                aria-label="Navegação de páginas"
                role="navigation"
            >
                {items.map((item, index) => (
                    <div key={`${item.type}-${item.page}-${index}`}>
                        {item.type === "start-ellipsis" || item.type === "end-ellipsis" ? (
                            <span
                                className="flex justify-center w-8 h-8 text-sm items-center text-secondary-900 border border-secondary-100 rounded-md"
                                aria-hidden="true"
                            >
                                …
                            </span>
                        ) : (
                            <button
                                onClick={item.onClick}
                                disabled={item.disabled}
                                className={`flex justify-center w-8 h-8 text-sm transition-colors font-inter items-center cursor-pointer ${item.type !== "previous" && item.type !== "next"
                                    ? "border border-secondary-100 rounded-md"
                                    : ""
                                    } ${item.selected
                                        ? "bg-secondary-50 text-secondary-900 font-semibold border border-secondary-200"
                                        : "text-secondary-600 font-normal"
                                    } ${item.disabled ? "cursor-not-allowed" : ""}`}
                                aria-label={
                                    item.type === "previous"
                                        ? "Página anterior"
                                        : item.type === "next"
                                            ? "Próxima página"
                                            : `Página ${item.page}`
                                }
                                aria-current={item.selected ? "page" : undefined}
                            >
                                {item.type === "previous" && <Icon name="iconArrow2Left" />}
                                {item.type === "next" && <Icon name="iconArrow2Right" />}
                                {item.type === "page" && item.page}
                            </button>
                        )}
                    </div>
                ))}
            </nav>

            {onItemsPerPageChange && (
                <div className="flex items-center">
                    <div ref={dropdownRef} className="relative">
                        <button
                            onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
                            className={`flex items-center gap-2 bg-white border border-secondary-300 rounded-md p-[7px_12px] text-sm transition-colors cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                            disabled={disabled}
                            aria-label="Selecionar itens por página"
                        >
                            <p className="text-secondary-900 font-medium">
                                {internalItemsPerPage.toString().padStart(2, "0")}
                            </p>
                            <p className="text-secondary-600 font-normal"> por página</p>
                            <Icon
                                name="iconArrow2Down"
                                className={`text-secondary-900 transition-transform ${isDropdownOpen ? "rotate-0" : ""
                                    }`}
                            />
                        </button>

                        {isDropdownOpen && (
                            <div className="w-full h-max absolute bottom-12 right-0 right-0 mt-1 p-2 bg-white border border-secondary-300 rounded-md shadow-lg z-50 overflow-y-auto">
                                {itemsPerPageOptions.map((option) => (
                                    <button
                                        key={option}
                                        className={`flex gap-2 items-center p-2 text-sm cursor-pointer transition-colors w-full text-left ${option === internalItemsPerPage
                                            ? "bg-blue-50"
                                            : "hover:bg-secondary-50"
                                            }`}
                                        onClick={() => {
                                            setInternalItemsPerPage(option);
                                            onItemsPerPageChange?.(option);
                                            setIsDropdownOpen(false);
                                        }}
                                    >
                                        <p className="text-secondary-900 font-medium">
                                            {option.toString().padStart(2, "0")}
                                        </p>
                                        <p className="text-secondary-600 font-normal">
                                            {" "}
                                            por página
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
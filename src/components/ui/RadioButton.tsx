// SMART COMPONENT
'use client'
import { useState } from 'react'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

interface RadioButtonProps {
    options: string[]
    defaultValue?: string
    value?: string
    onChange?: (value: string) => void
    name?: string
    className?: string
}

export function RadioButton({
    options,
    defaultValue,
    value,
    onChange,
    name = 'radio-group',
    className,
}: RadioButtonProps) {
    const [internalValue, setInternalValue] = useState<string>(
        defaultValue ?? options[0] ?? ''
    )

    const selectedValue = value !== undefined ? value : internalValue

    function handleSelect(option: string) {
        if (value === undefined) {
            setInternalValue(option)
        }
        onChange?.(option)
    }

    return (
        <div
            className={twMerge(
                clsx('flex flex-col gap-2', className)
            )}
            role="radiogroup"
            aria-label={name}
        >
            {options.map((option) => {
                const isSelected = selectedValue === option

                const rowClasses = twMerge(
                    clsx(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors duration-150',
                        isSelected
                            ? 'bg-accent-light'
                            : 'bg-transparent hover:bg-accent-light/50'
                    )
                )

                const circleClasses = twMerge(
                    clsx(
                        'w-5 h-5 shrink-0 rounded-full border flex items-center justify-center transition-colors duration-150',
                        isSelected
                            ? 'border-4 border-accent-default'
                            : 'border-neutral-200'
                    )
                )

                return (
                    <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        className={rowClasses}
                        onClick={() => handleSelect(option)}
                    >
                        <span className={circleClasses}>
                            {isSelected && (
                                <span className="w-2.5 h-2.5 rounded-full bg-white" />
                            )}
                        </span>
                        <span className="font-inter text-sm text-neutral-900">
                            {option}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
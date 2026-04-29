import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';

import { cn } from '@/lib/utils';

type SearchableSelectOption = {
    label: string;
    value: number | string;
};

type SearchableSelectProps = {
    className?: string;
    disabled?: boolean;
    emptyText?: string;
    options: SearchableSelectOption[];
    placeholder?: string;
    searchPlaceholder?: string;
    value: number | string | null;
    onChange: (value: number | string | null) => void;
};

export function SearchableSelect({
    className,
    disabled = false,
    emptyText = 'No results found.',
    options,
    placeholder = 'Select an option',
    searchPlaceholder = 'Search...',
    value,
    onChange,
}: SearchableSelectProps) {
    const [query, setQuery] = useState('');

    const selectedOption = useMemo(
        () => options.find((option) => option.value === value) ?? null,
        [options, value],
    );

    const filteredOptions = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        if (!normalizedQuery) {
            return options;
        }

        return options.filter((option) => option.label.toLowerCase().includes(normalizedQuery));
    }, [options, query]);

    return (
        <Combobox
            as="div"
            className={cn('relative', className)}
            disabled={disabled}
            immediate
            value={selectedOption}
            onChange={(option: SearchableSelectOption | null) => {
                onChange(option?.value ?? null);
                setQuery('');
            }}
            onClose={() => setQuery('')}
        >
            <div className="relative">
                <ComboboxInput
                    aria-label={placeholder}
                    className={cn(
                        'border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 pr-10 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                    )}
                    displayValue={(option: SearchableSelectOption | null) => option?.label ?? ''}
                    onBlur={() => setQuery('')}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={selectedOption ? selectedOption.label : searchPlaceholder}
                />
                <ComboboxButton className="text-muted-foreground absolute inset-y-0 right-0 flex items-center px-3">
                    <ChevronsUpDown className="size-4" />
                </ComboboxButton>
            </div>

            <ComboboxOptions className="bg-popover text-popover-foreground absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border shadow-md empty:invisible">
                {filteredOptions.length ? (
                    filteredOptions.map((option) => (
                        <ComboboxOption
                            key={String(option.value)}
                            className="data-[focus]:bg-accent data-[focus]:text-accent-foreground flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm"
                            value={option}
                        >
                            {({ selected }) => (
                                <>
                                    <span className="truncate">{option.label}</span>
                                    <Check className={cn('size-4', selected ? 'opacity-100' : 'opacity-0')} />
                                </>
                            )}
                        </ComboboxOption>
                    ))
                ) : (
                    <div className="text-muted-foreground px-3 py-2 text-sm">{emptyText}</div>
                )}
            </ComboboxOptions>
        </Combobox>
    );
}

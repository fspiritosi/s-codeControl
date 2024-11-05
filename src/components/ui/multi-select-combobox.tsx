'use client';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';
import { CardDescription } from './card';

interface Option {
  label: string;
  value: string;
  cuit?: string;
}

interface MultiSelectComboboxProps {
  options: Option[];
  placeholder: string;
  emptyMessage: string;
  selectedValues: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  selectedResourceDocuments?: EmployeeDocument[];
}

export function MultiSelectCombobox({
  options,
  placeholder,
  emptyMessage,
  selectedValues,
  selectedResourceDocuments,
  onChange,
  disabled = false,
}: MultiSelectComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (value: string) => {
    const updatedValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onChange(updatedValues);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          disabled={disabled}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedValues?.length > 0 ? (
            <CardDescription className="flex flex-wrap gap-1">
              {selectedValues?.length} recursos seleccionados
            </CardDescription>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={`Buscar ${placeholder.toLowerCase()}...`} />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {options.map((option) => (
              <CommandItem
                disabled={selectedResourceDocuments?.some((document) => document.applies === option.value)}
                key={option.value}
                onSelect={() => handleSelect(option.value)}
              >
                <Check
                  className={cn('mr-2 h-4 w-4', selectedValues?.includes(option.value) ? 'opacity-100' : 'opacity-0')}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
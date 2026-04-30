'use client';

import * as React from 'react';
import { Check, SlidersHorizontal } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { saveTableFilterVisibility } from '@/shared/actions/table-preferences';

import type { DataTableFacetedFilterConfig } from './types';

interface DataTableFilterOptionsProps {
  filters: DataTableFacetedFilterConfig[];
  filterVisibility: Record<string, boolean>;
  onFilterVisibilityChange: (visibility: Record<string, boolean>) => void;
  tableId: string;
}

export function DataTableFilterOptions({
  filters,
  filterVisibility,
  onFilterVisibilityChange,
  tableId,
}: DataTableFilterOptionsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const toggleFilter = (columnId: string, visible: boolean) => {
    const newVisibility = { ...filterVisibility, [columnId]: visible };
    onFilterVisibilityChange(newVisibility);

    // Si se oculta, limpiar el param de URL correspondiente
    if (!visible) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete(columnId);
      params.delete(`${columnId}_from`);
      params.delete(`${columnId}_to`);
      router.replace(`${pathname}?${params.toString()}`);
    }

    // Guardar en DB (fire and forget)
    saveTableFilterVisibility(tableId, newVisibility);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Filtros</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="end">
        <Command>
          <CommandInput placeholder="Buscar filtro..." />
          <CommandList>
            <CommandEmpty>Sin resultados.</CommandEmpty>
            <CommandGroup heading="Mostrar filtros">
              {filters.map((filter) => {
                const isVisible = filterVisibility[filter.columnId] !== false;
                return (
                  <CommandItem
                    key={filter.columnId}
                    value={filter.title}
                    onSelect={() => toggleFilter(filter.columnId, !isVisible)}
                  >
                    <div
                      className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                        isVisible
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50 [&_svg]:invisible'
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </div>
                    <span>{filter.title}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

'use client';

import * as React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Filtros</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Mostrar filtros</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {filters.map((filter) => {
          const isVisible = filterVisibility[filter.columnId] !== false;
          return (
            <DropdownMenuCheckboxItem
              key={filter.columnId}
              checked={isVisible}
              onCheckedChange={(value) => toggleFilter(filter.columnId, !!value)}
            >
              {filter.title}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

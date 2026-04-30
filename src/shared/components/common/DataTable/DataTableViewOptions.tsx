'use client';

import * as React from 'react';
import { Check, Settings2 } from 'lucide-react';

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

import type { DataTableViewOptionsProps } from './types';

/**
 * Dropdown para toggle de visibilidad de columnas.
 *
 * Usa un Command (cmdk) dentro de un Popover para tener buscador y scroll
 * cuando la tabla tiene muchas columnas.
 */
export function DataTableViewOptions<TData>({ table }: DataTableViewOptionsProps<TData>) {
  const columns = table
    .getAllColumns()
    .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide());

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto hidden h-8 lg:flex"
          data-testid="column-toggle"
        >
          <Settings2 className="mr-2 h-4 w-4" />
          Columnas
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="end">
        <Command>
          <CommandInput placeholder="Buscar columna..." />
          <CommandList>
            <CommandEmpty>Sin resultados.</CommandEmpty>
            <CommandGroup heading="Mostrar columnas">
              {columns.map((column) => {
                const title = (column.columnDef.meta as { title?: string })?.title || column.id;
                const isVisible = column.getIsVisible();
                return (
                  <CommandItem
                    key={column.id}
                    value={title}
                    onSelect={() => column.toggleVisibility(!isVisible)}
                    data-testid={`toggle-column-${column.id}`}
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
                    <span>{title}</span>
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

'use client';

import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

import type { DataTableColumnHeaderProps } from './types';

/**
 * Header de columna con soporte para sorting y ocultamiento
 *
 * @example
 * ```tsx
 * // En la definición de columnas
 * {
 *   accessorKey: 'name',
 *   header: ({ column }) => (
 *     <DataTableColumnHeader column={column} title="Nombre" />
 *   ),
 * }
 * ```
 */
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
            data-testid={`column-header-${column.id}`}
          >
            <span>{title}</span>
            {column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={() => column.toggleSorting(false)}
            data-testid={`sort-asc-${column.id}`}
          >
            <ArrowUp className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Ascendente
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => column.toggleSorting(true)}
            data-testid={`sort-desc-${column.id}`}
          >
            <ArrowDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Descendente
          </DropdownMenuItem>
          {column.getCanHide() && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => column.toggleVisibility(false)}
                data-testid={`hide-column-${column.id}`}
              >
                <EyeOff className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                Ocultar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

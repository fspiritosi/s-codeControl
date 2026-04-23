'use client';

import * as React from 'react';
import type { Column } from '@tanstack/react-table';
import { Search, X } from 'lucide-react';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import { Separator } from '@/shared/components/ui/separator';
import { cn } from '@/shared/lib/utils';

interface DataTableTextFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title: string;
  placeholder?: string;
}

function getDisplayValue(filterValue: unknown): string {
  if (filterValue == null) return '';
  if (Array.isArray(filterValue)) return filterValue.join(', ');
  return String(filterValue);
}

export function DataTableTextFilter<TData, TValue>({
  column,
  title,
  placeholder,
}: DataTableTextFilterProps<TData, TValue>) {
  const rawValue = column?.getFilterValue();
  const currentValue = getDisplayValue(rawValue);
  const [inputValue, setInputValue] = React.useState(currentValue);
  const hasValue = !!currentValue;

  React.useEffect(() => {
    setInputValue(currentValue);
  }, [currentValue]);

  const applyFilter = (value: string) => {
    const trimmed = value.trim();
    if (!column) return;
    if (trimmed) {
      column.setFilterValue(trimmed);
    } else {
      column.setFilterValue(undefined);
    }
  };

  const clearFilter = () => {
    setInputValue('');
    applyFilter('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      applyFilter(inputValue);
    }
    if (e.key === 'Escape') {
      setInputValue(currentValue);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('h-8 border-dashed gap-1.5', hasValue && 'border-solid')}
        >
          <Search className="h-3.5 w-3.5" />
          {title}
          {hasValue && (
            <>
              <Separator orientation="vertical" className="mx-0.5 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal max-w-[120px] truncate"
              >
                {currentValue}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Filtrar por {title.toLowerCase()}
          </p>
          <div className="flex gap-2">
            <Input
              placeholder={placeholder ?? `Buscar ${title.toLowerCase()}...`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-8 text-sm"
              autoFocus
            />
            <Button size="sm" className="h-8 shrink-0" onClick={() => applyFilter(inputValue)}>
              Aplicar
            </Button>
          </div>
          {hasValue && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7"
              onClick={clearFilter}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

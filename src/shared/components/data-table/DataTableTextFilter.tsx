'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

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

interface DataTableTextFilterProps {
  columnId: string;
  title: string;
  placeholder?: string;
}

export function DataTableTextFilter({
  columnId,
  title,
  placeholder,
}: DataTableTextFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const currentValue = searchParams.get(columnId) ?? '';
  const [inputValue, setInputValue] = React.useState(currentValue);
  const hasValue = !!currentValue;

  React.useEffect(() => {
    setInputValue(currentValue);
  }, [currentValue]);

  const applyFilter = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set(columnId, value.trim());
    } else {
      params.delete(columnId);
    }
    params.set('page', '1');
    router.replace(`${pathname}?${params.toString()}`);
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

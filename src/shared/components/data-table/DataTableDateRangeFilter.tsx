'use client';

import * as React from 'react';
import { CalendarIcon, X } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { format } from 'date-fns';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Calendar } from '@/shared/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import { Separator } from '@/shared/components/ui/separator';
import { cn } from '@/shared/lib/utils';

interface DataTableDateRangeFilterProps {
  columnId: string;
  title: string;
}

export function DataTableDateRangeFilter({
  columnId,
  title,
}: DataTableDateRangeFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const fromKey = `${columnId}_from`;
  const toKey = `${columnId}_to`;

  const fromValue = searchParams.get(fromKey);
  const toValue = searchParams.get(toKey);

  const fromDate = fromValue ? new Date(fromValue) : undefined;
  const toDate = toValue ? new Date(toValue) : undefined;

  const hasValue = !!(fromValue || toValue);

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.replace(`${pathname}?${params.toString()}`);
  };

  const clearFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(fromKey);
    params.delete(toKey);
    params.set('page', '1');
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('h-8 border-dashed gap-1.5', hasValue && 'border-solid')}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          {title}
          {hasValue && (
            <>
              <Separator orientation="vertical" className="mx-0.5 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                {fromValue && toValue
                  ? `${format(new Date(fromValue), 'dd/MM')} - ${format(new Date(toValue), 'dd/MM')}`
                  : fromValue
                    ? `Desde ${format(new Date(fromValue), 'dd/MM')}`
                    : `Hasta ${format(new Date(toValue!), 'dd/MM')}`}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Desde</p>
            <Calendar
              mode="single"
              selected={fromDate}
              onSelect={(date) =>
                updateParam(fromKey, date ? format(date, 'yyyy-MM-dd') : null)
              }
              initialFocus
            />
          </div>
          <Separator />
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Hasta</p>
            <Calendar
              mode="single"
              selected={toDate}
              onSelect={(date) =>
                updateParam(toKey, date ? format(date, 'yyyy-MM-dd') : null)
              }
            />
          </div>
          {hasValue && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7"
              onClick={clearFilter}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Limpiar fechas
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

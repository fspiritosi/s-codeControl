'use client';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { es } from 'date-fns/locale';

interface FormItemDatePickerProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  label: string;
  description?: string;
  className?: string;
}

export function FormItemDatePicker<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  description,
  className,
  ...props
}: FormItemDatePickerProps<TFieldValues> & Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue'>) {
  return (
    <FormItem className={className} {...props}>
      <FormLabel>{label}</FormLabel>
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <FormControl>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !field.value && 'text-muted-foreground',
                    error && 'border-red-500'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {field.value?.from ? (
                    field.value.to ? (
                      <>
                        {format(field.value.from, 'dd MMM yyyy', { locale: es })} -{' '}
                        {format(field.value.to, 'dd MMM yyyy', { locale: es })}
                      </>
                    ) : (
                      format(field.value.from, 'dd MMM yyyy', { locale: es })
                    )
                  ) : (
                    <span>Selecciona un rango de fechas</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={field.value?.from}
                  selected={field.value}
                  onSelect={(selectedDateRange) => {
                    field.onChange(selectedDateRange);
                    field.onBlur(); // Trigger validation
                  }}
                  numberOfMonths={2}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </FormControl>
        )}
      />
      {description && <FormDescription>{description}</FormDescription>}
      <FormMessage />
    </FormItem>
  );
}
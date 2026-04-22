'use client';

import { CheckboxDefaultValues } from '@/shared/components/common/CheckboxDefValues';
import { SelectWithData } from '@/shared/components/common/SelectWithData';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Calendar } from '@/shared/components/ui/calendar';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { ImageHander } from '@/shared/components/common/ImageHandler';
import { cn } from '@/shared/lib/utils';
import { names } from '@/shared/types/types';
import { CalendarIcon } from '@radix-ui/react-icons';
import { es } from 'date-fns/locale';
import { parse as dateFnsParse, format } from 'date-fns';
import { ChangeEvent } from 'react';
import { UseFormReturn } from 'react-hook-form';

interface EmployeePersonalDataTabProps {
  form: UseFormReturn<any>;
  PERSONALDATA: any[];
  readOnly: boolean;
  accordion1Errors: boolean;
  handleImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  base64Image: string;
  today: Date;
  month: Date;
  setMonth: (v: Date) => void;
  yearsAhead: number[];
  years: string;
  setYear: (v: string) => void;
}

export function EmployeePersonalDataTab({
  form,
  PERSONALDATA,
  readOnly,
  accordion1Errors,
  handleImageChange,
  base64Image,
  today,
  month,
  setMonth,
  yearsAhead,
  years,
  setYear,
}: EmployeePersonalDataTabProps) {
  return (
    <>
      {accordion1Errors && (
        <Badge className="h-6 hover:no-underline" variant="destructive">
          Falta corregir algunos campos
        </Badge>
      )}
      <div className="min-w-full max-w-sm flex flex-wrap gap-8 items-center">
        {PERSONALDATA?.map((data) => {
          if (data.name === 'born_date') {
            return (
              <div key={data.name} className="w-[300px] flex flex-col gap-2">
                <FormField
                  control={form.control}
                  name="born_date"
                  render={({ field }) => {
                    const value = field.value;
                    if (value === 'undefined/undefined/undefined' || value === 'Invalid Date') {
                      field.value = '';
                    }
                    return (
                      <FormItem className="flex flex-col">
                        <FormLabel>
                          Fecha de nacimiento <span style={{ color: 'red' }}> *</span>
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                disabled={readOnly}
                                variant="outline"
                                className={cn(
                                  'w-[300px] pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(dateFnsParse(String(field.value), 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy')
                                ) : (
                                  <span>Elegir fecha</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="flex w-full flex-col space-y-2 p-2" align="start">
                            <Select
                              onValueChange={(e) => {
                                setMonth(new Date(e));
                                setYear(e);
                                const newYear = parseInt(e, 10);
                                const dateWithNewYear = new Date(field.value);
                                dateWithNewYear.setFullYear(newYear);
                                field.onChange(dateWithNewYear);
                                setMonth(dateWithNewYear);
                              }}
                              value={years || today.getFullYear().toString()}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Elegir ano" />
                              </SelectTrigger>
                              <SelectContent position="popper">
                                <SelectItem
                                  value={today.getFullYear().toString()}
                                  disabled={years === today.getFullYear().toString()}
                                >
                                  {today.getFullYear().toString()}
                                </SelectItem>
                                {yearsAhead?.map((year) => (
                                  <SelectItem key={year} value={`${year}`}>
                                    {year}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Calendar
                              month={month}
                              onMonthChange={setMonth}
                              toDate={today}
                              locale={es}
                              mode="single"
                              selected={
                                field.value
                                  ? dateFnsParse(String(field.value), 'yyyy-MM-dd', new Date())
                                  : today
                              }
                              onSelect={(e) => {
                                field.onChange(e);
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
            );
          }
          if (data.type === 'file') {
            return (
              <div key={data.name} className="w-[300px] flex  gap-2">
                <FormField
                  control={form.control}
                  name={data.name as names}
                  render={({ field }) => (
                    <FormItem className="">
                      <FormControl>
                        <div className="flex lg:items-center flex-wrap md:flex-nowrap flex-col lg:flex-row gap-8">
                          <ImageHander
                            labelInput="Subir foto"
                            handleImageChange={handleImageChange}
                            base64Image={base64Image}
                            disabled={readOnly}
                            inputStyle={{
                              width: '400px',
                              maxWidth: '300px',
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            );
          }
          if (data.type === 'select') {
            return (
              <div key={data.name} className="w-[300px] flex flex-col gap-2">
                <FormField
                  control={form.control}
                  name={data.name as names}
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormLabel>
                          {data.label}
                          <span style={{ color: 'red' }}> *</span>
                        </FormLabel>
                        <SelectWithData
                          disabled={readOnly}
                          placeholder={data.placeholder}
                          options={data.options}
                          onChange={field.onChange}
                          editing={true}
                          value={field.value || ''}
                          field={{ ...field }}
                        />
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
            );
          } else {
            return (
              <div key={data.name} className="w-[300px] flex flex-col gap-2 ">
                <FormField
                  control={form.control}
                  name={data.name as names}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {data.label}
                        <span style={{ color: 'red' }}> *</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          disabled={readOnly}
                          type={data.type}
                          id={data.label}
                          placeholder={data.placeholder}
                          className="w-[300px"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            );
          }
        })}
      </div>
    </>
  );
}

'use client';

import { CheckboxDefaultValues } from '@/components/CheckboxDefValues';
import { SelectWithData } from '@/components/SelectWithData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AddCategoryModal from '@/components/AddCategoryModal';
import AddCovenantModal from '@/components/AddCovenantModal';
import AddGuildModal from '@/components/AddGuildModal';
import { cn } from '@/lib/utils';
import { names } from '@/types/types';
import { CalendarIcon } from '@radix-ui/react-icons';
import { es } from 'date-fns/locale';
import { parse as dateFnsParse, format } from 'date-fns';
import { Check } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

interface EmployeeLaboralDataTabProps {
  form: UseFormReturn<any>;
  LABORALDATA: any[];
  readOnly: boolean;
  accordion3Errors: boolean;
  role: string | null;
  guildId: string | undefined;
  covenantsId: string | undefined;
  guild: any;
  covenants: any;
  today: Date;
  month: Date;
  setMonth: (v: Date) => void;
  yearsAhead: number[];
  years: string;
  setYear: (v: string) => void;
}

export function EmployeeLaboralDataTab({
  form,
  LABORALDATA,
  readOnly,
  accordion3Errors,
  role,
  guildId,
  covenantsId,
  guild,
  covenants,
  today,
  month,
  setMonth,
  yearsAhead,
  years,
  setYear,
}: EmployeeLaboralDataTabProps) {
  return (
    <>
      {accordion3Errors && (
        <Badge className="h-6" variant="destructive">
          Faltan corregir algunos campos
        </Badge>
      )}
      <div className="min-w-full max-w-sm flex flex-wrap gap-8">
        {LABORALDATA?.map((data) => {
          if (data.name === 'date_of_admission') {
            return (
              <div key={data.name} className="w-[300px] flex flex-col gap-2">
                <FormField
                  control={form.control}
                  name="date_of_admission"
                  render={({ field }) => {
                    const value = field.value;
                    if (value === 'undefined/undefined/undefined' || value === 'Invalid Date') {
                      field.value = '';
                    }
                    return (
                      <FormItem className="flex flex-col">
                        <FormLabel>
                          Fecha de ingreso <span style={{ color: 'red' }}> *</span>
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
                                <SelectValue placeholder="Elegir año" />
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
          if (data.type === 'select') {
            const isMultiple = data.name === 'allocated_to' ? true : false;
            if (isMultiple) {
              return (
                <div key={data.name}>
                  {role === 'Invitado' ? null : (
                    <div className="w-[300px] flex flex-col gap-2 justify-center">
                      <FormField
                        control={form.control}
                        name={data.name as names}
                        render={({ field }) => (
                          <CheckboxDefaultValues
                            disabled={readOnly}
                            options={data.options}
                            required={true}
                            field={field}
                            placeholder="Afectado a"
                          />
                        )}
                      />
                    </div>
                  )}
                </div>
              );
            }
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
                        <FormControl>
                          <SelectWithData
                            disabled={readOnly}
                            placeholder={data.placeholder}
                            isMultiple={isMultiple}
                            options={data.options}
                            field={{ ...field }}
                            onChange={(event: any) => {
                              field.onChange(event);
                            }}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
            );
          } else if (data.type === 'combobox') {
            return (
              <FormField
                key={data.name}
                control={form.control}
                name={data.name as names}
                render={({ field }) => {
                  let disabled = readOnly;
                  if (field.name === 'guild_id') {
                    disabled = readOnly;
                  } else if (field.name === 'covenants_id') {
                    disabled = readOnly || !guildId;
                  } else if (field.name === 'category_id') {
                    disabled = readOnly || !covenantsId;
                  }

                  let selectedCovenantInfo = [{ name: '', id: '' }];
                  const selectedGuildInfo =
                    guild
                      ?.filter((e: any) => e.value === guildId)
                      ?.map((e: any) => {
                        selectedCovenantInfo = [{ name: '', id: '' }];
                        return { name: e.label, id: e.value };
                      }) || [];
                  selectedCovenantInfo =
                    covenants
                      ?.filter((e: any) => e.id === covenantsId)
                      .map((e: any) => {
                        return { name: e.name, id: e.id };
                      }) || [];

                  return (
                    <FormItem className="flex flex-col w-[300px]">
                      <FormLabel>{data.label}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              disabled={disabled}
                              value={field.value || ''}
                              className={cn(
                                'w-[300px] justify-between truncate',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value
                                ? (data?.options?.find((option: any) => option.value === field.value) as any)
                                    ?.label || field.value
                                : `Seleccionar ${data.label}`}
                              <Check className="ml-2 h-4 w-4 shrink-0 opacity-50 " />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="p-0">
                          <Command>
                            <CommandInput placeholder={`Buscar ${data.label}...`} />
                            <CommandList>
                              <CommandEmpty>Sin resultados</CommandEmpty>
                              <CommandGroup>
                                {data?.options?.map((option: any) => (
                                  <CommandItem
                                    value={option.label}
                                    key={option.value}
                                    onSelect={() => {
                                      form.setValue(`${data.name as names}`, option.value);
                                      if (field.name === 'guild_id') {
                                        form.setValue('covenants_id', '');
                                        form.setValue('category_id', '');
                                      }
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        option.value === field.value ? 'opacity-100' : 'opacity-0'
                                      )}
                                    />
                                    {option.label}
                                  </CommandItem>
                                ))}
                                <CommandItem>
                                  {(field.name === 'guild_id' && <AddGuildModal fromEmployee />) ||
                                    (field.name === 'covenants_id' && (
                                      <AddCovenantModal fromEmployee guildInfo={selectedGuildInfo[0]} />
                                    )) ||
                                    (field.name === 'category_id' && (
                                      <AddCategoryModal fromEmployee covenantInfo={selectedCovenantInfo[0]} />
                                    ))}
                                </CommandItem>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            );
          } else {
            return (
              <div key={data.name} className="w-[300px] flex flex-col gap-2">
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
                          pattern={data.pattern}
                          className="w-[300px]"
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

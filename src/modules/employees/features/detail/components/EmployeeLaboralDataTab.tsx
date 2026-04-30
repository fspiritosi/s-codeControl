'use client';

import { CheckboxDefaultValues } from '@/shared/components/common/CheckboxDefValues';
import { SelectWithData } from '@/shared/components/common/SelectWithData';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Calendar } from '@/shared/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/shared/components/ui/command';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import AddCategoryModal from '@/modules/company/features/covenants/components/AddCategoryModal';
import AddCovenantModal from '@/modules/company/features/covenants/components/AddCovenantModal';
import AddGuildModal from '@/modules/company/features/covenants/components/AddGuildModal';
import { cn } from '@/shared/lib/utils';
import { names } from '@/shared/types/types';
import { CalendarIcon } from '@radix-ui/react-icons';
import { es } from 'date-fns/locale';
import { parse as dateFnsParse, format, isValid as isValidDate, intervalToDuration } from 'date-fns';

function normalizeDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isValidDate(value) ? value : null;
  if (typeof value === 'string') {
    const iso = new Date(value);
    if (isValidDate(iso)) return iso;
    const parsed = dateFnsParse(value, 'yyyy-MM-dd', new Date());
    return isValidDate(parsed) ? parsed : null;
  }
  return null;
}

function formatSeniority(start: Date | null, end: Date | null): string {
  if (!start) return '—';
  const reference = end ?? new Date();
  if (reference < start) return '—';
  const { years = 0, months = 0, days = 0 } = intervalToDuration({ start, end: reference });
  const parts: string[] = [];
  parts.push(`${years} ${years === 1 ? 'año' : 'años'}`);
  parts.push(`${months} ${months === 1 ? 'mes' : 'meses'}`);
  parts.push(`${days} ${days === 1 ? 'día' : 'días'}`);
  return parts.join(', ');
}
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
            const watchedAdmission = form.watch('date_of_admission');
            const watchedTermination = form.watch('termination_date');
            const seniority = formatSeniority(
              normalizeDate(watchedAdmission),
              normalizeDate(watchedTermination)
            );
            return (
              <div key={data.name} className="w-[300px] flex flex-col gap-2">
                <FormField
                  control={form.control}
                  name="date_of_admission"
                  render={({ field }) => {
                    const normalized = normalizeDate(field.value);
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
                                  !normalized && 'text-muted-foreground'
                                )}
                              >
                                {normalized ? (
                                  format(normalized, 'dd/MM/yyyy')
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
                                const newYear = parseInt(e, 10);
                                const base = normalized ?? new Date();
                                const dateWithNewYear = new Date(base);
                                dateWithNewYear.setFullYear(newYear);
                                setYear(e);
                                setMonth(dateWithNewYear);
                                field.onChange(dateWithNewYear);
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
                              selected={normalized ?? today}
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
                <div className="rounded-md border bg-muted/30 px-3 py-2">
                  <p className="text-xs text-muted-foreground">Antigüedad</p>
                  <p className="text-sm font-medium">{seniority}</p>
                </div>
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

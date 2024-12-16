'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { handleSupabaseError } from '@/lib/errorHandler';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { cn } from '@/lib/utils';
import { CalendarIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import { addMonths, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Calendar } from './ui/calendar';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export default function ReplaceDocument({
  documentName,
  resource,
  id,
  expires,
  montly,
  appliesId,
}: {
  documentName: string | null;
  resource: string | null;
  id: string;
  expires: string | null;
  montly: string | null;
  appliesId: string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const FormSchema = z.object({
    reeplace_document: z.string({ required_error: 'El documento es requerido' }),
    validity: expires
      ? z.date({ invalid_type_error: 'Se debe elegir una fecha', required_error: 'Se debe elegir una fecha' })
      : z.string().optional(),
    period: montly ? z.string({ required_error: 'El periodo es requerido' }).optional() : z.string().optional(),
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      reeplace_document: '',
      validity: expires ?? '',
      period: montly ?? '',
    },
  });
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const today = new Date();
  const nextMonth = addMonths(new Date(), 1);
  const [month, setMonth] = useState<Date>(nextMonth);
  const supabase = supabaseBrowser();

  const yearsAhead = Array.from({ length: 20 }, (_, index) => {
    const year = today.getFullYear() + index + 1;
    return year;
  });
  const [years, setYear] = useState(today.getFullYear().toString());

  async function onSubmit(filename: z.infer<typeof FormSchema>) {
    if (!file) {
      form.setError('reeplace_document', {
        type: 'manual',
        message: 'El documento es requerido',
      });
      return;
    }
    if (!documentName) return;
    const tableName =
      resource === 'employee'
        ? 'documents_employees'
        : resource === 'company'
          ? 'documents_company'
          : 'documents_equipment';

    toast.promise(
      async () => {
        if (!documentName) return;
        const newExtension = file.name.split('.').pop();
        let newDocumentName = documentName.split('.')[0];

        const dateRegex = /\((\d{2}-\d{2}-\d{4})\)\./;

        if (dateRegex.test(documentName)) {
          const newDate = format(filename.validity as Date, 'dd/MM/yyyy').replaceAll('/', '-');
          newDocumentName = newDocumentName.replace(dateRegex, `(${newDate})`) + `.${newExtension}`;
        } else {
          newDocumentName = newDocumentName + `.${newExtension}`;
        }

        const { error, data: response } = await supabase.storage.from('document_files').remove([documentName]);

        const { data: respons2e } = await supabase.storage
          .from('document_files')
          .list(documentName?.split('/')?.slice(0, 2).join('/'), {
            search: `/${documentName?.split('/')?.slice(3).join('/').split('.')[0]}`,
          });

        if (error) {
          console.log(error);
          throw new Error(handleSupabaseError(error.message));
        }

        const { error: finalerror, data: finalDocument } = await supabase.storage
          .from('document_files')
          .upload(newDocumentName, file, {
            cacheControl: '3600',
            upsert: true,
          });

        // console.log('filename.validity', filename.validity ? format(filename.validity as Date, 'dd/MM/yyyy') : null);

        const { error: updateError } = await supabase
          .from(tableName)
          .update({
            document_path: finalDocument?.path,
            validity: filename.validity ? new Date(filename.validity).toISOString() : null,
            created_at: new Date().toISOString(),
          })
          .eq('id', appliesId || '');

        if (updateError) {
          //console.log(updateError);
          throw new Error(handleSupabaseError(updateError?.message));
        }

        if (finalerror) {
          //console.log(finalerror);
          throw new Error(handleSupabaseError(finalerror?.message));
        }

        router.refresh();
        if (resource === 'company') {
          router.push('/dashboard/company/actualCompany');
        } else {
          router.push('/dashboard/document');
        }
        setIsOpen(false);
      },
      {
        loading: 'Reemplazando...',
        success: 'Documento reemplazado correctamente (puede tardar unos minutos para que se actualice)',
        error: (error) => {
          return error;
        },
      }
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}>
      <DialogTrigger asChild>
        <Button variant={'outline'} className="border-2 ">
          Reemplazar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] dark:bg-slate-950">
        <DialogHeader>
          <DialogTitle>Reemplazar documento</DialogTitle>
        </DialogHeader>
        <div className="grid w-full gap-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className=" space-y-6">
              <div className="flex flex-col">
                <FormField
                  control={form.control}
                  name="reeplace_document"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nuevo Documento</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => {
                            setFile(e.target.files?.[0] || null);
                            field.onChange(e);
                          }}
                          type="file"
                        />
                      </FormControl>
                      <FormDescription>Sube el nuevo documento</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {expires && (
                  <FormField
                    control={form.control}
                    name="validity"
                    render={({ field }) => (
                      <FormItem className="flex flex-col mt-4">
                        <FormLabel>Fecha de vencimiento</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={'outline'}
                                className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                              >
                                {typeof field.value === 'string' && field.value !== '' ? (
                                  field.value
                                ) : typeof field.value === 'object' ? (
                                  format(field.value, 'dd/MM/yyyy')
                                ) : (
                                  <span>Seleccionar fecha de vencimiento</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2" align="center">
                            <Select
                              onValueChange={(e) => {
                                setMonth(new Date(e));
                                setYear(e);
                                const newYear = parseInt(e, 10);
                                const dateWithNewYear = new Date(field.value || '');
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
                              fromDate={today}
                              locale={es}
                              mode="single"
                              selected={new Date(field.value || '')}
                              onSelect={(e) => {
                                if (!e) return;
                                form.setValue('validity', e.toISOString());
                                field.onChange(e);
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>La fecha de vencimiento del documento</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {montly && (
                  <FormField
                    control={form.control}
                    name="period"
                    render={({ field }) => (
                      <FormItem className="flex flex-col mt-4">
                        <FormLabel>Periodo</FormLabel>
                        <Input
                          placeholder="Seleccionar periodo"
                          type="month"
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => {
                            form.setValue('period', e.target.value);
                          }}
                        />
                        <FormDescription>El periodo del documento</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <div className="text-blue-500 flex items-center">
                  <InfoCircledIcon className="size-7 inline-block mr-2" />
                  <FormDescription className="text-blue-500 mt-4">
                    Este nuevo documento reemplazara el anterior. El documento actual sera eliminado y no podra ser
                    recuperado.
                  </FormDescription>
                </div>

                <Button type="submit" variant="default" className="self-end mt-5">
                  Reemplazar
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { handleSupabaseError } from '@/lib/errorHandler';
import { cn } from '@/lib/utils';
import { useLoggedUserStore } from '@/store/loggedUser';
import { CalendarIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import { addMonths, format } from 'date-fns';
import { es } from 'date-fns/locale';
import moment from 'moment';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../supabase/supabase';
import { Calendar } from './ui/calendar';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export default function UpdateDocuments({
  documentName,
  resource,
  id,
  expires,
  montly,
}: {
  documentName: string | null;
  resource: string | null;
  id: string;
  expires: boolean;
  montly: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const FormSchema = z.object({
    new_document: z.string({ required_error: 'El documento es requerido' }),
    validity: expires ? z.date({ invalid_type_error: 'Se debe elegir una fecha' }) : z.string().optional(),
    period: montly ? z.string({ required_error: 'El periodo es requerido' }) : z.string().optional(),
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      validity: '',
      new_document: '',
      period: '',
    },
  });
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const today = new Date();
  const nextMonth = addMonths(new Date(), 1);
  const [month, setMonth] = useState<Date>(nextMonth);

  const yearsAhead = Array.from({ length: 20 }, (_, index) => {
    const year = today.getFullYear() + index + 1;
    return year;
  });
  const [years, setYear] = useState(today.getFullYear().toString());
  async function onSubmit(filename: z.infer<typeof FormSchema>) {
    if (!file) {
      form.setError('new_document', {
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
        
        const versionRegex = /\(v(\d+)\)/;
        const dateRegex = /\((\d{2}-\d{2}-\d{4})\)\./;
        const periodRegex = /\((\d{4}-\d{2})\)/;

        let newDocumentName = documentName;
        const newExtension = file.name.split('.').pop();

        if (versionRegex.test(documentName)) {
          const match = documentName.match(versionRegex);
          if (match) {
            const currentVersion = parseInt(match[1], 10);
            const newVersion = currentVersion + 1;
            const name = documentName.split('.')[0];
            newDocumentName = name.replace(versionRegex, `(v${newVersion})`) + `.${newExtension}`;
          }
        } else if (dateRegex.test(documentName)) {
          const newDate = moment(filename.validity).format('DD-MM-YYYY');
          newDocumentName = documentName.replace(dateRegex, `(${newDate})` + `.${newExtension}`);
        } else if (periodRegex.test(documentName)) {
          const newPeriod = filename.period;
          newDocumentName = documentName.replace(periodRegex, `(${newPeriod})`) + `.${newExtension}`;
        }

        if (montly) {
          const { error: newDocumentError, data } = await supabase.storage
            .from('document_files')
            .upload(newDocumentName, file, { upsert: true });

          const { error: updateError } = await supabase
            .from(tableName)
            .update({
              document_path: data?.path,
              period: filename.period,
              created_at: new Date(),
              state:'presentado'
            })
            .eq('document_path', documentName);

          if (updateError) {
            //console.log(updateError);
            throw new Error(handleSupabaseError(updateError.message));
          }

          if (newDocumentError) {
            // console.log(newDocumentError);
            throw new Error(handleSupabaseError(newDocumentError.message));
          }
          return;
        }

        //console.log(documentName);

        const { data: fileData, error: downloadError } = await supabase.storage
          .from('document_files')
          .download(documentName);

        if (downloadError) {
          // console.log(downloadError);
          throw new Error(handleSupabaseError(downloadError.message));
        }

        const { error: uploadError } = await supabase.storage
          .from('document_files_expired')
          .upload(documentName, fileData, { upsert: true });

        if (uploadError) {
          // console.log(uploadError);
          throw new Error(handleSupabaseError(uploadError.message));
        }

        const { error: deleteError } = await supabase.storage.from('document_files').remove([documentName]);

        if (deleteError) {
          //  console.log(deleteError);
          throw new Error(handleSupabaseError(deleteError.message));
        }

        const { error: newDocumentError, data: finalDocument } = await supabase.storage
          .from('document_files')
          .upload(newDocumentName, file, { upsert: true });

        const { error: updateError } = await supabase
          .from(tableName)
          .update({
            document_path: finalDocument?.path,
            validity: filename.validity ? new Date(filename.validity).toISOString() : null,
            created_at: new Date(),
            state:'presentado'
          })
          .eq('id', id);

        if (updateError) {
          //console.log(updateError);
          throw new Error(handleSupabaseError(updateError.message));
        }
        if (newDocumentError) {
          // console.log(newDocumentError);
          throw new Error(handleSupabaseError(newDocumentError.message));
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
        loading: 'Renovando...',
        success: () => {
          router.refresh();
          if (resource === 'company') {
            router.push('/dashboard/company/actualCompany');
          } else {
            router.push('/dashboard/document');
          }
          setIsOpen(false);
          return 'Documento renovado correctamente';
        },
        error: (error) => {
          return error;
        },
      }
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}>
      <DialogTrigger asChild>
        <Button>Renovar </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] dark:bg-slate-950">
        <DialogHeader>
          <DialogTitle>Renovar documento</DialogTitle>
        </DialogHeader>
        <div className="grid w-full gap-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className=" space-y-6">
              <div className="flex flex-col ">
                <div className="flex flex-col gap-4">
                  <FormField
                    control={form.control}
                    name="new_document"
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
                                  {field.value ? (
                                    format(field.value, 'PPP', { locale: es })
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
                        <FormItem className="flex flex-col">
                          <FormLabel>Periodo</FormLabel>
                          <Input
                            placeholder="Elige una periodo"
                            type="month"
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => {
                              form.setValue('period', e.target.value);
                            }}
                            defaultValue={field.value}
                          />
                          <FormDescription>La fecha de vencimiento del documento</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="text-blue-500 flex items-center">
                  <InfoCircledIcon className="size-7 inline-block mr-2" />
                  <FormDescription className="text-blue-500 mt-4">
                    Este nuevo documento sera el nuevo documento vigente y el anterior sera almacenado en la historia.
                  </FormDescription>
                </div>

                <Button type="submit" variant="default" className="self-end mt-5">
                  Renovar
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

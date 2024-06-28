'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useLoggedUserStore } from '@/store/loggedUser';
import { CalendarIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import { addMonths, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
}: {
  documentName: string | null;
  resource: string | null;
  id: string;
  expires: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const FormSchema = z.object({
    new_document: z.string({ required_error: 'El documento es requerido' }),
    validity: expires ? z.date({ invalid_type_error: 'Se debe elegir una fecha' }) : z.string().optional(),
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      validity: '',
      new_document: '',
    },
  });
  const router = useRouter();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const today = new Date();
  const nextMonth = addMonths(new Date(), 1);
  const [month, setMonth] = useState<Date>(nextMonth);
  const fetchDocuments = useLoggedUserStore((state) => state.documetsFetch);

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
    const fileExtension1 = file.name.split('.').pop();
    const tableName =
      resource === 'vehicle'
        ? 'documents_equipment'
        : resource === 'company'
          ? 'documents_company'
          : 'documents_employees';

    const numberVersion = parseInt(documentName?.match(/-v(\d+)/)?.[1] || '0');
    const version = expires ? format(new Date(), 'dd/MM/yyyy') : `v${numberVersion! + 1}`;
    let documentNameWithOutExtension = documentName?.split('.').shift();
    if (expires) {
      documentNameWithOutExtension = documentName?.replace(/-\d{4}-\d{2}-\d{2}(?:\.\w+)?$/, '');
    } else {
      documentNameWithOutExtension = documentName?.replace(/-v\d+(?:\.\w+)?$/, '');
    }

    const { error: storageError, data } = await supabase.storage
      .from('document_files')
      .upload(`/${documentNameWithOutExtension}-${version.replaceAll('/', '-')}.${fileExtension1}`, file, {
        cacheControl: '0',
        upsert: true,
      })

    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        state: 'presentado',
        deny_reason: null,
        document_path: data?.path,
        validity: filename.validity ? new Date(filename.validity).toLocaleDateString('es-ES') : null,
      })
      .match({ id });

    if (storageError) {
      toast({
        title: 'Error',
        description: 'Hubo un error al subir el documento',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Documento actualizado',
      description: 'El documento se ha actualizado correctamente',
      variant: 'default',
    });
    fetchDocuments;
    if (resource === 'company') {
      router.push('/dashboard/company/actualCompany');
    } else {
      router.push('/dashboard/document');
    }
    setIsOpen(false);
  }
  return (
    <Dialog open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}>
      <DialogTrigger asChild>
        <Button>Actualizar documento</Button>
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
                <div className="text-blue-500 flex items-center">
                  <InfoCircledIcon className="size-7 inline-block mr-2" />
                  <FormDescription className="text-blue-500 mt-4">
                    Este nuevo documento reemplazara el anterior, asegurate de que sea el correcto.
                  </FormDescription>
                </div>

                <Button type="submit" variant="default" className="self-end mt-5">
                  Actualizar
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

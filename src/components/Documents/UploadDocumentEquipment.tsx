'use client';
import { z } from 'zod';
import { CardTitle } from '../ui/card';

import { Check, ChevronsUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { calculateNameOFDocument, cn, uploadDocument, uploadDocumentFile } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import moment from 'moment';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Database } from '../../../database.types';
import { EnhancedDatePicker } from '../ui/enhanced-datepicket';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { YearMonthPicker } from '../ui/year-month-picker';

function UploadDocumentEquipment({
  equipments,
  allDocumentTypes,
  currentCompany,
  user_id,
  default_id,
}: {
  equipments: { label: string; value: string }[];
  allDocumentTypes: DocumentTypes[];
  currentCompany: Company[];
  user_id: string | undefined;
  default_id?: string;
}) {
  const supabase = supabaseBrowser();
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentTypes | undefined>(undefined);
  const uploadDocumentSchema = z.object({
    applies: z
      .string({
        required_error: 'Este campo es requerido',
      })
      .uuid(),
    document_path: z.string({
      required_error: 'Este campo es requerido',
    }),
    created_at: z.string().default(() => new Date().toISOString()),
    state: z.enum(['pendiente', 'presentado', 'rechazado', 'aprobado', 'vencido']).default('presentado'),
    validity: selectedDocumentType?.explired
      ? z.string({
          required_error: 'Este campo es requerido',
        })
      : z.string().optional(), //! esto debe ser dinamico
    id_document_types: z
      .string({
        required_error: 'Este campo es requerido',
      })
      .uuid(),
    user_id: z
      .string()
      .uuid()
      .default(user_id || ''),
    period: selectedDocumentType?.is_it_montlhy
      ? z.string({
          required_error: 'Este campo es requerido',
        })
      : z.string().optional(),
  });
  const router = useRouter();

  const form = useForm<z.infer<typeof uploadDocumentSchema>>({
    resolver: zodResolver(uploadDocumentSchema),
    defaultValues: {
      applies: default_id || '',
    },
  });
  const [documenTypes, setDocumentTypes] = useState<typeof allDocumentTypes>(allDocumentTypes);

  const handleTypeFilter = (value: string) => {
    if (value === 'Ambos') setDocumentTypes(allDocumentTypes);
    if (value === 'Permanentes') setDocumentTypes(allDocumentTypes?.filter((e) => !e.is_it_montlhy) || []);
    if (value === 'Mensuales') setDocumentTypes(allDocumentTypes?.filter((e) => e.is_it_montlhy) || []);
  };

  async function onSubmit(data: z.infer<typeof uploadDocumentSchema>) {
    if (!selectedFile) return;
    const selectedDocumentType = allDocumentTypes.find((documentType) => documentType.id === data.id_document_types);
    try {
      await uploadDocument(data, selectedDocumentType?.mandatory!, 'documents_equipment', false);
      await uploadDocumentFile(selectedFile, data.document_path);
      form.reset();
      setSelectedFile(undefined);
      setSelectedDocumentType(undefined);
      router.refresh();
      document.getElementById('close-create-document-modal')?.click();
    } catch (error) {
      console.error('error', error);
    }
  }

  const fetchSelectedEquipmentDocuments = async () => {
    if (default_id) {
      const { data, error } = await supabase
        .from('documents_equipment')
        .select('*')
        .eq('applies', default_id)
        .neq('document_path', null);

      if (error) {
        console.error('error', error);
        return;
      }

      console.log(data, 'data');
      setSelectedResourceDocuments(data);
    }
  };
  useEffect( () => { 
    fetchSelectedEquipmentDocuments();
  }, [default_id]);

  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [selectedResourceDocuments, setSelectedResourceDocuments] = useState<
    Database['public']['Tables']['documents_equipment']['Row'][]
  >([]);

  //console.log('error', form.formState.errors);
  return (
    <div>
      <CardTitle className="mb-3">Documento no multirecurso</CardTitle>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 overflow-y-auto max-h-[80vh]">
          <FormField
            control={form.control}
            name="applies"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Equipo</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        disabled={default_id ? true : false}
                        role="combobox"
                        className={cn(' justify-between', !field.value && 'text-muted-foreground')}
                      >
                        {field.value
                          ? equipments.find((language) => language.value === field.value)?.label
                          : 'Seleccionar equipo'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-full">
                    <Command onValueChange={(value) => {}}>
                      <CommandInput
                        onValueChange={(value) => {
                          if (value) {
                            equipments.filter((equipment) =>
                              equipment.label.toLowerCase().includes(value.toLowerCase())
                            );
                          }
                        }}
                        placeholder="Buscar equipo"
                      />
                      <CommandList>
                        <CommandEmpty>Sin resultados</CommandEmpty>
                        <CommandGroup>
                          {equipments.map((equipment) => (
                            <CommandItem
                              value={equipment.label}
                              key={equipment.label}
                              onSelect={async () => {
                                form.setValue('applies', equipment.value);
                                const { data, error } = await supabase
                                  .from('documents_equipment')
                                  .select('*')
                                  .eq('applies', equipment.value)
                                  .neq('document_path', null);

                                if (error) {
                                  console.error('error', error);
                                  return;
                                }

                                console.log(data, 'data');
                                setSelectedResourceDocuments(data);
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  equipment.value === field.value ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              {equipment.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormDescription>Selecciona el equipo al que le corresponde el documento</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <ToggleGroup
            defaultValue={'ambos'}
            type="single"
            variant="outline"
            className="w-full flex-col items-start mb-4 gap-y-3"
            onValueChange={(value) => {
              handleTypeFilter(value);
            }}
          >
            <Label>Filtrar tipos de documentos</Label>
            <div className="flex gap-4">
              <ToggleGroupItem value="Ambos">Ambos</ToggleGroupItem>
              <ToggleGroupItem value="Permanentes">Permanentes</ToggleGroupItem>
              <ToggleGroupItem value="Mensuales">Mensuales</ToggleGroupItem>
            </div>
          </ToggleGroup>
          <FormField
            control={form.control}
            name="id_document_types"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Tipo de documento</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(' justify-between', !field.value && 'text-muted-foreground')}
                      >
                        {field.value
                          ? allDocumentTypes.find((documentType) => documentType.id === field.value)?.name
                          : 'Seleccionar tipo de documento'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-full">
                    <Command>
                      <CommandInput placeholder="Buscar tipo de documento" />
                      <CommandList>
                        <CommandEmpty>
                          Sin resultados para <strong>{field.value}</strong>
                        </CommandEmpty>
                        <CommandGroup>
                          {documenTypes.map((documentType) => (
                            <CommandItem
                              value={documentType.id}
                              key={documentType.name}
                              disabled={
                                selectedResourceDocuments &&
                                selectedResourceDocuments.find(
                                  (document) => document.id_document_types === documentType.id
                                )?.applies
                                  ? true
                                  : false
                              }
                              onSelect={async () => {
                                form.setValue('id_document_types', documentType.id);
                                setSelectedDocumentType(documentType);
                                form.setValue('validity', undefined);
                                form.setValue('period', undefined);
                                setSelectedFile(undefined);
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  documentType.id === field.value ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              {documentType.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormDescription>Seleccione el tipo de documento que desea cargar al equipo</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {selectedDocumentType?.explired && (
            <FormField
              control={form.control}
              name="validity"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de validez</FormLabel>
                  <FormControl>
                    <EnhancedDatePicker
                      date={field.value as any}
                      setDate={(date) => field.onChange(date?.toISOString())}
                    />
                  </FormControl>
                  <FormDescription>Seleccione la fecha de validez del documento</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {selectedDocumentType?.is_it_montlhy && (
            <FormField
              control={form.control}
              name="period"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Período</FormLabel>
                  <FormControl>
                    <YearMonthPicker
                      date={field.value ? new Date(field.value) : undefined}
                      setDate={(date) => {
                        if (date) {
                          field.onChange(format(date, 'yyyy-MM'));
                        } else {
                          field.onChange(undefined);
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>Seleccione el período del documento</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="document_path"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Documento</FormLabel>
                <FormControl>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="text"
                      readOnly
                      value={selectedFileName || field.value || 'Ningún archivo seleccionado'}
                      className={cn('flex-grow', !field.value && 'text-muted-foreground')}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!form.getValues('applies') || !form.getValues('id_document_types')}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          setSelectedFile(file);
                          // console.log('file', file);
                          if (file) {
                            const applies = equipments
                              .find((equipment) => equipment.value === form.getValues('applies'))
                              ?.label.split(' - ')[0]
                              .toLocaleLowerCase();
                            const documentName = documenTypes.find(
                              (documentType) => documentType.id === form.getValues('id_document_types')
                            )?.name;
                            const documenExtension = file.name.split('.').pop();
                            if (!applies || !documentName || !documenExtension) return;
                            setSelectedFileName(file.name);
                            const period = form.getValues('period');
                            const expiredDate = form.getValues('validity')
                              ? moment(form.getValues('validity')).format('DD-MM-YYYY')
                              : null;
                            const hasExpiredDate = expiredDate || period || 'v0';
                            const documentUrl = await calculateNameOFDocument(
                              currentCompany[0].company_name,
                              currentCompany[0].company_cuit,
                              applies,
                              documentName,
                              hasExpiredDate,
                              documenExtension,
                              'equipos'
                            );
                            //console.log('documentUrl', documentUrl);
                            if (documentUrl === 'duplicate') {
                              form.setError('document_path', {
                                type: 'manual',
                                message: 'El documento ya existe',
                              });
                              return;
                            }
                            field.onChange(documentUrl);
                          }
                        };
                        input.click();
                      }}
                    >
                      Seleccionar archivo
                    </Button>
                  </div>
                </FormControl>
                <FormDescription>Seleccione el documento que desea cargar</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-around">
            <Button
              variant={'destructive'}
              onClick={() => {
                form.reset();
                setSelectedFile(undefined);
                setSelectedDocumentType(undefined);
                document.getElementById('close-create-document-modal')?.click();
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">Enviar</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default UploadDocumentEquipment;

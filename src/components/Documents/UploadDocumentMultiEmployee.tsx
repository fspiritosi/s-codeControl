'use client';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  calculateNameOFDocument,
  cn,
  getAllDocumentsByIdDocumentTypeCientSide,
  uploadDocument,
  uploadDocumentFile,
} from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Check, ChevronsUpDown } from 'lucide-react';
import moment from 'moment';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { CardTitle } from '../ui/card';
import { EnhancedDatePicker } from '../ui/enhanced-datepicket';
import { Input } from '../ui/input';
import { MultiSelectCombobox } from '../ui/multi-select-combobox';
import { YearMonthPicker } from '../ui/year-month-picker';

function UploadDocumentMultiEmployee({
  employees,
  allDocumentTypes,
  currentCompany,
  user_id,
}: {
  employees: { label: string; value: string; cuit: string }[];
  allDocumentTypes: DocumentTypes[];
  currentCompany: Company[];
  user_id?: string;
}) {
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const [selectedDocumentType, setSelectedDocumentType] = useState<(typeof allDocumentTypes)[0] | undefined>(undefined);
  const uploadDocumentSchema = z.object({
    applies: z.array(
      z
        .string({
          required_error: 'Este campo es requerido',
        })
        .uuid()
    ),
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
      applies: [],
    },
  });
  const [documenTypes, setDocumentTypes] = useState<typeof allDocumentTypes>(allDocumentTypes);
  async function onSubmit(data: z.infer<typeof uploadDocumentSchema>) {
    if (!selectedFile) return;
    const selectedDocumentType = allDocumentTypes.find((documentType) => documentType.id === data.id_document_types);
    try {
      await uploadDocument(data, selectedDocumentType?.mandatory!, 'documents_employees', true);
      await uploadDocumentFile(selectedFile, data.document_path);
      //Cerrar el modal y resetear el formulario y estados
      form.reset();
      setSelectedFile(undefined);
      setSelectedDocumentType(undefined);
      router.refresh();
      document.getElementById('close-create-document-modal')?.click();
    } catch (error) {
      console.error('error', error);
    }
  }
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [selectedResourceDocuments, setSelectedResourceDocuments] = useState<EmployeeDocument[]>([]);

  return (
    <div>
      <CardTitle className="mb-3">Documento no multirecurso</CardTitle>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 overflow-y-auto max-h-[80vh]">
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
                              onSelect={async (selectedValue) => {
                                const data = await getAllDocumentsByIdDocumentTypeCientSide(
                                  selectedValue,
                                  documentType.company_id ?? ''
                                );
                                setSelectedResourceDocuments(data);
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
                <FormDescription>Seleccione el tipo de documento que desea cargar al empleado</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="applies"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empleados</FormLabel>
                <FormControl>
                  <MultiSelectCombobox
                    selectedResourceDocuments={selectedResourceDocuments}
                    options={employees.map((employee) => ({
                      value: employee.value,
                      label: employee.label + ' - ' + employee.cuit,
                      cuit: employee.cuit,
                    }))}
                    placeholder="Selecciona recursos"
                    emptyMessage="No se encontraron recursos."
                    selectedValues={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>Selecciona al menos dos recursos para vincular el documento.</FormDescription>
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
                          const employeesSelected = form.getValues('applies');
                          setSelectedFile(file);
                          // console.log('file', file);
                          if (file) {
                            const documentName = documenTypes.find(
                              (documentType) => documentType.id === form.getValues('id_document_types')
                            )?.name;
                            const documenExtension = file.name.split('.').pop();
                            if (!employees.length || !documentName || !documenExtension) return;
                            setSelectedFileName(file.name);
                            const period = form.getValues('period');
                            const expiredDate = form.getValues('validity')
                              ? moment(form.getValues('validity')).format('DD-MM-YYYY')
                              : null;
                            const hasExpiredDate = expiredDate || period || 'v0';

                            const documentUrl = calculateNameOFDocument(
                              currentCompany[0].company_name,
                              currentCompany[0].company_cuit,
                              'persona',
                              documentName,
                              hasExpiredDate,
                              documenExtension,
                              'multirecursos'
                            );
                            // calculateNameOFDocument(
                            //   currentCompany[0].company_name,
                            //   currentCompany[0].company_cuit,
                            //   applies,
                            //   documentName,
                            //   hasExpiredDate,
                            //   documenExtension,
                            //   'persona'
                            // );

                            // console.log('documentUrl', documentUrl);
                            // if (documentUrl === 'duplicate') {
                            //   form.setError('document_path', {
                            //     type: 'manual',
                            //     message: 'El documento ya existe',
                            //   });
                            //   return;
                            // }
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

export default UploadDocumentMultiEmployee;

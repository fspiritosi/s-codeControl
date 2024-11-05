'use client';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { cn } from '@/lib/utils';
import { formatDocumentTypeName } from '@/lib/utils/utils';
import { useCountriesStore } from '@/store/countries';
import { useLoggedUserStore } from '@/store/loggedUser';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
function AddCompanyDocumentForm({
  documentId,
  documentIsUploaded,
  redirectId,
}: {
  documentId: string;
  redirectId: string;
  documentIsUploaded: boolean;
}) {
  const companyDocumentTypes = useCountriesStore((state) => state.companyDocumentTypes).filter(
    (e) => e.applies === 'Empresa'
  );
  const user = useLoggedUserStore((state) => state.credentialUser?.id);
  const actualCompany = useLoggedUserStore((state) => state.actualCompany);
  const companyId = useLoggedUserStore((state) => state.actualCompany)?.id;
  const documentForId = companyDocumentTypes.find((e) => e.id === documentId);
  const fetchDocuments = useLoggedUserStore((state) => state.documetsFetch);
  const router = useRouter();
  const FormSchema = z.object({
    id_document_types: z.string({
      required_error: 'Este campo es requerido',
    }),
    file: z.string({ required_error: 'Este campo es requerido' }),
    validity: documentForId?.explired ? z.string({ required_error: 'Este campo es requerido' }) : z.string().optional(),
    period: documentForId?.is_it_montlhy
      ? z.string({
          required_error: 'Este campo es requerido',
        })
      : z.string().optional(),
  });
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      id_document_types: documentId,
    },
  });
  const [file, setFile] = useState<File | undefined>(undefined);

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    toast.promise(
      async () => {
        const supabase = supabaseBrowser();

        const formatedDocumentTypeName = formatDocumentTypeName(documentForId?.name || '');
        const hasExpiredDate = data.validity?.replace(/\//g, '-') ?? 'v0';
        const { data: DuplicatedDocument } = await supabase.storage
          .from('document_files')
          .list(
            `${actualCompany?.company_name.toLowerCase().replace(/ /g, '-')}-(${actualCompany?.company_cuit})/empresa`,
            {
              search: `${formatedDocumentTypeName}-(${hasExpiredDate})`,
            }
          );
        if (DuplicatedDocument?.length && DuplicatedDocument?.length > 0) {
          throw new Error('Este documento ya se encuentra subido');
        }
        const fileExtension = data.file.split('.').pop();
        if (!file) throw new Error('No se ha subido el archivo');
        await supabase.storage
          .from('document_files')
          .upload(
            `/${actualCompany?.company_name.toLowerCase().replace(/ /g, '-')}-(${actualCompany?.company_cuit})/empresa/${formatedDocumentTypeName}-(${hasExpiredDate}).${fileExtension}`,
            file,
            {
              cacheControl: '3600',
              upsert: false,
            }
          )
          .then(async (response) => {
            const { file, ...rest } = data;
            const allData = {
              ...rest,
              validity: data.validity ? format(data.validity.replaceAll('-', '/'), 'dd/MM/yyyy') : null,
              user_id: user,
              created_at: new Date().toISOString(),
              state: 'presentado',
              document_path: response.data?.path,
            };

            const { error } = await supabase
              .from('documents_company')
              .update(allData as any)
              .eq('applies', companyId || '')
              .eq('id_document_types', documentId);

            if (error) {
              await supabase.storage.from('document_files').remove([response.data?.path || '']);
            }
            fetchDocuments();
            router.refresh();
          });
      },
      {
        loading: 'Subiendo documento',
        success: 'Documento subido con exito',
        error: (error) => {
          return error;
        },
      }
    );
    document.getElementById('cerrar-modal-company-document')?.click();
  }

  return documentIsUploaded ? (
    <Link
      className={cn(buttonVariants({ variant: 'outline' }), 'min-w-full')}
      href={`/dashboard/document/${redirectId}`}
    >
      Ver documento
    </Link>
  ) : (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="min-w-full">Subir</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Subir documento</AlertDialogTitle>
          <AlertDialogDescription>Rellena el siguiente formulario para subir el documento</AlertDialogDescription>
        </AlertDialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className=" space-y-6">
            <FormField
              control={form.control}
              name="id_document_types"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seleccione el tipo de documento que desea subir</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipos de documento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {companyDocumentTypes.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Archivo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Elegir Archivo"
                      type="file"
                      {...field}
                      onChange={(event) => {
                        setFile(event.target.files?.[0]);
                        field.onChange(event);
                      }}
                    />
                  </FormControl>
                  <FormDescription>Selecciona el archivo a subir</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {documentForId?.explired && (
              <FormField
                control={form.control}
                name="validity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de vencimiento</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Elegir Archivo"
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Selecciona la fecha en la que vence el documento</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {documentForId?.is_it_montlhy && (
              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Periodo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Elegir Archivo"
                        type="month"
                        min={new Date().toISOString().split('T')[0]}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Este documento es mensual, debe ingrear el periodo al que corresponde
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <div className="flex justify-end gap-4">
              <AlertDialogCancel id="cerrar-modal-company-document">Cancelar</AlertDialogCancel>
              <Button type="submit">Subir</Button>
            </div>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default AddCompanyDocumentForm;

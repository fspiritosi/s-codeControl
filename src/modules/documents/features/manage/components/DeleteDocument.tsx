'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { handleSupabaseError } from '@/shared/lib/errorHandler';
import { updateDocumentEmployeeByPath, updateDocumentEquipmentByPath, updateDocumentCompanyByPath } from '@/modules/documents/features/manage/actions.server';
import { removeDocumentFile } from '@/modules/documents/features/upload/actions.server';
import { cn } from '@/shared/lib/utils';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/shared/components/ui/input';

export default function DeleteDocument({
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
    delete_document: z.string({ required_error: 'El documento es requerido' }).refine((value) => value === 'ELIMINAR', {
      message: 'Debe ingresar la palabra ELIMINAR para eliminar el documento',
    }),
  });
  type FormValues = z.infer<typeof FormSchema>;
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema) as any,
    defaultValues: {
      delete_document: '' as any,
    },
  });
  const router = useRouter();

  async function onSubmit(filename: z.infer<typeof FormSchema>) {
    toast.promise(
      async () => {
        if (!documentName) return;

        const removeResult = await removeDocumentFile('document_files', [documentName]);
        if (removeResult.error) {
          throw new Error(handleSupabaseError(removeResult.error));
        }

        const resetData = {
          validity: null,
          document_path: null,
          state: 'pendiente',
          period: null,
        };

        if (resource === 'employee') {
          const { error } = await updateDocumentEmployeeByPath(documentName, resetData);
          if (error) {
            throw new Error(handleSupabaseError(error));
          }
        } else if (resource === 'vehicle') {
          const { error } = await updateDocumentEquipmentByPath(documentName, resetData);
          if (error) {
            throw new Error(handleSupabaseError(error));
          }
        } else {
          const { error } = await updateDocumentCompanyByPath(documentName, { ...resetData, user_id: null });
          if (error) {
            throw new Error(handleSupabaseError(error));
          }
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
        loading: 'Eliminando...',
        success: 'Documento eliminado correctamente',
        error: (error) => {
          return error;
        },
      }
    );
  }
  return (
    <Dialog open={isOpen} onOpenChange={() => setIsOpen(!isOpen)}>
      <DialogTrigger asChild>
        <Button variant={'destructive'}>Eliminar</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] dark:bg-slate-950">
        <DialogHeader>
          <DialogTitle>Eliminar documento</DialogTitle>
        </DialogHeader>
        <div className="grid w-full gap-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className=" space-y-6">
              <div className="flex flex-col">
                <FormField
                  control={form.control}
                  name="delete_document"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Ingresa la palabra <span className="text-red-700">ELIMINAR</span> para eliminar el documento
                      </FormLabel>
                      <FormControl>
                        <Input
                          className={cn(
                            field.value === 'ELIMINAR' ? 'border border-green-500 ' : 'border border-red-500'
                          )}
                          placeholder="Ingresa la palabra ELIMINAR"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="text-blue-500 flex items-center">
                  <InfoCircledIcon className="size-7 inline-block mr-2" />
                  <FormDescription className="text-blue-500 mt-4">
                    Este nuevo documento será eliminado y no podra ser recuperado. Asegurate de que sea el correcto.
                  </FormDescription>
                </div>

                <Button type="submit" variant="default" className="self-end mt-5">
                  Eliminar
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

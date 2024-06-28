'use client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { TooltipProvider } from '@/components/ui/tooltip';
import { handleSupabaseError } from '@/lib/errorHandler';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { useCountriesStore } from '@/store/countries';
import { useLoggedUserStore } from '@/store/loggedUser';
import { Equipo } from '@/zodSchemas/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

type Props = {
  Equipo: Equipo[0];
};
export function EditModal({ Equipo }: Props) {
  const supabase = supabaseBrowser();
  const [special, setSpecial] = useState(false);
  const router = useRouter();
  const fetchDocumentTypes = useCountriesStore((state) => state.documentTypes);
  const actualCompany = useLoggedUserStore((state) => state.actualCompany);
  const FormSchema = z.object({
    name: z
      .string({ required_error: 'Este campo es requerido' })
      .min(3, { message: 'El nombre debe contener mas de 3 caracteres' })
      .max(50, { message: 'El nombre debe contener menos de 50 caracteres' }),
    applies: z.enum(['Persona', 'Equipos', 'Empresa'], {
      required_error: 'Este campo es requerido',
    }),
    multiresource: z.boolean({
      required_error: 'Se debe seleccionar una opcion',
    }),
    mandatory: z.boolean({ required_error: 'Se debe seleccionar una opcion' }),
    explired: z.boolean({ required_error: 'Se debe seleccionar una opcion' }),
    special: z.boolean({ required_error: 'Este campo es requerido' }),
    description: special ? z.string({ required_error: 'Este campo es requerido' }) : z.string().optional(),
  });
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: Equipo.name,
      multiresource: Equipo.multiresource,
      mandatory: Equipo.mandatory,
      explired: Equipo.explired,
      special: Equipo.special,
      applies: Equipo.applies as 'Persona' | 'Equipos' | undefined,
      description: Equipo.description || '',
    },
  });

  const items = [
    {
      id: 'multiresource',
      label: 'Es multirecurso?',
      tooltip: 'Si el documento aplica a mas de una persona o equipo',
    },
    {
      id: 'mandatory',
      label: 'Es mandatorio?',
      tooltip: 'Si el documento es obligatorio, se crearan alertas para su cumplimiento',
    },
    { id: 'explired', label: 'Expira?', tooltip: 'Si el documento expira' },
    {
      id: 'special',
      label: 'Es especial?',
      tooltip: 'Si el documento requiere documentacion especial',
    },
  ];

  async function onSubmit(values: z.infer<typeof FormSchema>) {
    const formattedValues = {
      ...values,
      name: formatName(values.name),
      description: formatDescription(values.description),
    };

    toast.promise(
      async () => {
        const { error } = await supabase.from('document_types').update(formattedValues).eq('id', Equipo.id);

        if (error) {
          throw new Error(handleSupabaseError(error.message));
        }
        fetchDocumentTypes(actualCompany?.id);
      },
      {
        loading: 'Actualizando...',
        success: (data) => {
          document.getElementById('close_document_modal')?.click();
          return 'El documento se ha actualizado correctamente';
        },
        error: (error) => {
          return error;
        },
      }
    );
    fetchDocumentTypes(actualCompany?.id);
  }

  function formatName(name: string): string {
    // Capitalize first letter and convert the rest to lowercase
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }

  function formatDescription(description: string | undefined): string | undefined {
    if (description) {
      // Capitalize first letter and convert the rest to lowercase
      return description.charAt(0).toUpperCase() + description.slice(1).toLowerCase();
    }
    return description;
  }

  async function handleDeleteDocumentType() {
    toast.promise(
      async () => {
        const { error } = await supabase.from('document_types').update({ is_active: false }).eq('id', Equipo.id);

        if (error) {
          throw new Error(handleSupabaseError(error.message));
        }
      },
      {
        loading: 'Eliminando...',
        success: (data) => {
          document.getElementById('close_document_modal')?.click();
          fetchDocumentTypes(actualCompany?.id);

          return 'El documento se ha eliminado correctamente';
        },
        error: (error) => {
          return error;
        },
      }
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Editar</Button>
      </SheetTrigger>
      <SheetContent className="border-l-4 border-l-muted">
        <SheetHeader>
          <SheetTitle>Editar tipo de documento</SheetTitle>
          <SheetDescription>
            Puedes editar el tipo de documento seleccionado, los documentos creados por defecto no son editables
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="w-full rounded-md border p-4 shadow"
                        placeholder="Nombre del documento"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="applies"
                render={({ field }) => (
                  <FormItem>
                    <div>
                      <FormLabel>Aplica a</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Personas, Equipos o Empresa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Persona">Persona</SelectItem>
                          <SelectItem value="Equipos">Equipos</SelectItem>
                          <SelectItem value="Empresa">Empresa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid md:grid-cols-2 grid-cols-1 gap-6 items-stretch justify-between">
                <TooltipProvider delayDuration={150}>
                  {items?.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name={item.id as 'name' | 'applies' | 'multiresource' | 'mandatory' | 'explired' | 'special'}
                      render={({ field }) => (
                        <FormItem>
                          <div className="">
                            <FormLabel className="flex gap-1 items-center mb-2">{item.label}</FormLabel>
                            <FormControl>
                              <div className="flex flex-col space-x-2">
                                <div className="flex gap-3">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      checked={field.value === true}
                                      onCheckedChange={(value) => {
                                        field.onChange(value ? true : false);
                                        if (item.id === 'special') {
                                          setSpecial(true);
                                        }
                                      }}
                                    />
                                    <span>Sí</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      checked={field.value === false}
                                      onCheckedChange={(value) => {
                                        field.onChange(value ? false : true);
                                        if (item.id === 'special') {
                                          setSpecial(false);
                                        }
                                      }}
                                    />
                                    <span>No</span>
                                  </div>
                                </div>
                                <FormMessage />
                              </div>
                            </FormControl>
                            <div className="space-y-1 leading-none"></div>
                          </div>
                        </FormItem>
                      )}
                    />
                  ))}
                </TooltipProvider>
              </div>
              {special && (
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <div>
                        <FormLabel>Documentacion Especial</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar documento especial" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Maneja">Maneja</SelectItem>
                            <SelectItem value="Habilitacion especial">Habilitacion especial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <SheetFooter className="flex  gap-11 flex-wrap">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant={'destructive'}>Eliminar</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Estas seguro que deseas eliminar el tipo de documento {Equipo.name}?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta accion no puede revertirse, y eliminara todos los documentos asociados a este tipo.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction className={buttonVariants({ variant: 'destructive' })} asChild>
                        <Button onClick={() => handleDeleteDocumentType()} variant={'destructive'}>
                          Eliminar
                        </Button>
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <SheetClose asChild>
                  <Button type="submit">Guardar cambios</Button>
                </SheetClose>
                <SheetClose id="cerrar-editor-modal" />
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

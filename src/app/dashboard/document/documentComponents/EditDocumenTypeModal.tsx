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
import { CardTitle } from '@/components/ui/card';
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
  const [allResources, setAllResources] = useState<any[]>([]);
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
    is_it_montlhy: z.boolean({ required_error: 'Se debe seleccionar una opcion' }).optional(),
    private: z.boolean({ required_error: 'Se debe seleccionar una opcion' }).optional(),
    down_document: z.boolean({ required_error: 'Este campo es requerido' }),
  });
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: Equipo.name,
      multiresource: Equipo.multiresource,
      mandatory: Equipo.mandatory,
      explired: Equipo.explired,
      special: Equipo.special,
      applies: Equipo.applies as 'Persona' | 'Equipos' | 'Empresa' | undefined,
      description: Equipo.description || '',
      is_it_montlhy: Equipo.is_it_montlhy as boolean,
      private: Equipo.private as boolean,
      down_document: Equipo.down_document as boolean,
    },
  });

  const itemsTotales = [
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
    {
      id: 'is_it_montlhy',
      label: 'Es mensual?',
      tooltip: 'Si el documento vence mensualmente',
    },
    {
      id: 'private',
      label: 'Es privado?',
      tooltip: 'Si el documento es privado no sera visible para los usuarios con el rol invitado',
    },
    {
      id: 'down_document',
      label: 'Es un documento de baja?',
      tooltip: 'Si el documento es de baja solo se pedira cuando el empleado este dado de baja',
    },
  ];
  const [items, setItems] = useState(() => {
    return Equipo.applies !== 'Empresa'
      ? itemsTotales
      : itemsTotales.filter((e) => e.id === 'is_it_montlhy' || e.id === 'private' || e.id === 'explired');
  });

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
    router.refresh();
  }

  function formatName(name: string): string {
    // Capitalize first letter and convert the rest to lowercase
    return name.charAt(0)?.toUpperCase() + name.slice(1).toLowerCase();
  }

  function formatDescription(description: string | undefined): string | undefined {
    if (description) {
      // Capitalize first letter and convert the rest to lowercase
      return description.charAt(0)?.toUpperCase() + description.slice(1).toLowerCase();
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

  async function fetchallResources() {
    if (Equipo.applies === 'Persona') {
      const { data, error } = await supabase
        .from('employees')
        .select('firstname,lastname, cuil,id')
        .eq('company_id', actualCompany?.id || '');

      if (error) {
        console.error('Error al obtener datos adicionales:', error);
      } else {
        setAllResources(data);
      }
    } else if (Equipo.applies === 'Equipos') {
      const { data, error } = await supabase
        .from('vehicles')
        .select('domain, serie, intern_number,id')
        .eq('company_id', actualCompany?.id || '');

      if (error) {
        console.error('Error al obtener datos adicionales:', error);
      } else {
        setAllResources(data);
      }
    }
  }
  const [existingEntries, setExistingEntries] = useState<any[]>([]);

  async function fettchExistingEntries() {
    const tableNames = {
      Equipos: 'documents_equipment',
      Persona: 'documents_employees',
    };
    const table = tableNames[Equipo.applies as 'Equipos' | 'Persona'];

    const { data: existingEntries, error: existingEntriesError } = await supabase
      .from(table as 'documents_equipment' | 'documents_employees')
      .select('applies(*),id')
      .eq('id_document_types', Equipo.id)
      .eq('applies.company_id', actualCompany?.id || '')
      .not('applies', 'is', null);

    if (existingEntriesError) {
      console.error('Error al obtener los recursos con documentos:', existingEntriesError);
      return;
    }
    setExistingEntries(existingEntries);
  }
  // Filtrar los recursos que no tienen una entrada en la tabla correspondiente
  const existingResourceIds = existingEntries.map((entry: any) => entry.applies.id);
  const resourcesToInsert = allResources.filter(
    (resource: { id: string }) => !existingResourceIds.includes(resource.id)
  );

  async function handleGenerateAlerts() {
    toast.promise(
      async () => {
        // Generar alerta de pendiente de documento en la tabla correspondiente y solo a los recursos que no tengan el documento subido
        const tableNames = {
          Equipos: 'documents_equipment',
          Persona: 'documents_employees',
        };
        const table = tableNames[Equipo.applies as 'Equipos' | 'Persona'];

        if (resourcesToInsert.length > 0) {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) {
            return;
          }

          const alerts = resourcesToInsert.map((resource: { id: string }) => ({
            id_document_types: Equipo.id,
            user_id: user.id,
            applies: resource.id,
          }));

          const { error: insertError } = await supabase.from(table as any).insert(alerts);

          if (insertError) {
            throw new Error(handleSupabaseError(insertError.message));
          }
        } else {
          throw new Error('No hay recursos a los que se les deba generar una alerta');
        }
      },
      {
        loading: 'Generando alertas...',
        success: (data) => {
          fetchDocumentTypes(actualCompany?.id);
          return 'Se han generado las alertas!';
        },
        error: (error) => {
          return error;
        },
      }
    );
    router.refresh();
  }
  async function handleDeleteAlerts() {
    const tableNames = {
      Equipos: 'documents_equipment',
      Persona: 'documents_employees',
      Empresa: 'documents_company',
    };
    const table = tableNames[Equipo.applies as 'Equipos' | 'Persona' | 'Empresa'];

    console.log(table, 'esta es la tabla');
    console.log(Equipo, 'esta es la Equipo');

    toast.promise(
      async () => {
        const { data, error } = await supabase
          .from(table as any)
          .delete()
          .eq('id_document_types', Equipo.id)
          .is('document_path', null);
        console.log(data, 'data');
        console.log(error, 'error');

        if (error) {
          throw new Error(handleSupabaseError(error.message));
        }
      },
      {
        loading: 'Eliminando...',
        success: (data) => {
          fetchDocumentTypes(actualCompany?.id);
          router.refresh();
          return 'Se han eliminado las alertas!';
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
        <Button
          onClick={async () => {
            await fetchallResources();
            await fettchExistingEntries();
          }}
          id="close-edit-modal-documentypes"
          variant="outline"
        >
          Editar
        </Button>
      </SheetTrigger>
      <SheetContent className="border-l-4 border-l-muted flex flex-col justify-between overflow-y-auto">
        <div>
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
                                          if (item.id === 'is_it_montlhy') {
                                            form.setValue('explired', value ? false : true);
                                          }
                                          if (item.id === 'explired') {
                                            form.setValue('is_it_montlhy', value ? false : true);
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
                                          if (item.id === 'is_it_montlhy') {
                                            form.setValue('explired', false);
                                          }
                                          if (item.id === 'explired') {
                                            form.setValue('is_it_montlhy', false);
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
        </div>

        <AlertDialog>
          <AlertDialogTrigger disabled={!(resourcesToInsert.length > 0) || Equipo.applies === 'Empresa'} asChild>
            <Button className="self-end">Generar Alertas de documento</Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle>Estas totalmente seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción generara una alerta en todos los recursos que no las tengan generadas.
              </AlertDialogDescription>
              <AlertDialogDescription>
                {resourcesToInsert.length > 0 ? (
                  <>
                    <CardTitle className="text-md underline mb-1">
                      Los siguientes recursos no tienen la alerta generada:
                    </CardTitle>
                    {resourcesToInsert.map((resource) => {
                      if (Equipo.applies === 'Equipos') {
                        return (
                          <div key={resource.id}>
                            {resource.domain} {resource.serie} - {resource.intern_number}
                          </div>
                        );
                      }
                      if (Equipo.applies === 'Persona') {
                        return (
                          <div key={resource.id}>
                            {resource.lastname} {resource.firstname} - {resource.cuil}
                          </div>
                        );
                      }
                    })}
                  </>
                ) : (
                  <CardTitle className="text-md underline mb-1">Todos los recursos tienen la alerta generada</CardTitle>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction className={buttonVariants({ variant: 'destructive' })} asChild>
                <Button onClick={() => handleGenerateAlerts()}>Generar alertas</Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant={'destructive'} className="self-end">
              Eliminar alertas del documento
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Estas totalmente seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará la alerta de todos los recursos a los que no se les haya subido el documento. Los
                documentos ya subidos y vinculados a este tipo de documento permanecerán intactos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction className={buttonVariants({ variant: 'destructive' })} asChild>
                <Button variant={'destructive'} onClick={() => handleDeleteAlerts()}>
                  Eliminar alertas
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}

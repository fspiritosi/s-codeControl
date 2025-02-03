'use client';

import { CreateNewFormAnswer, UpdateVehicle } from '@/app/server/UPDATE/actions';
import { PDFPreviewDialog } from '@/components/pdf-preview-dialog';
import { TransporteSPANAYCHKHYS04 } from '@/components/pdf/generators/TransporteSPANAYCHKHYS04';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useLoggedUserStore } from '@/store/loggedUser';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronsUpDown } from 'lucide-react';
import moment from 'moment';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import BackButton from '../BackButton';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

// Define the structure for a checklist item
type ChecklistItem = {
  id: string;
  label: string;
  type: 'text' | 'date' | 'select' | 'radio' | 'textarea' | 'combobox';
  options?: string[];
  required?: boolean;
  disabled?: boolean;
};

// Define the structure for a checklist configuration
type ChecklistConfig = {
  title: string;
  subtitle?: string;
  items: ChecklistItem[];
};

// Example configuration for the daily checklist
export const dailyChecklistConfig: ChecklistConfig = {
  title: 'CHECK LIST INSPECCION DIARIA',
  subtitle: 'Transporte SP-ANAY - CHK - HYS - 04',
  items: [
    { id: 'movil', label: 'Equipo', type: 'combobox', required: true, disabled: false },
    { id: 'interno', label: 'Interno', type: 'text', required: true, disabled: true },
    { id: 'dominio', label: 'Dominio/patente', type: 'text', required: true, disabled: true },
    { id: 'kilometraje', label: 'Kilometraje', type: 'text', required: true, disabled: false },
    { id: 'modelo', label: 'Modelo', type: 'text', required: true, disabled: true },
    { id: 'marca', label: 'Marca', type: 'text', required: true, disabled: true },
    { id: 'chofer', label: 'Nombre del conductor', type: 'text', required: true, disabled: true },
    { id: 'servicio', label: 'Servicio/Proyecto', type: 'text', required: true, disabled: false },
    { id: 'fecha', label: 'Fecha', type: 'date', required: true, disabled: true },
    {
      id: 'luces',
      label: 'Verificar funcionamiento de todas las luces',
      type: 'radio',
      options: ['SI', 'NO'],
      required: true,
      disabled: false,
    },
    {
      id: 'licencia',
      label: 'Licencia: vigente',
      type: 'radio',
      options: ['SI', 'NO'],
      required: true,
      disabled: false,
    },
    {
      id: 'puertas',
      label: 'Cierre efectivo de puertas',
      type: 'radio',
      options: ['SI', 'NO'],
      required: true,
      disabled: false,
    },
    {
      id: 'extintor',
      label: 'Extintor presente, recarga en fecha vigente',
      type: 'radio',
      options: ['SI', 'NO'],
      required: true,
      disabled: false,
    },
    {
      id: 'estadoGeneral',
      label: 'Estado y aspecto gral correcto',
      type: 'radio',
      options: ['SI', 'NO'],
      required: true,
      disabled: false,
    },
    { id: 'seguro', label: 'Seguro: vigente', type: 'radio', options: ['SI', 'NO'], required: true, disabled: false },
    {
      id: 'verificacionTecnica',
      label: 'Verificacion tecnica vehicular: Vigente',
      type: 'radio',
      options: ['SI', 'NO'],
      required: true,
      disabled: false,
    },
    {
      id: 'botiquin',
      label: 'Botiquin de primeros auxilios',
      type: 'radio',
      options: ['SI', 'NO'],
      required: true,
      disabled: false,
    },
    {
      id: 'manejoDefensivo',
      label: 'Manejo defensivo: vigente',
      type: 'radio',
      options: ['SI', 'NO'],
      required: true,
      disabled: false,
    },
    {
      id: 'alarmaRetroceso',
      label: 'Alarma acustica de retroceso en funcionamiento',
      type: 'radio',
      options: ['SI', 'NO'],
      required: true,
      disabled: false,
    },
    {
      id: 'parabrisasEspejos',
      label: 'Parabrisas, ventanillas y espejos limpios en buen estado',
      type: 'radio',
      options: ['SI', 'NO'],
      required: true,
      disabled: false,
    },
    {
      id: 'frenos',
      label: 'Verificar correcto funcionamiento de frenos, freno de mano',
      type: 'radio',
      options: ['SI', 'NO'],
      required: true,
      disabled: false,
    },
    {
      id: 'ruedaAuxilio',
      label: 'Ruedas de auxilio si estan a disposicion y se encuentran en buen estado',
      type: 'radio',
      options: ['SI', 'NO'],
      required: true,
      disabled: false,
    },
    {
      id: 'kitHerramientas',
      label: 'Kit de herraminetas, balizas si se encuentran disponibles y en buen estado, Gato Hidraulico',
      type: 'radio',
      options: ['SI', 'NO'],
      required: true,
      disabled: false,
    },
    {
      id: 'fluidos',
      label: 'Correcto nivel de fluidos, lubricantes, verificar fugas. Suficiente combustible',
      type: 'radio',
      options: ['SI', 'NO'],
      required: true,
      disabled: false,
    },
    {
      id: 'arrestallamas',
      label: 'Arrestallamas (si corresponde)',
      type: 'radio',
      options: ['SI', 'NO'],
      required: true,
      disabled: false,
    },
    {
      id: 'neumaticos',
      label:
        'Neumáticos en buen estado, con correcta presión de aire, bien ajustados y con checkpoints en todas las tuercas',
      type: 'radio',
      options: ['SI', 'NO'],
      required: true,
      disabled: false,
    },
    {
      id: 'aptoParaOperar',
      label: 'APTO PARA OPERAR',
      type: 'radio',
      options: ['SI', 'NO'],
      required: true,
      disabled: false,
    },
    { id: 'observaciones', label: 'Equipo', type: 'textarea', required: false },
  ],
};

// Function to generate Zod schema based on checklist configuration
function generateSchema(config: ChecklistConfig) {
  const schemaFields: { [key: string]: any } = {};
  config.items.forEach((item) => {
    if (item.type === 'radio') {
      schemaFields[item.id] = item.required
        ? z.enum(item.options as [string, ...string[]], { required_error: `Este campo es requerido` })
        : z.enum(item.options as [string, ...string[]]).optional();
    } else if (item.type === 'select') {
      schemaFields[item.id] = item.required
        ? z
            .string({
              required_error: `El campo ${item.label} es requerido`,
            })
            .min(1, { message: 'Este campo es requerido' })
        : z.string().optional();
    } else {
      schemaFields[item.id] = item.required
        ? z
            .string({ required_error: `El campo ${item.label} es requerido` })
            .min(1, { message: 'Este campo es requerido' })
        : z.string().optional();
    }
  });
  return z.object(schemaFields);
}

export default function DynamicChecklistForm({
  config = dailyChecklistConfig,
  defaultAnswer,
  equipments,
  currentUser,
  resetQrSelection,
  default_equipment_id,
  empleado_name,
  form_Info,
  singurl,
}: {
  config?: ChecklistConfig;
  singurl?: string | null;
  currentUser?: Profile[];
  defaultAnswer?: CheckListAnswerWithForm[];
  equipments?: {
    label: string;
    value: string;
    domain: string | null;
    serie: string | null;
    kilometer: string;
    model: string | null;
    brand: string | null;
    intern_number: string;
  }[];
  resetQrSelection?: (formType: string) => void;
  default_equipment_id?: string;
  empleado_name?: string | undefined;
  form_Info: CustomForm[];
}) {
  const [formSchema] = useState(() => generateSchema(config));
  const params = useParams();
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultAnswer?.length
      ? (defaultAnswer?.[0].answer as any)
      : default_equipment_id
        ? {
            movil: default_equipment_id,
            fecha: moment().format('YYYY-MM-DD'),
            hora: moment().format('HH:mm'),
            chofer: empleado_name?.toLocaleUpperCase(),
            interno: equipments?.find((equipment) => equipment.value === default_equipment_id)?.intern_number,
            kilometraje: equipments?.find((equipment) => equipment.value === default_equipment_id)?.kilometer,
            modelo: equipments?.find((equipment) => equipment.value === default_equipment_id)?.model ?? '',
            marca: equipments?.find((equipment) => equipment.value === default_equipment_id)?.brand ?? '',
            dominio:
              equipments?.find((equipment) => equipment.value === default_equipment_id)?.domain ??
              equipments?.find((equipment) => equipment.value === default_equipment_id)?.serie,
          }
        : {
            fecha: moment().format('YYYY-MM-DD'),
            hora: moment().format('HH:mm'),
            chofer: currentUser?.[0].fullname?.toLocaleUpperCase(),
          },
  });

  const actualCompany = useLoggedUserStore((state) => state.actualCompany);

  // console.log(form_Info, 'form_Info');

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    //Comparar el kilometraje con el del equipo y si es mayor actualizarlo
    const equipment = equipments?.find((equipment) => equipment.value === data.movil);

    //Si el kilometraje es menor al actual, marcar un error y no permitir guardar
    if (equipment?.intern_number && Number(data.kilometraje) < Number(equipment.kilometer)) {
      form.setError('kilometraje', {
        type: 'manual',
        message: `El kilometraje no puede ser menor al actual ${equipment.kilometer}`,
      });
      return;
    }

    toast.promise(CreateNewFormAnswer(resetQrSelection ? form_Info[0].id : (params.id as string), data), {
      loading: 'Guardando...',
      success: 'Checklist guardado correctamente',
      error: 'Ocurrió un error al guardar el checklist',
    });

    if (equipment?.intern_number && Number(data.kilometraje) > Number(equipment.kilometer)) {
      await UpdateVehicle(equipment.value, { kilometer: data.kilometraje });
    } //! mover a la funcion create

    router.refresh();

    if (resetQrSelection) {
      resetQrSelection('');
    } else {
      router.push(`/dashboard/forms/${params.id}`);
    }
  };

  // Group radio items
  const radioItems = config.items.filter((item) => item.type === 'radio');
  const nonRadioItems = config.items.filter((item) => item.type !== 'radio');

  return (
    <Card className="w-full mx-auto mb-4">
      {resetQrSelection && (
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Image src="/logoLetrasNegras.png" alt="CodeControl Logo" width={240} height={60} className="h-15" />
          </div>
          <CardDescription className="text-center text-gray-600">
            Sistema de Checklist y Mantenimiento de Equipos
          </CardDescription>
        </CardHeader>
      )}
      <div className="flex justify-between items-center mr-4">
        <CardHeader className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full">
            <div>
              <CardTitle className="text-2xl">{config.title}</CardTitle>
              {config.subtitle && <CardDescription className="mt-2">{config.subtitle}</CardDescription>}
            </div>
            <div className="flex gap-4">
              {resetQrSelection ? (
                <Button onClick={() => resetQrSelection('')} variant="ghost">
                  Volver
                </Button>
              ) : (
                <BackButton />
              )}
              {defaultAnswer && (
                <PDFPreviewDialog
                >
                  <div className="h-full w-full bg-white">
                    <TransporteSPANAYCHKHYS04
                      data={{
                        movil: form.getValues().movil,
                        chofer: form.getValues().chofer,
                        kilometraje: form.getValues().kilometraje,
                        fecha: form.getValues().fecha,
                        ...form.getValues(),
                      }}
                      companyLogo={actualCompany?.company_logo}
                      preview={true}
                      singurl={singurl}
                      title="Inspección Diaria de Vehículo"
                      description={`Conductor: ${form.getValues().chofer || 'No especificado'} - Fecha: ${form.getValues().fecha || new Date().toLocaleDateString()}`}
                    />
                  </div>
                </PDFPreviewDialog>
              )}
            </div>
          </div>
        </CardHeader>
        {/* {resetQrSelection ? (
          <Button onClick={() => resetQrSelection('')} variant="ghost" className="self-end">
            Volver
          </Button>
        ) : (
          <BackButton />
        )} */}
      </div>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="movil"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel>Equipo</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            disabled={defaultAnswer?.length || default_equipment_id ? true : false}
                            variant="outline"
                            role="combobox"
                            className={cn(' justify-between', !field.value && 'text-muted-foreground')}
                          >
                            {field.value
                              ? equipments?.find((language) => language.value === field.value)?.label
                              : 'Seleccionar equipo'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-full">
                        <Command>
                          <CommandInput
                            onValueChange={(value) => {
                              if (value) {
                                equipments?.filter((equipment) =>
                                  equipment.label.toLowerCase().includes(value.toLowerCase())
                                );
                              }
                            }}
                            placeholder="Buscar equipo"
                          />
                          <CommandList>
                            <CommandEmpty>Sin resultados</CommandEmpty>
                            <CommandGroup>
                              {equipments?.map((equipment) => (
                                <CommandItem
                                  value={equipment.label}
                                  key={equipment.label}
                                  onSelect={async () => {
                                    form.setValue('movil', equipment.value);
                                    form.setValue('interno', equipment.intern_number);
                                    form.setValue('kilometraje', equipment.kilometer);
                                    form.setValue('modelo', equipment.model ?? '');
                                    form.setValue('marca', equipment.brand ?? '');
                                    form.setValue('dominio', equipment.domain ?? equipment.serie);
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

                    <FormMessage />
                  </FormItem>
                )}
              />
              {nonRadioItems
                .filter((e) => e.label !== 'Equipo')
                .map((item) => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name={item.id}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{item.label}</FormLabel>
                        {item.type === 'text' && (
                          <FormControl>
                            <Input
                              disabled={item.disabled ? item.disabled : defaultAnswer?.length ? true : false}
                              {...field}
                            />
                          </FormControl>
                        )}
                        {item.type === 'date' && (
                          <FormControl>
                            <Input
                              disabled={item.disabled ? item.disabled : defaultAnswer?.length ? true : false}
                              type="date"
                              {...field}
                            />
                          </FormControl>
                        )}
                        {item.type === 'textarea' && (
                          <FormControl>
                            <Textarea
                              disabled={item.disabled ? item.disabled : defaultAnswer?.length ? true : false}
                              {...field}
                            />
                          </FormControl>
                        )}
                        {item.type === 'select' && (
                          <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger
                                disabled={item.disabled ? item.disabled : defaultAnswer?.length ? true : false}
                              >
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                              <SelectContent>
                                {item.options?.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                        )}

                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Checklist Items</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {radioItems.map((item) => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name={item.id}
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>{item.label}</FormLabel>
                        <FormControl>
                          <RadioGroup
                            disabled={defaultAnswer?.length ? true : false}
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            {item.options?.map((option) => (
                              <FormItem key={option} className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value={option} />
                                </FormControl>
                                <FormLabel className="font-normal">{option}</FormLabel>
                              </FormItem>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>
            <FormField
              control={form.control}
              name={'observaciones'}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OBSERVACIONES</FormLabel>
                  <FormControl>
                    <Textarea disabled={defaultAnswer?.length ? true : false} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!defaultAnswer?.length ? (
              <div className="flex justify-end">
                <Button type="submit">Guardar Checklist</Button>
              </div>
            ) : null}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

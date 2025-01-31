'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { CreateNewFormAnswer, UpdateVehicle } from '@/app/server/UPDATE/actions';
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
import { z } from 'zod';
import BackButton from '../BackButton';
import { PDFPreviewDialog } from '../pdf-preview-dialog';
import { TransporteSPANAYCHKHYS01 } from '../pdf/generators/TransporteSPANAYCHKHYS01';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Textarea } from '../ui/textarea';

export const checklistItems = {
  //Podemos armar un array de objetos que ya tengan las opciones
  luces: [
    'Asientos (Estado en general)',
    'Luces Altas',
    'Luces Bajas',
    'Luces de Giro',
    'Balizas',
    'Luces de Retroceso',
    'Luces Freno',
    'Luces de Estacionamiento',
  ],
  seguridad: [
    'BOTIQUIN PRIMEROS AUXILIOS',
    'Balizas triangulares / conos',
    'Chalecos reflectantes',
    'Apoya cabezas',
    'Revisión check Point/check Nut',
    'Arrestallamas',
    'Airbags frontales',
    'Matafuego',
  ],
  interior: [
    'Funcionamiento Tacógrafo (Microtrack)',
    'Funciones de tablero (luces testigo)',
    'Bocina',
    'Alarma de Retroceso',
    'Calefactor Desempañador',
    'Aire Acondicionado',
    'Limpia Parabrisas y Lava Parabrisas',
    'Parasol',
    'Luneta',
    'Ventanilla (apertura)',
    'Ventanilla (Cierre)',
    'Puertas (cierre efectivo)',
    'Espejo retrovisor',
    'Espejos laterales',
    'Cortinas/ Sogas / Soportes',
    'Cinturones de seguridad',
    'Apoya cabezas',
  ],
  mecanica: [
    'Suspensión (Amortiguadores)',
    'Criquet (Gato) y llave de rueda',
    'Filtro de Aire: Motor/Habitaculo Sopletear',
    'Bateria/Estado',
    'Nivel de fluidos y pérdidas',
    'Sistema de Freno (ABS)',
    'Cartelería de velocidad máxima',
    'Bandas laterales reflectivas',
    'Nivel de combustible',
    'Neumatico de auxilio',
    'Neumaticos Delanteros',
    'Neumaticos Traseros',
    'Esparragos y Torque',
    'Elementos sueltos',
    'Bolsas para depósito de residuos',
    'Limpieza de Cabina y Exterior',
  ],
};

const createChecklistSchema = (items: any) => {
  const schema: any = {};
  Object.entries(items).forEach(([section, sectionItems]: any) => {
    schema[section] = z.object(
      sectionItems.reduce((acc: any, item: any) => {
        acc[item] = z
          .string({
            required_error: 'Este campo es requerido',
          })
          .min(1, { message: 'Este campo es requerido' });
        return acc;
      }, {})
    );
  });
  return schema;
};

const formSchema = z.object({
  movil: z.string().min(1, { message: 'Movil es requerido' }),
  dominio: z.string().min(1, { message: 'Dominio es requerido' }),
  kilometraje: z.string().min(1, { message: 'Kilometraje es requerido' }),
  chofer: z.string().min(1, { message: 'Chofer es requerido' }),
  fecha: z.string().min(1, { message: 'Fecha es requerida' }),
  hora: z.string().min(1, { message: 'Hora es requerida' }),
  ...createChecklistSchema(checklistItems),
  observaciones: z.string().optional(),
});

export default function VehicleInspectionChecklist({
  defaultAnswer,
  equipments,
  currentUser,
  form_Info,
  resetQrSelection,
  default_equipment_id,
  empleado_name,
  singurl,
}: {
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
  currentUser?: Profile[];
  defaultAnswer?: CheckListAnswerWithForm[];
  form_Info: CustomForm[];
  default_equipment_id?: string;
  resetQrSelection?: (formType: string) => void;
  empleado_name?: string | undefined;
  singurl?: string | null;
}) {
  const [activeTab, setActiveTab] = useState('luces');
  const params = useParams();
  const router = useRouter();
  // const params = new URLSearchParams(searchParams as any);

  // console.log(
  //   'equipments?.find((equipment) => equipment.value === default_equipment_id)',
  //   equipments?.find((equipment) => equipment.value === default_equipment_id)
  // );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultAnswer?.length
      ? (defaultAnswer?.[0].answer as any) ?? {}
      : default_equipment_id
        ? {
            movil: default_equipment_id,
            dominio: equipments?.find((equipment) => equipment.value === default_equipment_id)?.domain,
            kilometraje: equipments?.find((equipment) => equipment.value === default_equipment_id)?.kilometer,
            chofer: empleado_name?.toLocaleUpperCase(),
            fecha: moment().format('YYYY-MM-DD'),
            hora: moment().format('HH:mm'),
          }
        : {
            fecha: moment().format('YYYY-MM-DD'),
            hora: moment().format('HH:mm'),
            chofer: currentUser?.[0].fullname?.toLocaleUpperCase(),
          },
  });
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
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

    //Comparar el kilometraje con el del equipo y si es mayor actualizarlo
    // console.log('equipment', equipment);
    // console.log(' data.movil', data.movil);
    if (equipment && Number(data.kilometraje) > Number(equipment.kilometer)) {
      await UpdateVehicle(equipment.value, { kilometer: data.kilometraje });
    }

    router.refresh();

    if (resetQrSelection) {
      resetQrSelection('');
    } else {
      router.push(`/dashboard/forms/${params.id}`);
    }
  };

  const mapFormValuesToPdfProps = (formValues: any) => {
    const mapping: { [key: string]: string } = {
      'Asientos (Estado en general)': 'asientosEstado',
      'Luces Altas': 'lucesAltas',
      'Luces Bajas': 'lucesBajas',
      'Luces de Giro': 'lucesGiro',
      Balizas: 'balizas',
      'Luces de Retroceso': 'lucesRetroceso',
      'Luces Freno': 'lucesFreno',
      'Luces de Estacionamiento': 'lucesEstacionamiento',
      'Funcionamiento Tacógrafo (Microtrack)': 'funcionamientoTacografo',
      'Funciones de tablero (luces testigo)': 'funcionesTablero',
      Bocina: 'bocina',
      'Alarma de Retroceso': 'alarmaRetroceso',
      'Calefactor Desempañador': 'calefactorDesempanador',
      'Aire Acondicionado': 'aireAcondicionado',
      'Limpia Parabrisas y Lava Parabrisas': 'limpiaParabrisas',
      Parasol: 'parasol',
      Luneta: 'luneta',
      'Ventanilla (apertura)': 'ventanillaApertura',
      'Ventanilla (Cierre)': 'ventanillaCierre',
      'Puertas (cierre efectivo)': 'puertasCierre',
      'Espejo retrovisor': 'espejoRetrovisor',
      'Espejos laterales': 'espejosLaterales',
      'Cortinas/ Sogas / Soportes': 'cortinasSogasSoportes',
      'Cinturones de seguridad': 'cinturones',
      'Apoya cabezas': 'apoyaCabezas2',
      'BOTIQUIN PRIMEROS AUXILIOS': 'botiquin',
      'Balizas triangulares / conos': 'balizasTriangulares',
      'Chalecos reflectantes': 'chalecosReflectantes',
      'Revisión check Point/check Nut': 'revisionCheckPoint',
      Arrestallamas: 'arrestallamas',
      'Airbags frontales': 'airbagsFrontales',
      Matafuego: 'matafuego',
      'Suspensión (Amortiguadores)': 'suspension',
      'Criquet (Gato) y llave de rueda': 'criquet',
      'Filtro de Aire: Motor/Habitaculo Sopletear': 'filtroAire',
      'Bateria/Estado': 'bateria',
      'Nivel de fluidos y pérdidas': 'nivelFluidos',
      'Sistema de Freno (ABS)': 'sistemaFreno',
      'Cartelería de velocidad máxima': 'carteleriaVelocidad',
      'Bandas laterales reflectivas': 'bandasLaterales',
      'Nivel de combustible': 'nivelCombustible',
      'Neumatico de auxilio': 'neumaticoAuxilio',
      'Neumaticos Delanteros': 'neumaticosDelanteros',
      'Neumaticos Traseros': 'neumaticosTraseros',
      'Esparragos y Torque': 'esparragosTorque',
      'Elementos sueltos': 'elementosSueltos',
      'Bolsas para depósito de residuos': 'bolsasResiduos',
      'Limpieza de Cabina y Exterior': 'limpiezaCabina',
    };

    const mappedValues: { [key: string]: any } = {
      movil: formValues.movil,
      chofer: formValues.chofer,
      kilometraje: formValues.kilometraje,
      fecha: formValues.fecha,
      dominio: formValues.dominio,
      hora: formValues.hora,
      observaciones: formValues.observaciones,
    };

    // Mapear valores de las secciones
    Object.entries(checklistItems).forEach(([section, items]) => {
      items.forEach((item: string) => {
        if (formValues[section]?.[item] && mapping[item]) {
          if (item === 'Apoya cabezas' && section === 'seguridad') {
            mappedValues['apoyaCabezas'] = formValues[section][item];
          } else {
            mappedValues[mapping[item]] = formValues[section][item];
            // Si es el nivel de fluidos, también lo asignamos a nivelFluidos2
            if (item === 'Nivel de fluidos y pérdidas') {
              mappedValues['nivelFluidos2'] = formValues[section][item];
            }
          }
        }
      });
    });

    return mappedValues;
  };

  const actualCompany = useLoggedUserStore((state) => state.actualCompany);

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
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div>
          <CardTitle className="text-xl sm:text-2xl md:text-3xl">
            {(form_Info[0].form as { description: string }).description}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2 sm:mt-0">{(form_Info[0].form as { title: string }).title}</p>
        </div>
        <div className="flex gap-4">
          <BackButton />
          {defaultAnswer && (
            <PDFPreviewDialog
              title={`Vista previa - ${form.getValues().movil || 'Formulario'}`}
              buttonText="Imprimir respuesta"
            >
              <div className="h-full w-full bg-white">
                <TransporteSPANAYCHKHYS01
                  data={mapFormValuesToPdfProps(form.getValues())}
                  companyLogo={actualCompany?.company_logo || '/logo.png'}
                  preview={true}
                  singurl={singurl}
                  title="CHECK LIST MANTENIMIENTO VEHICULAR"
                  description={`Conductor: ${form.getValues().chofer || 'No especificado'} - Fecha: ${form.getValues().fecha || new Date().toLocaleDateString()}`}
                />
              </div>
            </PDFPreviewDialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="movil"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel>EQUIPO</FormLabel>
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
                                    form.setValue('dominio', equipment.domain ?? equipment.serie);
                                    form.setValue('kilometraje', equipment.kilometer);
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
              <FormField
                control={form.control}
                name="dominio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DOMINIO</FormLabel>
                    <FormControl>
                      <Input disabled {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="kilometraje"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KILOMETRAJE</FormLabel>
                    <FormControl>
                      <Input disabled={defaultAnswer?.length ? true : false} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="chofer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CHOFER</FormLabel>
                    <FormControl>
                      <Input disabled {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fecha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FECHA</FormLabel>
                    <FormControl>
                      <Input disabled type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hora"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HORA</FormLabel>
                    <FormControl>
                      <Input disabled type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList
                className={cn(resetQrSelection ? 'flex flex-wrap h-auto' : 'grid w-full grid-cols-2 sm:grid-cols-4')}
              >
                {Object.keys(checklistItems).map((section) => (
                  <TabsTrigger
                    key={section}
                    value={section}
                    className={`flex-grow text-xs sm:text-sm ${form.formState.errors[section as any] ? 'bg-red-100' : ''}`}
                  >
                    {section.toUpperCase()}
                  </TabsTrigger>
                ))}
              </TabsList>
              {Object.entries(checklistItems).map(([section, items]) => (
                <TabsContent key={section} value={section}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {items.map((item) => (
                      <FormField
                        key={item}
                        control={form.control}
                        name={`${section}.${item}` as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{item}</FormLabel>
                            <FormControl>
                              <Select
                                disabled={defaultAnswer?.length ? true : false}
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <SelectTrigger className="w-full sm:w-[220px]">
                                  <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">1: Faltante</SelectItem>
                                  <SelectItem value="2">2: Roto</SelectItem>
                                  <SelectItem value="3">3: Regular / Dañado</SelectItem>
                                  <SelectItem value="4">4: Rayado</SelectItem>
                                  <SelectItem value="5">5: Golpeado / Abollado</SelectItem>
                                  <SelectItem value="6">6: OK</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones:</FormLabel>
                  <FormControl>
                    <Textarea disabled={defaultAnswer?.length ? true : false} {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              {defaultAnswer?.length ? (
                false
              ) : (
                <Button type="submit" className="w-full sm:w-auto">
                  Guardar Checklist
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

'use client';
import { PDFPreviewDialog } from '@/components/pdf-preview-dialog';
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
import { TransporteSPANAYCHKHYS03 } from '../pdf/generators/TransporteSPANAYCHKHYS03';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Textarea } from '../ui/textarea';

export const checklistItems03 = {
  general: [
    'Discos de freno',
    'Jaula antivuelco',
    'FRENOS DELANTEROS',
    'Puertas (cierre efectivo)',
    'Espejos retrovisores',
    'Cristales',
    'Lava parabrisas',
    'Paragolpe delantero',
    'Paragolpe trasero',
    'Pintura',
    'Estado de Parabrisas',
    'Limpia parabrisas',
    'Levantavidrios',
  ],
  carroceria: [
    'CARROCERÍA - CHASIS',
    'Chapa',
    'Bocina',
    'Funcionamiento Tacógrafo',
    'Funcionamiento impresora de tacografo',
    'Cartel luminoso de limite de velocidad',
    'Alarma acústica de limite de velocidad',
    'Alarma acústica de retroceso',
  ],
  luces: [
    'Luces de salida de emergencia',
    'Luces de tablero (luces testigos)',
    'Balizas intermitentes',
    'Luces de giro delanteras/laterales/traseras',
    'Luces de freno',
    'Luces de Retroceso',
    'Luces Bajas',
    'Luces antiniebla',
    'Luces de posición delanteras/laterales/traseras',
    'Luces Altas',
  ],
  mecanica: [
    'Frenos delanteros (Estado final)',
    'Pastillas de freno',
    'Calipers de freno',
    'Seguros de cardan',
    'ALINEACIÓN',
    'Crucetas',
    'Centro de cardan',
    'Rueda de auxilio',
    'TRANSMISIÓN',
    'Cardan',
  ],
  neumaticos: [
    'Estado bulones de rueda',
    'Ajuste bulones de rueda (Torquímetro)',
    'Colocación de (Check Points)',
    'Dibujo neumático (superior a 2mm)',
    'Llantas',
    'Presión de neumáticos',
  ],
  suspension: [
    'Bujes de barra estabilizadora',
    'TREN RODANTE',
    'Estado de neumáticos',
    'Bujes de paquete de elásticos (todos)',
    'Juego de masa (Porta masa)',
    'Casoletas',
  ],
  niveles: [
    'Nivel de liquido refrigerante',
    'Liquido de freno',
    'Nivel de agua de lavaparabrisas',
    'Aceite de diferencial delantero',
    'Aceite de diferencial trasero',
    'Estado de respiradero de diferencial',
    'Aceite de motor',
    'Fugas de aceite de caja',
    'Aceite de caja',
    'Fugas de aceite de diferencial',
    'Fugas de aceite de motor',
  ],
  seguridad: [
    'Extintor',
    'Bandas reflectivas laterales/frontales (blancas)',
    'Cartelería de velocidad máxima',
    'Bandas reflectivas traseras (rojas)',
    'Martillos de Seguridad',
    'Luces de Martillo de Seguridad',
    'Botiquín de PrImeros Auxilios',
  ],
  interior: [
    'Radio / estéreo',
    'Soporte matafuego',
    'Cinturones de seguridad',
    'Aibags',
    'Asientos (estado / reclinación)',
    'Apoyacabezas',
    'Calefactor / desempañador',
    'Aire acondicionado',
    'Instrumental',
    'Cerraduras',
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
  ...createChecklistSchema(checklistItems03),
  observaciones: z.string().optional(),
});

export default function VehicleMaintenanceChecklist({
  defaultAnswer,
  equipments,
  currentUser,
  form_Info,
  resetQrSelection,
  default_equipment_id,
  empleado_name,
  singurl,
}: {
  singurl?: string | null;
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
  resetQrSelection?: (formType: string) => void;
  default_equipment_id?: string;
  empleado_name?: string | undefined;
}) {
  const [activeTab, setActiveTab] = useState('general');
  const params = useParams();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultAnswer?.length
      ? (defaultAnswer?.[0].answer as any) ?? {}
      : default_equipment_id
        ? {
            movil: default_equipment_id,
            dominio:
              equipments?.find((equipment) => equipment.value === default_equipment_id)?.domain ??
              equipments?.find((equipment) => equipment.value === default_equipment_id)?.serie,
            kilometraje: equipments?.find((equipment) => equipment.value === default_equipment_id)?.kilometer ?? '0',
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
        {resetQrSelection ? (
          <Button onClick={() => resetQrSelection('')} variant="ghost" className="self-end">
            Volver
          </Button>
        ) : (
          <div className="flex gap-4">
            <BackButton />
            {defaultAnswer && (
              <PDFPreviewDialog buttonText="Imprimir respuesta">
                <div className="h-full w-full bg-white">
                  <TransporteSPANAYCHKHYS03
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
        )}
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
                className={cn(
                  resetQrSelection
                    ? 'flex flex-wrap h-auto '
                    : 'grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9'
                )}
              >
                {Object.keys(checklistItems03).map((section) => (
                  <TabsTrigger
                    key={section}
                    value={section}
                    className={`flex-grow text-xs sm:text-sm ${form.formState.errors[section as any] ? 'bg-red-100' : ''}`}
                  >
                    {section.toUpperCase()}
                  </TabsTrigger>
                ))}
              </TabsList>
              {Object.entries(checklistItems03).map(([section, items]) => (
                <TabsContent key={section} value={section}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
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
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="N">N: Normal</SelectItem>
                                  <SelectItem value="R">R: Reparado</SelectItem>
                                  <SelectItem value="NC">NC: No Corresponde</SelectItem>
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

'use client';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Form } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { CaretSortIcon, CheckIcon, PlusCircledIcon } from '@radix-ui/react-icons';
import { ChangeEvent, useEffect, useState } from 'react';
require('dotenv').config();

import { CheckboxDefaultValues } from '@/components/CheckboxDefValues';
import { useImageUpload } from '@/hooks/useUploadImage';
import { handleSupabaseError } from '@/lib/errorHandler';
import { useCountriesStore } from '@/store/countries';
import { useLoggedUserStore } from '@/store/loggedUser';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '../../supabase/supabase';
import BackButton from './BackButton';
import { ImageHander } from './ImageHandler';
import { Modal } from './Modal';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { CardDescription, CardHeader, CardTitle } from './ui/card';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
// import { useToast } from './ui/use-toast'

type VehicleType = {
  year: string;
  engine: string;
  chassis: string;
  serie: string;
  domain: string;
  intern_number: string;
  picture: string;
  type_of_vehicle: string;
  types_of_vehicles: { name: string };
  brand_vehicles: { name: string };
  brand: string;
  model_vehicles: { name: string };
  model: string;
  type: { name: string };
  id: string;
  allocated_to: string[];
};
type generic = {
  name: string;
  id: string;
};

type dataType = {
  tipe_of_vehicles: generic[];
  brand: {
    label: string;
    id: string;
  }[];
  models: {
    name: string;
    id: string;
  }[];
  types: {
    name: string;
    id: string;
  }[];
};

export default function VehiclesForm2({ id }: { id: string }) {
  const searchParams = useSearchParams();
  // const id = params
  const [accion, setAccion] = useState(searchParams.get('action'));
  const actualCompany = useLoggedUserStore((state) => state.actualCompany);
  const profile = useLoggedUserStore((state) => state);
  // let role = '';
  // if (profile?.actualCompany?.owner_id.id === profile?.credentialUser?.id) {
  //   role = profile?.actualCompany?.owner_id?.role as string;
  // } else {
  //   role = profile?.actualCompany?.share_company_users?.[0]?.role as string;
  // }
  const share = useLoggedUserStore((state) => state.sharedCompanies);
  const profile2 = useLoggedUserStore((state) => state.credentialUser?.id);
  const owner2 = useLoggedUserStore((state) => state.actualCompany?.owner_id.id);
  const users = useLoggedUserStore((state) => state);
  const company = useLoggedUserStore((state) => state.actualCompany?.id);
  
  let role = '';
  if (owner2 === profile2) {
    role = users?.actualCompany?.owner_id?.role as string;
  } else {
    
    const roleRaw = share
      .filter((item: any) =>
        item.company_id.id === company &&
        Object.values(item).some((value) => typeof value === 'string' && value.includes(profile2 as string))
      )
      .map((item: any) => item.role);
    role = roleRaw?.join('');
  }

  const [vehicle, setVehicle] = useState<VehicleType | null>(null);
  const pathname = usePathname();
  const [data, setData] = useState<dataType>({
    tipe_of_vehicles: [],
    brand: [],
    models: [],
    types: [],
  });

  const preloadFormData = (vehicleData: VehicleType) => {
    form.setValue('type_of_vehicle', vehicleData.type_of_vehicle.toString());
    form.setValue('brand', vehicle?.brand);
    form.setValue('model', vehicle?.model);
    form.setValue('year', vehicleData.year);
    form.setValue('engine', vehicleData.engine);
    form.setValue('chassis', vehicleData.chassis);
    form.setValue('serie', vehicleData.serie);
    form.setValue('domain', vehicleData.domain);
    form.setValue('intern_number', vehicleData.intern_number);
    form.setValue('picture', vehicleData.picture);
    form.setValue('type', vehicleData.type.name);
    form.setValue('allocated_to', vehicleData.allocated_to);
  };

  useEffect(() => {
    if (vehicle) {
      preloadFormData(vehicle);
    }
    if (vehicle && vehicle.type_of_vehicle === 'Vehículos') {
      setHideInput(true);
    }
    if (vehicle && vehicle.type_of_vehicle === 'Otros') {
      setHideInput(false)
    }
    if (!vehicle) {
      setHideInput(false);
    }
  }, [vehicle]);

  const fetchVehicleData = async () => {
    if (!id || !actualCompany?.id) return;
    try {
      const { data: vehicleData, error } = await supabase
        .from('vehicles')
        .select('*, brand_vehicles(name), model_vehicles(name),types_of_vehicles(name),type(name)')
        .eq('id', id)
        .eq('company_id', actualCompany?.id);

      //.single()

      if (error) {
        console.error('Error al obtener los datos del vehículo:', error);
      } else {
        const transformedData = vehicleData?.map((item: VehicleType) => ({
          ...item,
          type_of_vehicle: item.types_of_vehicles.name,
          brand: item.brand_vehicles.name,
          model: item.model_vehicles.name,
          type: item.type,
        }));

        setVehicle(transformedData[0]);
      }
    } catch (error) {
      console.error('Error al obtener los datos del vehículo:', error);
    }
  };

  useEffect(() => {
    fetchVehicleData();
  }, [id, actualCompany]);

  const router = useRouter();
  const [hideInput, setHideInput] = useState(false);
  const vehicleSchema = z.object({
    brand: z
      .string({
        required_error: 'La marca es requerida',
      })
      .optional(),
    model: z
      .string({
        required_error: 'El modelo es requerido',
      })
      .optional(),
    year: z.string({ required_error: 'El año es requerido' }).refine(
      (e) => {
        const year = Number(e);
        const actualYear = new Date().getFullYear();
        if (year !== undefined) {
          // Aquí puedes usar year de manera segura
          if (year < 1900 || year > actualYear) {
            return false;
          } else {
            return true;
          }
        } else {
          return 0;
        }
      },
      {
        message: 'El año debe ser mayor a 1900 y menor al año actual.',
      }
    ),
    engine: z
      .string({
        required_error: 'El motor es requerido',
      })
      .min(2, {
        message: 'El motor debe tener al menos 2 caracteres.',
      })
      .max(30, { message: 'El motor debe tener menos de 30 caracteres.' }),

    type_of_vehicle: z.string({ required_error: 'El tipo es requerido' }),
    chassis: hideInput
      ? z
          .string({
            required_error: 'El chasis es requerido',
          })
          .min(2, {
            message: 'El chasis debe tener al menos 2 caracteres.',
          })
          .max(30, { message: 'El chasis debe tener menos de 30 caracteres.' })
      : z.string().optional(),
    domain: hideInput
      ? z
          .string({
            required_error: 'El dominio es requerido',
          })
          .min(6, {
            message: 'El dominio debe tener al menos 6 caracteres.',
          })
          .max(7, { message: 'El dominio debe tener menos de 7 caracteres.' })
          .refine(
            (e) => {
              //old regex para validar dominio AAA000 (3 letras y 3 numeros)
              const year = Number(form.getValues('year'));

              const oldRegex = /^[A-Za-z]{3}[0-9]{3}$/;
              if (year !== undefined) {
                if (year <= 2015) {
                  return oldRegex.test(e);
                } else {
                  return true;
                }
              } else {
                return 0;
              }
            },
            {
              message: 'El dominio debe tener el formato AAA000.',
            }
          )
          .refine(
            (e) => {
              const year = Number(form.getValues('year'));

              const newRegex = /^[A-Za-z]{2}[0-9]{3}[A-Za-z]{2}$/;
              if (year !== undefined) {
                if (year >= 2017) {
                  return newRegex.test(e);
                } else {
                  return true;
                }
              } else {
                return 0;
              }
            },
            {
              message: 'El dominio debe tener el formato AA000AA.',
            }
          )
          .refine(
            (e) => {
              const year = Number(form.getValues('year'));

              const newRegex = /^[A-Za-z]{2}[0-9]{3}[A-Za-z]{2}$/;
              const oldRegex = /^[A-Za-z]{3}[0-9]{3}$/;
              if (year !== undefined) {
                if (year === 2016 || year === 2015) {
                  const result = newRegex.test(e) || oldRegex.test(e);
                  return result;
                } else {
                  return true;
                }
              } else {
                return 0;
              }
            },
            {
              message: 'El dominio debe tener uno de los siguientes formatos AA000AA o AAA000',
            }
          )
          .refine(
            async (domain: string) => {
              let { data: vehicles, error } = await supabase
                .from('vehicles')
                .select('*')
                .eq('domain', domain?.toUpperCase())
                .eq('company_id', actualCompany?.id);

              if (vehicles?.[0] && pathname === '/dashboard/equipment/action?action=new') {
                return false;
              } else {
                return true;
              }
            },
            { message: 'El dominio ya existe' }
          )
      : z.string().optional().nullable(),
    serie: hideInput
      ? z.string().optional()
      : z
          .string({
            required_error: 'La serie es requerida',
          })
          .min(2, {
            message: 'La serie debe tener al menos 2 caracteres.',
          })
          .max(30, { message: 'La serie debe tener menos de 3- caracteres.' }),
    intern_number: z
      .string({
        required_error: 'El número interno es requerido',
      })
      .min(2, {
        message: 'El número interno debe tener al menos 2 caracteres.',
      })
      .max(30, {
        message: 'El número interno debe tener menos de 30 caracteres.',
      }),
    picture: z.string().optional(),
    type: hideInput ? z.string().optional() : z.string({ required_error: 'El tipo es requerido' }),
    allocated_to: z.array(z.string()).optional(),
  });
  const [readOnly, setReadOnly] = useState(accion === 'view' ? true : false);

  const fetchData = async () => {
    let { data: types_of_vehicles } = await supabase.from('types_of_vehicles').select('*');

    let { data: brand_vehicles } = await supabase.from('brand_vehicles').select('*');

    let { data: type, error } = await supabase.from('type').select('*');
    setData({
      ...data,
      tipe_of_vehicles: types_of_vehicles as generic[],
      brand: (brand_vehicles || [])?.map((e) => {
        return { label: e.name as string, id: e.id as string };
      }),
      types: type as generic[],
    });
  };

  supabase
    .channel('custom-all-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'brand_vehicles' }, () => {
      fetchData();
    })
    .subscribe();

  supabase
    .channel('custom-all-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'model_vehicles' }, () => {
      const brand = form.getValues('brand');
      const brand_id = data.brand.find((e) => e.label === brand)?.id as string;
      fetchModels(brand_id || '');
    })
    .subscribe();

  useEffect(() => {
    fetchData()
  }, [])
  const fetchContractors = useCountriesStore(state => state.fetchContractors)
  const subscribeToCustomersChanges = useCountriesStore(state => state.subscribeToCustomersChanges)
  useEffect(() => {
    fetchContractors()

    const unsubscribe = subscribeToCustomersChanges()

    return () => {
      unsubscribe()
    }
  }, [fetchContractors, subscribeToCustomersChanges])
  
  const contractorCompanies = useCountriesStore(state => state.customers?.filter((company:any) => company.company_id.toString() === actualCompany?.id && company.is_active))
  const vehicleBrands = data.brand
  const types = data.tipe_of_vehicles?.map(e => e.name)
  const vehicleModels = data.models
  const types_vehicles = data.types?.map(e => e.name)

  const form = useForm<z.infer<typeof vehicleSchema>>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      year: vehicle?.year || undefined,
      engine: vehicle?.engine || '',
      chassis: vehicle?.chassis || '',
      serie: vehicle?.serie || '',
      domain: vehicle?.domain || '',
      intern_number: vehicle?.intern_number || '',
      picture: vehicle?.picture || '',
      allocated_to: [],
    },
  });

  const fetchModels = async (brand_id: string) => {
    let { data: model_vehicles } = await supabase.from('model_vehicles').select('*').eq('brand', brand_id);

    setData({
      ...data,
      models: model_vehicles as generic[],
    });
  };
  const url = process.env.NEXT_PUBLIC_PROJECT_URL;
  const mandatoryDocuments = useCountriesStore((state) => state.mandatoryDocuments);
  const loggedUser = useLoggedUserStore((state) => state.credentialUser?.id);

  async function onCreate(values: z.infer<typeof vehicleSchema>) {
    toast.promise(
      async () => {
        const { type_of_vehicle, brand, model, domain } = values;

        try {
          const { data: vehicle, error } = await supabase
            .from('vehicles')
            .insert([
              {
                ...values,
                domain: domain?.toUpperCase() || null,
                type_of_vehicle: data.tipe_of_vehicles.find((e) => e.name === type_of_vehicle)?.id,
                brand: data.brand.find((e) => e.label === brand)?.id,
                model: data.models.find((e) => e.name === model)?.id,
                type: data.types.find((e) => e.name === values.type)?.id,
                company_id: actualCompany?.id,
              },
            ])
            .select();

          const documentsMissing: {
            applies: number;
            id_document_types: string;
            validity: string | null;
            user_id: string | undefined;
          }[] = [];

          mandatoryDocuments?.Equipos.forEach((document) => {
            documentsMissing.push({
              applies: vehicle?.[0]?.id,
              id_document_types: document.id,
              validity: null,
              user_id: loggedUser,
            });
          });

          const { data: documentData, error: documentError } = await supabase
            .from('documents_equipment')
            .insert(documentsMissing)
            .select();

          if (documentError) {
            throw new Error(handleSupabaseError(documentError.message));
          }

          if (error) {
            throw new Error(handleSupabaseError(error.message));
          }

          const id = vehicle?.[0].id;

          const fileExtension = imageFile?.name.split('.').pop();

          if (imageFile) {
            try {
              const renamedFile = new File([imageFile], `${id.replace(/\s/g, '')}.${fileExtension}`, {
                type: `image/${fileExtension}`,
              });
              await uploadImage(renamedFile, 'vehicle_photos');

              try {
                const vehicleImage = `${url}/vehicle_photos/${id}.${fileExtension}`.trim().replace(/\s/g, '');

                const { data, error } = await supabase
                  .from('vehicles')
                  .update({ picture: vehicleImage })
                  .eq('id', id)
                  .eq('company_id', actualCompany?.id);
              } catch (error) {}
            } catch (error: any) {
              throw new Error(handleSupabaseError(error.message));
            }
          }

          router.push('/dashboard/equipment');
        } catch (error) {
          console.error(error);
        }
      },
      {
        loading: 'Guardando...',
        success: 'Vehículo registrado',
        error: (error) => {
          return error;
        },
      }
    );
  }
  const { uploadImage } = useImageUpload();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [base64Image, setBase64Image] = useState<string>('');

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      setImageFile(file);
      // Convertir la imagen a base64
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          setBase64Image(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };


  async function onUpdate(values: z.infer<typeof vehicleSchema>) {
    toast.promise(
      async () => {
        const { type_of_vehicle, brand, model, year, engine, chassis, serie, domain, intern_number, picture, type } =
          values;

        try {
          const { data: updated, error: updatedERROR } = await supabase
            .from('vehicles')
            .update({
              type_of_vehicle: data.tipe_of_vehicles.find((e) => e.name === type_of_vehicle)?.id,
              brand: data.brand.find((e) => e.label === brand)?.id,
              model: data.models.find((e) => e.name === model)?.id,
              year: year,
              engine: engine,
              chassis: chassis,
              serie: serie,
              domain: domain?.toUpperCase(),
              intern_number: intern_number,
              picture: picture,
              allocated_to: values.allocated_to,
            })
            .eq('id', vehicle?.id)
            .eq('company_id', actualCompany?.id)
            .select();


          const id = vehicle?.id;
          const fileExtension = imageFile?.name.split('.').pop();
          if (imageFile) {
            try {
              const renamedFile = new File([imageFile], `${id?.replace(/\s/g, '')}.${fileExtension}`, {
                type: `image/${fileExtension}`,
              });
              await uploadImage(renamedFile, 'vehicle_photos');

              try {
                const vehicleImage = `${url}/vehicle_photos/${id}.${fileExtension}?timestamp=${Date.now()}`
                  .trim()
                  .replace(/\s/g, '');
                const { data, error } = await supabase
                  .from('vehicles')
                  .update({ picture: vehicleImage })
                  .eq('id', id)
                  .eq('company_id', actualCompany?.id);
              } catch (error) {}
            } catch (error: any) {
              throw new Error('Error al subir la imagen');
            }
          }

          setReadOnly(true);
          router.push('/dashboard/equipment');
        } catch (error) {
          throw new Error('Error al editar el vehículo');
        }
      },
      {
        loading: 'Guardando...',
        success: 'Vehículo editado',
        error: (error) => {
          return error;
        },
      }
    );
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <section>
        <header className="flex justify-between gap-4">
          <div className="mb-8 flex justify-between w-full">
            <CardHeader className="h-[152px] flex flex-row gap-4 justify-between items-center flex-wrap w-full bg-muted dark:bg-muted/50 border-b-2">
              {accion === 'edit' || accion === 'view' ? (
                <div className="flex gap-3 items-center">
                  <CardTitle className=" font-bold tracking-tight">
                    <Avatar className="size-[100px]">
                      <AvatarImage
                        className="object-cover border-2 border-black/30 rounded-full"
                        src={
                          vehicle?.picture ||
                          'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80'
                        }
                        alt="Imagen del empleado"
                      />
                      <AvatarFallback>CC</AvatarFallback>
                    </Avatar>
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-2xl">
                    Tipo de equipo: {vehicle?.type.name} <br />
                    Numero interno: {vehicle?.intern_number}
                  </CardDescription>
                </div>
              ) : (
                <div>
                  <CardTitle className="font-bold tracking-tight text-3xl">
                    {accion === 'edit'
                      ? 'Editar equipo'
                      : accion === 'view'
                        ? `Equipo ${vehicle?.type_of_vehicle} ${vehicle?.intern_number}`
                        : 'Agregar equipo'}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-xl">
                    {accion === 'edit' || accion === 'view'
                      ? `${readOnly ? 'Vista previa de equipo' : ' En esta vista puedes editar los datos del equipo'}`
                      : 'En esta vista puedes agregar un nuevo equipo'}
                  </CardDescription>
                </div>
              )}

              <div className="mt-4">
                {role !== 'Invitado' && readOnly && accion === 'view' && (
                  <div className="flex flex-grap gap-2">
                    <Button
                      variant="primary"
                      onClick={() => {
                        setReadOnly(false);
                      }}
                    >
                      Habilitar edición
                    </Button>

                    <BackButton />
                  </div>
                )}
              </div>
            </CardHeader>
          </div>
        </header>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(accion === 'edit' || accion === 'view' ? onUpdate : onCreate)}
            className="space-y-8 w-full px-6 pb-3"
          >
            <div className=" flex gap-[2vw] flex-wrap items-center">
              <FormField
                control={form.control}
                name="type_of_vehicle"
                render={({ field }) => (
                  <FormItem className="flex flex-col min-w-[250px]">
                    <FormLabel>
                      Tipo de equipo <span style={{ color: 'red' }}>*</span>{' '}
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            disabled={readOnly}
                            variant="outline"
                            role="combobox"
                            value={vehicle?.type_of_vehicle}
                            className={cn('w-[250px] justify-between', !field.value && 'text-muted-foreground')}
                          >
                            {field.value ? field.value : 'Seleccionar tipo de equipo'}
                            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[250px] p-0">
                        <Command>
                          <CommandInput
                            disabled={readOnly}
                            placeholder="Buscar tipo de vehículo..."
                            className="h-9"
                            //value={field.value}
                          />
                          <CommandEmpty>No se encontro ningun resultado</CommandEmpty>
                          <CommandGroup>
                            {types?.map((option) => (
                              <CommandItem
                                value={option}
                                key={option}
                                onSelect={() => {
                                  form.setValue('type_of_vehicle', option);

                                  if (option === 'Vehículos') {
                                    setHideInput(true);
                                  }
                                  if (option === 'Otros') {
                                    setHideInput(false);
                                  }
                                }}
                              >
                                {option}
                                <CheckIcon
                                  className={cn(
                                    'ml-auto h-4 w-4',
                                    option === field.value ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>Selecciona el tipo de vehículo</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem className="flex flex-col min-w-[250px]">
                    <FormLabel>
                      Marca <span style={{ color: 'red' }}>*</span>
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            disabled={readOnly}
                            variant="outline"
                            role="combobox"
                            value={field.value}
                            className={cn('w-[250px] justify-between', !field.value && 'text-muted-foreground')}
                          >
                            {field.value || 'Seleccionar marca'}
                            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[250px] p-0 max-h-[200px] overflow-y-auto">
                        <Command>
                          <CommandInput disabled={readOnly} placeholder="Buscar marca..." className="h-9" />
                          <CommandEmpty className="py-2 px-2">
                            <Modal modal="addBrand" fetchData={fetchData}>
                              <Button
                                disabled={readOnly}
                                variant="outline"
                                role="combobox"
                                className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}
                              >
                                Agregar marca
                                <PlusCircledIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </Modal>
                          </CommandEmpty>
                          <CommandGroup>
                            {vehicleBrands?.map((option) => (
                              <CommandItem
                                value={option.label}
                                key={option.label}
                                onSelect={() => {
                                  form.setValue('brand', option.label);
                                  const brand_id = data.brand.find((e) => e.label === option.label)?.id;
                                  fetchModels(brand_id as string);
                                }}
                              >
                                {option.label}
                                <CheckIcon
                                  className={cn(
                                    'ml-auto h-4 w-4',
                                    option.label === field.value ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>Selecciona la marca del vehículo</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem className="flex flex-col min-w-[250px]">
                    <FormLabel>
                      {' '}
                      Modelo <span style={{ color: 'red' }}>*</span>
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            disabled={readOnly}
                            variant="outline"
                            role="combobox"
                            className={cn('w-[250px] justify-between', !field.value && 'text-muted-foreground')}
                          >
                            {field.value || 'Seleccionar marca'}
                            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[250px] p-0">
                        <Command>
                          <CommandInput disabled={readOnly} placeholder="Buscar modelo..." className="h-9" />
                          <CommandEmpty className="py-2 px-2">
                            <Modal modal="addModel" fetchModels={fetchModels} brandOptions={data.brand}>
                              <Button
                                disabled={readOnly}
                                variant="outline"
                                role="combobox"
                                className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}
                              >
                                Agregar modelo
                                <PlusCircledIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </Modal>
                          </CommandEmpty>
                          <CommandGroup>
                            <>
                              {vehicleModels?.map((option) => (
                                <CommandItem
                                  value={option.name}
                                  key={option.name}
                                  onSelect={() => {
                                    form.setValue('model', option.name);
                                  }}
                                >
                                  {option.name}
                                  <CheckIcon
                                    className={cn(
                                      'ml-auto h-4 w-4',
                                      option.name === field.value ? 'opacity-100' : 'opacity-0'
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </>
                            <>
                              <Modal modal="addModel" fetchModels={fetchModels} brandOptions={data.brand}>
                                <Button
                                  disabled={readOnly}
                                  variant="outline"
                                  role="combobox"
                                  className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}
                                >
                                  Agregar modelo
                                  <PlusCircledIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </Modal>
                            </>
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>Selecciona el modelo del vehículo</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem className="flex flex-col min-w-[250px]">
                    <FormLabel>
                      {' '}
                      Año <span style={{ color: 'red' }}>*</span>
                    </FormLabel>
                    <Input
                      {...field}
                      disabled={readOnly}
                      className="input w-[250px]"
                      placeholder="Año"
                      value={field.value !== undefined ? field.value : vehicle?.year || ''}
                      onChange={(e) => {
                        form.setValue('year', e.target.value);
                      }}
                    />
                    <FormDescription>Ingrese el año del vehículo</FormDescription>
                    <FormMessage className="max-w-[250px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="engine"
                render={({ field }) => (
                  <FormItem className="flex flex-col min-w-[250px]">
                    <FormLabel>Motor del vehículo</FormLabel>
                    <Input
                      {...field}
                      disabled={readOnly}
                      className="input w-[250px]"
                      placeholder="Ingrese el tipo de motor"
                      value={field.value}
                    />
                    <FormDescription>Ingrese el tipo de motor del vehículo</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className={cn('flex flex-col min-w-[250px]', form.getValues('type_of_vehicle'))}>
                    <FormLabel>
                      Tipo <span style={{ color: 'red' }}>*</span>{' '}
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={readOnly}
                            value={field.value}
                            className={cn('w-[250px] justify-between', !field.value && 'text-muted-foreground')}
                          >
                            {field.value ? field.value : 'Seleccione tipo'}
                            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[250px] p-0">
                        <Command>
                          <CommandInput placeholder="Buscar tipo..." className="h-9" />
                          <CommandEmpty>No se encontro ningun resultado</CommandEmpty>
                          <CommandGroup>
                            {types_vehicles?.map((option) => (
                              <CommandItem
                                value={option}
                                key={option}
                                onSelect={() => {
                                  form.setValue('type', option);
                                }}
                              >
                                {option}
                                <CheckIcon
                                  className={cn(
                                    'ml-auto h-4 w-4',
                                    option === field.value ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>Selecciona el tipo</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="chassis"
                render={({ field }) => (
                  <FormItem className={cn('flex flex-col min-w-[250px]', !hideInput && 'hidden')}>
                    <FormLabel>
                      Chasis del vehículo<span style={{ color: 'red' }}>*</span>
                    </FormLabel>
                    <Input
                      {...field}
                      disabled={readOnly}
                      type="text"
                      className="input w-[250px]"
                      placeholder="Ingrese el chasis"
                      value={field.value !== '' ? field.value : vehicle?.chassis || ''}
                      onChange={(e) => {
                        form.setValue('chassis', e.target.value);
                      }}
                    />
                    <FormDescription>Ingrese el chasis del vehículo</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serie"
                render={({ field }) => (
                  <FormItem
                    className={cn(
                      'flex flex-col min-w-[250px]',
                      form.getValues('type_of_vehicle') && hideInput && 'hidden'
                    )}
                  >
                    <FormLabel>
                      Serie del vehículo<span style={{ color: 'red' }}>*</span>
                    </FormLabel>
                    <Input
                      {...field}
                      type="text"
                      disabled={readOnly}
                      className="input w-[250px]"
                      placeholder="Ingrese la serie"
                      onChange={(e) => {
                        form.setValue('serie', e.target.value);
                      }}
                      defaultValue={vehicle?.serie}
                    />

                    <FormDescription>Ingrese la serie del vehículo</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem className={cn('flex flex-col min-w-[250px]', !hideInput && 'hidden')}>
                    <FormLabel>
                      Dominio del vehículo
                      <span style={{ color: 'red' }}>*</span>
                    </FormLabel>
                    <Input
                      {...field}
                      disabled={readOnly}
                      type="text"
                      className="input w-[250px]"
                      placeholder="Ingrese el dominio"
                      value={field.value !== '' ? field.value ?? '' : vehicle?.domain ?? ''}
                      defaultValue={vehicle?.domain}
                      onChange={(e) => {
                        form.setValue('domain', e.target.value);
                      }}
                    />
                    <FormDescription>Ingrese el dominio del vehículo</FormDescription>
                    <FormMessage className="w-[250px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="intern_number"
                render={({ field }) => (
                  <FormItem className="flex flex-col min-w-[250px]">
                    <FormLabel>
                      Número interno del vehículo
                      <span style={{ color: 'red' }}>*</span>
                    </FormLabel>
                    <Input
                      {...field}
                      disabled={readOnly}
                      type="text"
                      className="input w-[250px]"
                      placeholder="Ingrese el número interno"
                      value={field.value !== '' ? field.value : vehicle?.intern_number || ''}
                      onChange={(e) => {
                        form.setValue('intern_number', e.target.value);
                      }}
                    />
                    <FormDescription>Ingrese el número interno del vehículo</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className=" min-w-[250px] flex flex-col gap-2">
                <FormField
                  control={form.control}
                  name="allocated_to"
                  render={({ field }) => (
                    <>
                      <CheckboxDefaultValues
                        disabled={readOnly}
                        options={contractorCompanies}
                        required={true}
                        field={field}
                        placeholder="Afectado a"
                      />
                      <FormDescription>Selecciona a quien se le asignará el equipo</FormDescription>
                    </>
                  )}
                />
              </div>
              <div className="w-[300px] flex  gap-2">
                <FormField
                  control={form.control}
                  name="picture"
                  render={({ field }) => (
                    <FormItem className="">
                      <FormControl>
                        <div className="flex lg:items-center flex-wrap  flex-col lg:flex-row gap-8">
                          <ImageHander
                            labelInput="Subir foto"
                            desciption="Subir foto del vehículo"
                            handleImageChange={handleImageChange}
                            base64Image={base64Image} //nueva
                            disabled={readOnly}
                            inputStyle={{
                              width: '400px',
                              maxWidth: '300px',
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            {!readOnly && (
              <Button type="submit" className="mt-5">
                {accion === 'edit' || accion === 'view' ? 'Guardar cambios' : 'Agregar equipo'}
              </Button>
            )}
          </form>
        </Form>
      </section>
    </Suspense>
  );
}

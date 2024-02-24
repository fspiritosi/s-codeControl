'use client'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import { Form } from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useImageUpload } from '@/hooks/useUploadImage'
import { cn } from '@/lib/utils'
import { useLoggedUserStore } from '@/store/loggedUser'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CaretSortIcon,
  CheckIcon,
  PlusCircledIcon,
} from '@radix-ui/react-icons'
import { useRouter } from 'next/navigation'
import { ChangeEvent, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { supabase } from '../../supabase/supabase'
import { ImageHander } from './ImageHandler'
import { Modal } from './Modal'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { Input } from './ui/input'
import { useToast } from './ui/use-toast'

type generic = {
  name: string
  id: string
}

type dataType = {
  tipe_of_vehicles: generic[]
  brand: {
    label: string
    id: string
  }[]
  models: {
    name: string
    id: string
  }[]
  types: {
    name: string
    id: string
  }[]
}

export const VehiclesForm = () => {
  const { toast } = useToast()
  const actualCompany = useLoggedUserStore(state => state.actualCompany)

  const [data, setData] = useState<dataType>({
    tipe_of_vehicles: [],
    brand: [],
    models: [],
    types: [],
  })

  const router = useRouter()
  const [hideInput, setHideInput] = useState(false)

  const vehicleSchema = z.object({
    brand: z.string({
      required_error: 'La marca es requerida',
    }),
    model: z.string({
      required_error: 'El modelo es requerido',
    }),
    year: z
      .number({ required_error: 'El año es requerido' })
      .min(1900, {
        message: 'El año debe ser mayor a 1900',
      })
      .max(2023, {
        message: 'El año debe ser menor a 2023',
      }),
    engine: z
      .string({
        required_error: 'El motor es requerido',
      })
      .min(2, {
        message: 'El motor debe tener al menos 2 caracteres.',
      })
      .max(15, { message: 'El motor debe tener menos de 15 caracteres.' }),
    type_of_vehicle: z.string({ required_error: 'El tipo es requerido' }),
    chassis: hideInput
      ? z
          .string({
            required_error: 'El chasis es requerido',
          })
          .min(2, {
            message: 'El chasis debe tener al menos 2 caracteres.',
          })
          .max(15, { message: 'El chasis debe tener menos de 15 caracteres.' })
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
            e => {
              //old regex para validar dominio AAA000 (3 letras y 3 numeros)
              const year = form.getValues('year')

              const oldRegex = /^[A-Za-z]{3}[0-9]{3}$/
              if (year < 2016) {
                return oldRegex.test(e)
              } else {
                return true
              }
            },
            {
              message: 'El dominio debe tener el formato AAA000.',
            },
          )
          .refine(
            e => {
              //new regex para validar dominio AA000AA
              const year = form.getValues('year')

              const newRegex = /^[A-Za-z]{2}[0-9]{3}[A-Za-z]{2}$/
              if (year >= 2016) {
                return newRegex.test(e)
              } else {
                return true
              }
            },
            {
              message: 'El dominio debe tener el formato AA000AA.',
            },
          )
          .refine(
            async (domain: string) => {
              let { data: vehicles, error } = await supabase
                .from('vehicles')
                .select('*')
                .eq('domain', domain.toUpperCase())

              if (vehicles?.[0]) {
                return false
              } else {
                return true
              }
            },
            { message: 'El dominio ya existe' },
          )
      : z.string().optional(),
    serie: hideInput
      ? z.string().optional()
      : z
          .string({
            required_error: 'La serie es requerida',
          })
          .min(3, {
            message: 'La serie debe tener al menos 3 caracteres.',
          })
          .max(15, { message: 'La serie debe tener menos de 15 caracteres.' }),
    intern_number: z
      .string({
        required_error: 'El número interno es requerido',
      })
      .min(2, {
        message: 'El número interno debe tener al menos 2 caracteres.',
      })
      .max(15, {
        message: 'El número interno debe tener menos de 15 caracteres.',
      }),
    picture: z.string().optional(),
    type: hideInput
      ? z.string().optional()
      : z.string({ required_error: 'El tipo es requerido' }),
  })

  const fetchData = async () => {
    let { data: types_of_vehicles } = await supabase
      .from('types_of_vehicles')
      .select('*')

    let { data: brand_vehicles } = await supabase
      .from('brand_vehicles')
      .select('*')

    let { data: type, error } = await supabase.from('type').select('*')

    setData({
      ...data,
      tipe_of_vehicles: types_of_vehicles as generic[],
      brand: (brand_vehicles || []).map(e => {
        return { label: e.name as string, id: e.id as string }
      }),
      types: type as generic[],
    })
  }

  supabase
    .channel('custom-all-channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'brand_vehicles' },
      () => {
        fetchData()
      },
    )
    .subscribe()

  supabase
    .channel('custom-all-channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'model_vehicles' },
      () => {
        const brand = form.getValues('brand')
        const brand_id = data.brand.find(e => e.label === brand)?.id as string
        fetchModels(brand_id || '')
      },
    )
    .subscribe()

  useEffect(() => {
    fetchData()
  }, [])

  const vehicleBrands = data.brand
  const types = data.tipe_of_vehicles?.map(e => e.name)
  const vehicleModels = data.models
  const types_vehicles = data.types?.map(e => e.name)

  const form = useForm<z.infer<typeof vehicleSchema>>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      year: 0,
      engine: '',
      chassis: '',
      serie: '',
      domain: '',
      intern_number: '',
      picture: '',
    },
  })

  const fetchModels = async (brand_id: string) => {
    let { data: model_vehicles } = await supabase
      .from('model_vehicles')
      .select('*')
      .eq('brand', brand_id)

    setData({
      ...data,
      models: model_vehicles as generic[],
    })
  }

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof vehicleSchema>) {
    const { type_of_vehicle, brand, model, domain } = values
    const companyId = actualCompany?.id
    try {
      const { data: vehicle, error } = await supabase
        .from('vehicles')
        .insert([
          {
            ...values,
            domain: domain?.toUpperCase(),
            type_of_vehicle: data.tipe_of_vehicles.find(
              e => e.name === type_of_vehicle,
            )?.id,
            brand: data.brand.find(e => e.label === brand)?.id,
            model: data.models.find(e => e.name === model)?.id,
            company_id: actualCompany?.id,
          },
        ])
        .select()

      const id = vehicle?.[0].id
      const fileExtension = imageFile?.name.split('.').pop()
      if (imageFile) {
        try {
          const renamedFile = new File([imageFile], `${id}.${fileExtension}`, {
            type: `image/${fileExtension}`,
          })
          await uploadImage(renamedFile, 'vehicle_photos')

          try {
            const vehicleImage = `https://zktcbhhlcksopklpnubj.supabase.co/storage/v1/object/public/vehicle_photos/${id}.${fileExtension}`
            const { data, error } = await supabase
              .from('vehicles')
              .update({ picture: vehicleImage })
              .eq('id', id)
          } catch (error) {}
        } catch (error: any) {
          toast({
            variant: 'destructive',
            title: 'Error al subir la imagen',
            description:
              'No pudimos registrar la imagen, pero el ususario fue registrado correctamente',
          })
        }
      }

      if (!error) {
        toast({
          title: 'Vehículo registrado',
          description: 'El vehículo fue registrado con éxito',
        })
        router.push('/dashboard/equipment')
      } else {
        toast({
          variant: 'destructive',
          title: 'Error al registrar el vehículo',
        })
      }
    } catch (error) {
      toast({
        title: 'Error al registrar el vehículo',
      })
    }
  }

  const { uploadImage } = useImageUpload()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [base64Image, setBase64Image] = useState<string>('')
  // const [disabled, setDisabled] = useState<boolean>(true)

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (file) {
      setImageFile(file)
      // Convertir la imagen a base64
      const reader = new FileReader()
      reader.onload = e => {
        if (e.target && typeof e.target.result === 'string') {
          setBase64Image(e.target.result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 w-full"
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
                          variant="outline"
                          role="combobox"
                          className={cn(
                            'w-[250px] justify-between',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {field.value
                            ? field.value
                            : 'Seleccionar tipo de equipo'}
                          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[250px] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Buscar tipo de equipo..."
                          className="h-9"
                        />
                        <CommandEmpty>
                          No se encontro ningun resultado
                        </CommandEmpty>
                        <CommandGroup>
                          {types?.map(option => (
                            <CommandItem
                              value={option}
                              key={option}
                              onSelect={() => {
                                form.setValue('type_of_vehicle', option)
                                // setHideInput(option === 'Otros')
                                if (option === 'Vehículos') {
                                  setHideInput(true)
                                }
                                if (option === 'Otros') {
                                  setHideInput(false)
                                }
                              }}
                            >
                              {option}
                              <CheckIcon
                                className={cn(
                                  'ml-auto h-4 w-4',
                                  option === field.value
                                    ? 'opacity-100'
                                    : 'opacity-0',
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Selecciona el tipo de equipo
                  </FormDescription>
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
                          variant="outline"
                          role="combobox"
                          className={cn(
                            'w-[250px] justify-between',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {field.value
                            ? vehicleBrands.find(
                                option => option.label === field.value,
                              )?.label
                            : 'Seleccionar marca'}
                          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[250px] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Buscar marca..."
                          className="h-9"
                        />
                        <CommandEmpty className="py-2 px-2">
                          <Modal modal="addBrand" fetchData={fetchData}>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                'w-full justify-between',
                                !field.value && 'text-muted-foreground',
                              )}
                            >
                              Agregar marca
                              <PlusCircledIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </Modal>
                        </CommandEmpty>
                        <CommandGroup>
                          {vehicleBrands.map(option => (
                            <CommandItem
                              value={option.label}
                              key={option.label}
                              onSelect={() => {
                                form.setValue('brand', option.label)
                                const brand_id = data.brand.find(
                                  e => e.label === option.label,
                                )?.id
                                fetchModels(brand_id as string)
                              }}
                            >
                              {option.label}
                              <CheckIcon
                                className={cn(
                                  'ml-auto h-4 w-4',
                                  option.label === field.value
                                    ? 'opacity-100'
                                    : 'opacity-0',
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Selecciona la marca del vehículo
                  </FormDescription>
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
                    Modelo <span style={{ color: 'red' }}>*</span>
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            'w-[250px] justify-between',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {field.value
                            ? vehicleModels.find(
                                option => option.name === field.value,
                              )?.name
                            : 'Seleccionar modelo'}
                          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[250px] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Buscar modelo..."
                          className="h-9"
                        />
                        <CommandEmpty className="py-2 px-2">
                          <Modal
                            modal="addModel"
                            fetchModels={fetchModels}
                            brandOptions={data.brand}
                          >
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                'w-full justify-between',
                                !field.value && 'text-muted-foreground',
                              )}
                            >
                              Agregar modelo
                              <PlusCircledIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </Modal>
                        </CommandEmpty>
                        <CommandGroup>
                          {vehicleModels.map(option => (
                            <CommandItem
                              value={option.name}
                              key={option.name}
                              onSelect={() => {
                                form.setValue('model', option.name)
                              }}
                            >
                              {option.name}
                              <CheckIcon
                                className={cn(
                                  'ml-auto h-4 w-4',
                                  option.name === field.value
                                    ? 'opacity-100'
                                    : 'opacity-0',
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>Selecciona el modelo del</FormDescription>
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
                    Año <span style={{ color: 'red' }}>*</span>
                  </FormLabel>
                  <Input
                    {...field}
                    type="number"
                    className="input w-[250px]"
                    placeholder="Año"
                    onChange={e => {
                      form.setValue('year', Number(e.target.value))
                    }}
                  />
                  <FormDescription>Ingrese el año del vehículo</FormDescription>
                  <FormMessage />
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
                    type="text"
                    className="input w-[250px]"
                    placeholder="Ingrese el tipo de motor"
                    onChange={e => {
                      form.setValue('engine', e.target.value)
                    }}
                  />
                  <FormDescription>
                    Ingrese el tipo de motor del vehículo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem
                  className={cn(
                    'flex flex-col min-w-[250px]',
                    form.getValues('type_of_vehicle') && hideInput && 'hidden',
                  )}
                >
                  <FormLabel>
                    Tipo <span style={{ color: 'red' }}>*</span>{' '}
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            'w-[250px] justify-between',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {field.value ? field.value : 'Seleccionar tipo'}
                          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[250px] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Buscar tipo..."
                          className="h-9"
                        />
                        <CommandEmpty>
                          No se encontro ningun resultado
                        </CommandEmpty>
                        <CommandGroup>
                          {types_vehicles?.map(option => (
                            <CommandItem
                              value={option}
                              key={option}
                              onSelect={() => {
                                form.setValue('type', option)
                              }}
                            >
                              {option}
                              <CheckIcon
                                className={cn(
                                  'ml-auto h-4 w-4',
                                  option === field.value
                                    ? 'opacity-100'
                                    : 'opacity-0',
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
                <FormItem
                  className={cn(
                    'flex flex-col min-w-[250px]',
                    !hideInput && 'hidden',
                  )}
                >
                  <FormLabel>
                    Chasis del vehículo <span style={{ color: 'red' }}>*</span>
                  </FormLabel>
                  <Input
                    {...field}
                    type="text"
                    className="input w-[250px]"
                    placeholder="Ingrese el chasis"
                    onChange={e => {
                      form.setValue('chassis', e.target.value)
                    }}
                  />
                  <FormDescription>
                    Ingrese el chasis del vehículo
                  </FormDescription>
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
                    form.getValues('type_of_vehicle') && hideInput && 'hidden',
                  )}
                >
                  <FormLabel>
                    Serie del vehículo <span style={{ color: 'red' }}>*</span>
                  </FormLabel>
                  <Input
                    {...field}
                    type="text"
                    className="input w-[250px]"
                    placeholder="Ingrese la serie"
                    onChange={e => {
                      form.setValue('serie', e.target.value)
                    }}
                  />
                  <FormDescription>
                    Ingrese la serie del vehículo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem
                  className={cn(
                    'flex flex-col min-w-[250px]',
                    !hideInput && 'hidden',
                  )}
                >
                  <FormLabel>
                    Dominio del vehículo <span style={{ color: 'red' }}>*</span>
                  </FormLabel>
                  <Input
                    {...field}
                    type="text"
                    className="input w-[250px]"
                    placeholder="Ingrese el dominio"
                    onChange={e => {
                      form.setValue('domain', e.target.value)
                    }}
                  />
                  <FormDescription>
                    Ingrese el dominio del vehículo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="intern_number"
              render={({ field }) => (
                <FormItem className="flex flex-col min-w-[250px]">
                  <FormLabel>
                    Número interno del vehículo{' '}
                    <span style={{ color: 'red' }}>*</span>
                  </FormLabel>
                  <Input
                    {...field}
                    type="text"
                    className="input w-[250px]"
                    placeholder="Ingrese el número interno"
                    onChange={e => {
                      form.setValue('intern_number', e.target.value)
                    }}
                  />
                  <FormDescription>
                    Ingrese el número interno del vehículo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="w-[300px] flex  gap-2">
              <FormField
                control={form.control}
                name="picture"
                render={({ field }) => (
                  <FormItem className="">
                    <FormControl>
                      <div className="flex lg:items-center flex-wrap md:flex-nowrap flex-col lg:flex-row gap-8">
                        <ImageHander
                          labelInput="Subir foto"
                          required={true}
                          desciption="Subir foto del vehículo"
                          handleImageChange={handleImageChange}
                          base64Image={base64Image} //nueva
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
          <Button type="submit">Registrar vehículo</Button>
        </form>
      </Form>
    </>
  )
}

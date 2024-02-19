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
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CaretSortIcon,
  CheckIcon,
  PlusCircledIcon,
} from '@radix-ui/react-icons'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { supabase } from '../../../../../../supabase/supabase'
import { Modal } from '../../../../../components/Modal'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../../../components/ui/form'
import { Input } from '../../../../../components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../../components/ui/select'
import { useToast } from '../../../../../components/ui/use-toast'
import { ExecOptionsWithStringEncoding } from 'child_process'
import { isUndefined } from 'util'
type VehicleType = {
  year: number
  engine: string
  chassis: string
  serie: string
  domain: string
  intern_number: string
  picture: string
  type_of_vehicle: number
  brand: string
  model: string
}
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
}

export default function page({ params }: { params: any }) {
  const { domain } = params
  //const employees = useLoggedUserStore(state => state.employees)

  const [vehicle, setVehicle] = useState<VehicleType | null>(null)
  const { toast } = useToast()
  const [data, setData] = useState<dataType>({
    tipe_of_vehicles: [],
    brand: [],
    models: [],
  })
  const [isRequired, setIsRequired] = useState(false)

  useEffect(() => {
    const fetchVehicleData = async () => {
      try {
        // Fetch vehicle data by domain from your API or database
        const { data: vehicleData, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('domain', domain)
          .single() // Assuming domain is unique

        if (error) {
          console.error('Error al obtener los datos del vehículo:', error)
        } else {
          setVehicle(vehicleData) // Set vehicle data to state
        }
      } catch (error) {
        console.error('Error al obtener los datos del vehículo:', error)
      }
    }

    fetchVehicleData() // Fetch vehicle data when the component mounts
  }, [domain])

  const vehicleSchema = z.object({
    brand: z
      .string({
        required_error: 'La marca es requerida',
      })
      .optional(), // Marca opcional
    model: z
      .string({
        required_error: 'El modelo es requerido',
      })
      .optional(), // Modelo opcional
    year: z
      .number({ required_error: 'El año es requerido' })
      .min(1900, {
        message: 'El año debe ser mayor a 1900',
      })
      .max(2023, {
        message: 'El año debe ser menor a 2023',
      })
      .optional(), // Año opcional
    engine: z
      .string()
      //   .string({
      //     required_error: 'El motor es requerido',
      //   })
      //   .min(2, {
      //     message: 'El motor debe tener al menos 2 caracteres.',
      //   })
      //   .max(15, { message: 'El motor debe tener menos de 15 caracteres.' }),
      .optional(), // Motor opcional
    type_of_vehicle: z
      .string({ required_error: 'El tipo es requerido' })
      .optional(), // Tipo de vehículo opcional
    chassis: z.string().optional(), // Chasis opcional
    domain: z.string().optional(), // Dominio opcional
    serie: z.string().optional(), // Serie opcional
    intern_number: z
      .string()
      //   .string({
      //     required_error: 'El número interno es requerido',
      //   })
      //   .min(2, {
      //     message: 'El número interno debe tener al menos 2 caracteres.',
      //   })
      //   .max(15, {
      //     message: 'El número interno debe tener menos de 15 caracteres.',
      //   })
      .optional(), // Número interno opcional
    picture: z
      .string()
      //   .string({ required_error: 'La imagen es requerida' })
      //   .min(10, {
      //     message: 'La imagen debe tener al menos 10 caracteres.',
      //   })
      .optional(), // Imagen opcional
  })

  const fetchData = async () => {
    let { data: types_of_vehicles } = await supabase
      .from('types_of_vehicles')
      .select('*')

    let { data: brand_vehicles } = await supabase
      .from('brand_vehicles')
      .select('*')

    setData({
      models: [],
      tipe_of_vehicles: types_of_vehicles as generic[],
      brand: (brand_vehicles || []).map(e => {
        return { label: e.name as string, id: e.id as string }
      }),
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

  //   const form = useForm<z.infer<typeof vehicleSchema>>({
  //     resolver: zodResolver(vehicleSchema),
  //     defaultValues: {
  //       year: undefined,
  //       engine: '',
  //       chassis: '',
  //       serie: '',
  //       domain: '',
  //       intern_number: '',
  //       picture: '',
  //     },
  //   })
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
    const {
      type_of_vehicle,
      brand,
      model,
      year,
      engine,
      chassis,
      serie,
      domain,
      intern_number,
      picture,
    } = values

    try {
      const { data: updateData } = await supabase
        .from('vehicles')
        .update({
          type_of_vehicle: data.tipe_of_vehicles.find(
            e => e.name === type_of_vehicle,
          )?.id,
          brand: data.brand.find(e => e.label === brand)?.id,
          model: data.models.find(e => e.name === model)?.id,
          year: values.year,
          engine: values.engine,
          chassis: values.chassis,
          serie: values.serie,
          domain: values.domain,
          intern_number: values.intern_number,
          picture: values.picture,
        })
        .eq('domain', vehicle?.domain)
        .select()

      if (updateData) {
        try {
          toast({
            title: 'Vehículo editado',
            description: 'El vehículo fue editado con éxito',
          })
        } catch (error) {}
      }
    } catch (error) {
      toast({
        title: 'Error al editar el vehículo',
      })
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
                  <FormLabel>Tipo de vehículo</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          disabled={false}
                          variant="outline"
                          role="combobox"
                          value={vehicle?.type_of_vehicle}
                          className={cn(
                            'w-[250px] justify-between',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {field.value
                            ? field.value
                            : 'Seleccionar tipo de vehículo'}
                          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[250px] p-0">
                      <Command>
                        <CommandInput
                          disabled={false}
                          placeholder="Buscar tipo de vehículo..."
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
                                if (option === 'Vehículos') {
                                  setIsRequired(true)
                                } else {
                                  setIsRequired(false)
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
                    Selecciona el tipo de vehículo
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
                  <FormLabel>Marca</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          disabled={false}
                          variant="outline"
                          role="combobox"
                          value={vehicle?.brand}
                          className={cn(
                            'w-[250px] justify-between',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {vehicle?.brand
                            ? vehicleBrands.find(
                                option => option.id === vehicle?.brand,
                              )?.label
                            : 'Seleccionar marca'}
                          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[250px] p-0">
                      <Command>
                        <CommandInput
                          disabled={false}
                          placeholder="Buscar marca..."
                          className="h-9"
                        />
                        <CommandEmpty className="py-2 px-2">
                          <Modal modal="addBrand" fetchData={fetchData}>
                            <Button
                              disabled={false}
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
                  <FormLabel>Modelo</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          disabled={false}
                          variant="outline"
                          role="combobox"
                          className={cn(
                            'w-[250px] justify-between',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {vehicle?.model
                            ? vehicleModels.find(
                                option => option.id === vehicle?.model,
                              )?.name || vehicle?.model
                            : 'Seleccionar modelo'}
                          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[250px] p-0">
                      <Command>
                        <CommandInput
                          disabled={false}
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
                              disabled={false}
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
                  <FormDescription>
                    Selecciona el modelo del vehículo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem className="flex flex-col min-w-[250px]">
                  <FormLabel>Año</FormLabel>
                  <Input
                    {...field}
                    type="number"
                    className="input w-[250px]"
                    placeholder="Año"
                    value={
                      field.value !== undefined
                        ? field.value
                        : vehicle?.year || ''
                    }
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
                    disabled={false}
                    type="text"
                    className="input w-[250px]"
                    placeholder="Ingrese el tipo de motor"
                    value={vehicle?.engine}
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
              name="chassis"
              render={({ field }) => (
                <FormItem className="flex flex-col min-w-[250px]">
                  <FormLabel>
                    Chasis del vehículo{' '}
                    {isRequired ? <span style={{ color: 'red' }}>*</span> : ''}
                  </FormLabel>
                  <Input
                    {...field}
                    disabled={false}
                    type="text"
                    className="input w-[250px]"
                    placeholder="Ingrese el chasis"
                    value={
                      field.value !== '' ? field.value : vehicle?.chassis || ''
                    }
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
                <FormItem className="flex flex-col min-w-[250px]">
                  <FormLabel>
                    Serie del vehículo{' '}
                    {isRequired ? '' : <span style={{ color: 'red' }}>*</span>}
                  </FormLabel>
                  <Select
                    disabled={false}
                    onValueChange={field.onChange}
                    defaultValue={vehicle?.serie}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={vehicle?.serie} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="serie 1">serie 1</SelectItem>
                      <SelectItem value="serie 2">serie 2</SelectItem>
                      <SelectItem value="serie 3">serie 3</SelectItem>
                    </SelectContent>
                  </Select>
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
                <FormItem className="flex flex-col min-w-[250px]">
                  <FormLabel>
                    Dominio del vehículo{' '}
                    {isRequired ? <span style={{ color: 'red' }}>*</span> : ''}
                  </FormLabel>
                  <Input
                    {...field}
                    disabled={false}
                    type="text"
                    className="input w-[250px]"
                    placeholder="Ingrese el dominio"
                    value={
                      field.value !== '' ? field.value : vehicle?.domain || ''
                    }
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
                  <FormLabel>Número interno del vehículo</FormLabel>
                  <Input
                    {...field}
                    disabled={false}
                    type="text"
                    className="input w-[250px]"
                    placeholder="Ingrese el número interno"
                    value={
                      field.value !== ''
                        ? field.value
                        : vehicle?.intern_number || ''
                    }
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
            <FormField
              control={form.control}
              name="picture"
              render={({ field }) => (
                <FormItem className="flex flex-col min-w-[250px]">
                  <FormLabel>Imagen del vehículo</FormLabel>
                  <Input
                    {...field}
                    disabled={false}
                    type="text"
                    className="input w-[250px]"
                    placeholder="Ingrese la URL de la imagen"
                    value={
                      field.value !== '' ? field.value : vehicle?.picture || ''
                    }
                    onChange={e => {
                      form.setValue('picture', e.target.value)
                    }}
                  />
                  <FormDescription>
                    Ingrese la URL de la imagen del vehículo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button disabled={false} type="submit">
            Editar vehículo
          </Button>
        </form>
      </Form>
    </>
  )
}

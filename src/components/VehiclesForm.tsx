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
import { vehicleSchema } from '@/zodSchemas/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CaretSortIcon,
  CheckIcon,
  PlusCircledIcon,
} from '@radix-ui/react-icons'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { supabase } from '../../supabase/supabase'
import { AddBrandModal } from './AddBrandModal'
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
}

export const VehiclesForm = () => {
  const { toast } = useToast()
  const [data, setData] = useState<dataType>({
    tipe_of_vehicles: [],
    brand: [],
    models: [],
  })
  useEffect(() => {
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

    fetchData()
  }, [])

  const vehicleBrands = data.brand
  const types = data.tipe_of_vehicles?.map(e => e.name)
  const vehicleModels = data.models

  const form = useForm<z.infer<typeof vehicleSchema>>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      year: '',
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

    console.log(model_vehicles)
    setData({
      ...data,
      models: model_vehicles as generic[],
    })
  }

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof vehicleSchema>) {
    const { type_of_vehicle, brand, model } = values

    console.log({
      ...values,
      type_of_vehicle: data.tipe_of_vehicles.find(
        e => e.name === type_of_vehicle,
      )?.id,
      brand: data.brand.find(e => e.label === brand)?.id,
      model: data.models.find(e => e.name === model)?.id,
    })

    try {
      const { data: insertData } = await supabase
        .from('vehicles')
        .insert([
          {
            ...values,
            type_of_vehicle: data.tipe_of_vehicles.find(
              e => e.name === type_of_vehicle,
            )?.id,
            brand: data.brand.find(e => e.label === brand)?.id,
            model: data.models.find(e => e.name === model)?.id,
          },
        ])
        .select()

      if (insertData) {
        try {
          toast({
            title: 'Vehículo registrado',
            description: 'El vehículo fue registrado con éxito',
          })
        } catch (error) {
          console.log('error', error)
        }
      }
    } catch (error) {
      console.log('error', error)
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
                <FormItem className="flex flex-col">
                  <FormLabel>Tipo de vehículo</FormLabel>
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
                            : 'Seleccionar tipo de vehículo'}
                          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[250px] p-0">
                      <Command>
                        <CommandInput
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
                <FormItem className="flex flex-col">
                  <FormLabel>Marca</FormLabel>
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
                          <AddBrandModal>
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
                          </AddBrandModal>
                        </CommandEmpty>
                        <CommandGroup>
                          {vehicleBrands.map(option => (
                            <CommandItem
                              value={option.label}
                              key={option.label}
                              onSelect={async () => {
                                form.setValue('brand', option.label)
                                const brand_id = data.brand.find(
                                  e => e.label === option.label,
                                )?.id
                                fetchModels(brand_id as string)

                                // setVehicleModels(() =>
                                //   models.filter(
                                //     e =>
                                //       e.name ===
                                //       option.label.toLocaleLowerCase(),
                                //   ),
                                // )
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
                <FormItem className="flex flex-col">
                  <FormLabel>Modelo</FormLabel>
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
                          <AddBrandModal>
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
                          </AddBrandModal>
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
                <FormItem className="flex flex-col">
                  <FormLabel>Año</FormLabel>
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
                <FormItem className="flex flex-col">
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
              name="chassis"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Chasis del vehículo</FormLabel>
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
                <FormItem className="flex flex-col">
                  <FormLabel>Serie del vehículo</FormLabel>
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
                <FormItem className="flex flex-col">
                  <FormLabel>Dominio del vehículo</FormLabel>
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
                <FormItem className="flex flex-col">
                  <FormLabel>Número interno del vehículo</FormLabel>
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
            <FormField
              control={form.control}
              name="picture"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Imagen del vehículo</FormLabel>
                  <Input
                    {...field}
                    type="text"
                    className="input w-[250px]"
                    placeholder="Ingrese la URL de la imagen"
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
          <Button type="submit">Registrar vehículo</Button>
        </form>
      </Form>
    </>
  )
}

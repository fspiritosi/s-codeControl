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
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
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

export const VehiclesForm = () => {
  const vehicleBrands = [
    { label: 'Toyota', value: 'toyota' },
    { label: 'Honda', value: 'honda' },
    { label: 'Ford', value: 'ford' },
    { label: 'Chevrolet', value: 'chevrolet' },
    { label: 'Nissan', value: 'nissan' },
    { label: 'Volkswagen', value: 'volkswagen' },
    { label: 'BMW', value: 'bmw' },
    { label: 'Mercedes-Benz', value: 'mercedes-benz' },
    { label: 'Audi', value: 'audi' },
  ]
  const models = [
    { label: 'Corolla', value: 'corolla', brand: 'toyota' },
    { label: 'Civic', value: 'civic', brand: 'honda' },
    { label: 'Fiesta', value: 'fiesta', brand: 'ford' },
    { label: 'Aveo', value: 'aveo', brand: 'chevrolet' },
    { label: 'Sentra', value: 'sentra', brand: 'nissan' },
    { label: 'Jetta', value: 'jetta', brand: 'volkswagen' },
    { label: 'Serie 3', value: 'serie-3', brand: 'bmw' },
    { label: 'Clase C', value: 'clase-c', brand: 'mercedes-benz' },
    { label: 'A4', value: 'a4', brand: 'audi' },
  ]
  const types = ['Vehiclulo de carga', 'Vehículo de pasajeros']
  const [vehicleModels, setVehicleModels] = useState(models)
  const form = useForm<z.infer<typeof vehicleSchema>>({
    resolver: zodResolver(vehicleSchema),
  })

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof vehicleSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values)
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
                        <CommandEmpty className="py-2 px-2">
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              'w-full justify-between',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            <PlusCircledIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </CommandEmpty>
                        <CommandGroup>
                          {types.map(option => (
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
                                option => option.value === field.value,
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
                              key={option.value}
                              onSelect={() => {
                                form.setValue('brand', option.value)
                                setVehicleModels(() =>
                                  models.filter(e => e.brand === option.value),
                                )
                              }}
                            >
                              {option.label}
                              <CheckIcon
                                className={cn(
                                  'ml-auto h-4 w-4',
                                  option.value === field.value
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
                                option => option.value === field.value,
                              )?.label
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
                        </CommandEmpty>
                        <CommandGroup>
                          {vehicleModels.map(option => (
                            <CommandItem
                              value={option.label}
                              key={option.value}
                              onSelect={() => {
                                form.setValue('model', option.value)
                              }}
                            >
                              {option.label}
                              <CheckIcon
                                className={cn(
                                  'ml-auto h-4 w-4',
                                  option.value === field.value
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
          </div>
          <Button type="submit">Registrar vehículo</Button>
        </form>
      </Form>
    </>
  )
}

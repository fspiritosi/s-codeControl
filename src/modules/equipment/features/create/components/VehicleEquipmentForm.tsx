'use client';

import { CheckboxDefaultValues } from '@/shared/components/common/CheckboxDefValues';
import { Button } from '@/shared/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/shared/components/ui/command';
import { Form } from '@/shared/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { ImageHander } from '@/shared/components/common/ImageHandler';
import { Modal } from '@/modules/equipment/features/create/components/Modal';
import AddTypeModal from '@/modules/equipment/features/create/components/AddTypeModal';
import { cn } from '@/shared/lib/utils';
import { CaretSortIcon, CheckIcon, PlusCircledIcon } from '@radix-ui/react-icons';
import { ChangeEvent } from 'react';
import { UseFormReturn } from 'react-hook-form';

interface VehicleEquipmentFormProps {
  form: UseFormReturn<any>;
  accion: string | null;
  readOnly: boolean;
  hideInput: boolean;
  setHideInput: (v: boolean) => void;
  type: string;
  setType: (v: string) => void;
  types: string[];
  vehicleModels: { name: string; id: string }[];
  contractorCompanies: any;
  vehicleType: any[];
  brand_vehicles: any[] | null;
  vehicle: any;
  role?: string;
  fetchModels: (brand_id: string) => Promise<void>;
  fetchData: () => Promise<void>;
  actualCompanyId?: string;
  onCreate: (values: any) => void;
  onUpdate: (values: any) => void;
  handleImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  base64Image: string;
}

export function VehicleEquipmentForm({
  form, accion, readOnly, hideInput, setHideInput, type, setType,
  types, vehicleModels, contractorCompanies, vehicleType, brand_vehicles,
  vehicle, role, fetchModels, fetchData, actualCompanyId,
  onCreate, onUpdate, handleImageChange, base64Image,
}: VehicleEquipmentFormProps) {
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(accion === 'edit' || accion === 'view' ? onUpdate : onCreate)}
        className="w-full"
      >
        <div className=" flex gap-[2vw] flex-wrap items-center">
          <FormField
            control={form.control}
            name="type_of_vehicle"
            render={({ field }) => (
              <FormItem className="flex flex-col min-w-[250px]">
                <FormLabel>Tipo de equipo <span style={{ color: 'red' }}>*</span></FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button disabled={readOnly} variant="outline" role="combobox" value={vehicle?.type_of_vehicle}
                        className={cn('w-[250px] justify-between', !field.value && 'text-muted-foreground')}>
                        {field.value ? field.value : 'Seleccionar tipo de equipo'}
                        <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[250px] p-0">
                    <Command>
                      <CommandInput disabled={readOnly} placeholder="Buscar tipo de equipo..." className="h-9" />
                      <CommandEmpty>No se encontro ningun resultado</CommandEmpty>
                      <CommandGroup>
                        {types?.map((option) => (
                          <CommandItem value={option} key={option} onSelect={() => {
                            form.setValue('type_of_vehicle', option);
                            if (option === 'Vehículos') setHideInput(true);
                            if (option === 'Otros') setHideInput(false);
                          }}>
                            {option}
                            <CheckIcon className={cn('ml-auto h-4 w-4', option === field.value ? 'opacity-100' : 'opacity-0')} />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormDescription>Selecciona el tipo de equipo</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem className="flex flex-col min-w-[250px]">
                <FormLabel>Marca <span style={{ color: 'red' }}>*</span></FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button disabled={readOnly} variant="outline" role="combobox" value={field.value}
                        className={cn('w-[250px] justify-between', !field.value && 'text-muted-foreground')}>
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
                          <Button disabled={readOnly} variant="outline" role="combobox"
                            className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}>
                            Agregar marca
                            <PlusCircledIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </Modal>
                      </CommandEmpty>
                      <CommandGroup>
                        {brand_vehicles?.map((option) => (
                          <CommandItem value={option.name || ''} key={option.name} onSelect={() => {
                            form.setValue('brand', option.name || '');
                            fetchModels(`${option.id}`);
                          }}>
                            {option.name}
                            <CheckIcon className={cn('ml-auto h-4 w-4', option.name === field.value ? 'opacity-100' : 'opacity-0')} />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormDescription>Selecciona la marca del Equipo</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem className="flex flex-col min-w-[250px]">
                <FormLabel>Modelo <span style={{ color: 'red' }}>*</span></FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button disabled={readOnly} variant="outline" role="combobox"
                        className={cn('w-[250px] justify-between', !field.value && 'text-muted-foreground')}>
                        {field.value || 'Seleccionar marca'}
                        <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[250px] p-0">
                    <Command>
                      <CommandInput disabled={readOnly} placeholder="Buscar modelo..." className="h-9" />
                      <CommandEmpty className="py-2 px-2">
                        <Modal modal="addModel" fetchModels={fetchModels} brandOptions={brand_vehicles}>
                          <Button disabled={readOnly} variant="outline" role="combobox"
                            className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}>
                            Agregar modelo
                            <PlusCircledIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </Modal>
                      </CommandEmpty>
                      <CommandGroup>
                        {vehicleModels?.map((option) => (
                          <CommandItem value={option.name} key={option.name} onSelect={() => form.setValue('model', option.name)}>
                            {option.name}
                            <CheckIcon className={cn('ml-auto h-4 w-4', option.name === field.value ? 'opacity-100' : 'opacity-0')} />
                          </CommandItem>
                        ))}
                        <Modal modal="addModel" fetchModels={fetchModels} brandOptions={brand_vehicles}>
                          <Button disabled={readOnly} variant="outline" role="combobox"
                            className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}>
                            Agregar modelo
                            <PlusCircledIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </Modal>
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormDescription>Selecciona el modelo del equipo</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField control={form.control} name="year" render={({ field }) => (
            <FormItem className="flex flex-col min-w-[250px]">
              <FormLabel>Ano <span style={{ color: 'red' }}>*</span></FormLabel>
              <Input {...field} disabled={readOnly} className="input w-[250px]" placeholder="Ano"
                value={field.value !== undefined ? field.value : vehicle?.year || ''} onChange={(e) => form.setValue('year', e.target.value)} />
              <FormDescription>Ingrese el ano del equipo</FormDescription>
              <FormMessage className="max-w-[250px]" />
            </FormItem>
          )} />
          <FormField control={form.control} name="kilometer" render={({ field }) => (
            <FormItem className={cn('flex flex-col min-w-[250px]', !hideInput && 'hidden')}>
              <FormLabel>Kilometraje</FormLabel>
              <Input {...field} disabled={readOnly} className="input w-[250px]" placeholder="Kilometraje" defaultValue={0}
                value={field.value !== undefined ? field.value : vehicle?.kilometer || ''}
                onChange={(e) => { const value = e.target.value; if (isNaN(Number(value)) || value === ' ') return; form.setValue('kilometer', value); }} />
              <FormDescription>Ingrese el kilometraje del equipo</FormDescription>
              <FormMessage className="max-w-[250px]" />
            </FormItem>
          )} />
          <FormField control={form.control} name="engine" render={({ field }) => (
            <FormItem className="flex flex-col min-w-[250px]">
              <FormLabel>Motor del equipo</FormLabel>
              <Input {...field} disabled={readOnly} className="input w-[250px]" placeholder="Ingrese el tipo de motor" value={field.value} />
              <FormDescription>Ingrese el tipo de motor del equipo</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="type" render={({ field }) => (
            <FormItem className={cn('flex flex-col min-w-[250px]', form.getValues('type_of_vehicle'))}>
              <FormLabel>Tipo <span style={{ color: 'red' }}>*</span></FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant="outline" role="combobox" disabled={readOnly} value={field.value}
                      className={cn('w-[250px] justify-between', !field.value && 'text-muted-foreground')}>
                      {field.value ? field.value : 'Seleccione tipo'}
                      <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0">
                  <Command>
                    <CommandInput onValueChange={(e) => setType(e)} placeholder="Buscar tipo..." className="h-9" />
                    <CommandEmpty className="p-1">
                      <AddTypeModal company_id={actualCompanyId ?? ''} value={type ?? ''} />
                    </CommandEmpty>
                    <CommandGroup>
                      {vehicleType?.map((option) => (
                        <CommandItem value={option.name} key={option.name} onSelect={() => form.setValue('type', option.name)}>
                          {option.name}
                          <CheckIcon className={cn('ml-auto h-4 w-4', option.name === field.value ? 'opacity-100' : 'opacity-0')} />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormDescription>Selecciona el tipo</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="chassis" render={({ field }) => (
            <FormItem className={cn('flex flex-col min-w-[250px]', !hideInput && 'hidden')}>
              <FormLabel>Chasis del equipo<span style={{ color: 'red' }}>*</span></FormLabel>
              <Input {...field} disabled={readOnly} type="text" className="input w-[250px]" placeholder="Ingrese el chasis"
                value={field.value !== '' ? field.value : vehicle?.chassis || ''} onChange={(e) => form.setValue('chassis', e.target.value)} />
              <FormDescription>Ingrese el chasis del equipo</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="serie" render={({ field }) => (
            <FormItem className={cn('flex flex-col min-w-[250px]', form.getValues('type_of_vehicle') && hideInput && 'hidden')}>
              <FormLabel>Serie del equipo<span style={{ color: 'red' }}>*</span></FormLabel>
              <Input {...field} type="text" disabled={readOnly} className="input w-[250px]" placeholder="Ingrese la serie"
                onChange={(e) => form.setValue('serie', e.target.value)} defaultValue={vehicle?.serie} />
              <FormDescription>Ingrese la serie del equipo</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="domain" render={({ field }) => (
            <FormItem className={cn('flex flex-col min-w-[250px]', !hideInput && 'hidden')}>
              <FormLabel>Dominio del equipo<span style={{ color: 'red' }}>*</span></FormLabel>
              <Input {...field} disabled={readOnly} type="text" className="input w-[250px]" placeholder="Ingrese el dominio"
                value={field.value !== '' ? field.value ?? '' : vehicle?.domain ?? ''} defaultValue={vehicle?.domain}
                onChange={(e) => form.setValue('domain', e.target.value)} />
              <FormDescription>Ingrese el dominio del equipo</FormDescription>
              <FormMessage className="w-[250px]" />
            </FormItem>
          )} />
          <FormField control={form.control} name="intern_number" render={({ field }) => (
            <FormItem className="flex flex-col min-w-[250px]">
              <FormLabel>Numero interno del equipo<span style={{ color: 'red' }}>*</span></FormLabel>
              <Input {...field} disabled={readOnly} type="text" className="input w-[250px]" placeholder="Ingrese el numero interno"
                value={field.value !== '' ? field.value : vehicle?.intern_number || ''} onChange={(e) => form.setValue('intern_number', e.target.value)} />
              <FormDescription>Ingrese el numero interno del equipo</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
          {role !== 'Invitado' && (
            <div className=" min-w-[250px] flex flex-col gap-2">
              <FormField control={form.control} name="allocated_to" render={({ field }) => (
                <>
                  <CheckboxDefaultValues disabled={readOnly} options={contractorCompanies} required={true} field={field} placeholder="Afectado a" />
                  <FormDescription>Selecciona a quien se le asignara el equipo</FormDescription>
                </>
              )} />
            </div>
          )}
          <div className="w-[300px] flex  gap-2">
            <FormField control={form.control} name="picture" render={({ field }) => (
              <FormItem className="">
                <FormControl>
                  <div className="flex lg:items-center flex-wrap  flex-col lg:flex-row gap-8">
                    <ImageHander labelInput="Subir foto" desciption="Subir foto del equipo" handleImageChange={handleImageChange}
                      base64Image={base64Image} disabled={readOnly} inputStyle={{ width: '400px', maxWidth: '300px' }} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>
        {!readOnly && (
          <Button type="submit" className="mt-5">
            {accion === 'edit' || accion === 'view' ? 'Guardar cambios' : 'Agregar equipo'}
          </Button>
        )}
      </form>
    </Form>
  );
}

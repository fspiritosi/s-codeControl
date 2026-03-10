'use client';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { defaultValues } from './NewDocumentType/constants';
import { useNewDocumentType } from './NewDocumentType/useNewDocumentType';
import { SpecialConditions } from './NewDocumentType/SpecialConditions';

// Re-export everything for backward compatibility
export { baseEmployeePropertiesConfig, baseVehiclePropertiesConfig, relationMeta } from './NewDocumentType/constants';
export { getVehiclePropertyValue, normalizeString, getEmployeePropertyValue } from './NewDocumentType/helpers';
export type { Condition } from './NewDocumentType/useNewDocumentType';

export default function NewDocumentType({
  codeControlClient,
  optionChildrenProp,
}: {
  codeControlClient?: boolean;
  optionChildrenProp: string;
}) {
  const {
    form, items, setItems, special, setSpecial, down, setDown, conditions,
    showEmployeePreview, setShowEmployeePreview, showVehiclePreview, setShowVehiclePreview,
    employeeCount, vehicleCount, previewEmployees, previewVehicles,
    optionsCache, loadingOptions, isCalculatingCount,
    employeePropertiesConfig, vehiclePropertiesConfig,
    selectOptions, onSubmit,
    getPropertyOptions, updateConditionValues, removeCondition,
    handlePropertySelect, addCondition,
  } = useNewDocumentType(codeControlClient, optionChildrenProp);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input {...field} className="w-full rounded-md border p-4 shadow" placeholder="Nombre del documento" />
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
                <Select
                  onValueChange={(value) => {
                    if (value === 'Empresa') {
                      setItems(
                        defaultValues.filter(
                          (e) => e.id === 'explired' || e.id === 'is_it_montlhy' || e.id === 'private'
                        )
                      );
                      if (down) {
                        setDown(false);
                        const name = form.getValues('name');
                        form.reset({ name });
                        form.setValue('applies', 'Empresa');
                      } else {
                        form.setValue('down_document', false);
                      }
                    } else {
                      setItems(defaultValues);
                    }
                    setShowEmployeePreview(false);
                    setShowVehiclePreview(false);
                    field.onChange(value);
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={selectOptions} />
                    </SelectTrigger>
                  </FormControl>
                  {optionChildrenProp === 'all' ? (
                    <SelectContent>
                      <SelectItem value="Persona">Persona</SelectItem>
                      <SelectItem value="Equipos">Equipos</SelectItem>
                      <SelectItem value="Empresa">Empresa</SelectItem>
                    </SelectContent>
                  ) : (
                    <SelectContent>
                      <SelectItem value={optionChildrenProp || 'All'}>{optionChildrenProp}</SelectItem>
                    </SelectContent>
                  )}
                </Select>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid md:grid-cols-2 grid-cols-1 gap-2 items-stretch justify-between">
          <TooltipProvider delayDuration={150}>
            {items?.map((item) => {
              if (!form.getValues('applies')) return;
              return (
                <FormField
                  key={crypto.randomUUID()}
                  control={form.control}
                  name={item.id as 'name' | 'applies' | 'multiresource' | 'mandatory' | 'explired' | 'special'}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex  space-x-2">
                        <FormControl>
                          <div className="flex flex-col space-x-2">
                            <div className="flex gap-3">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={field.value === true}
                                  disabled={
                                    down &&
                                    (item.id === 'is_it_montlhy' ||
                                      item.id === 'mandatory' ||
                                      item.id === 'explired' ||
                                      item.id === 'special' ||
                                      item.id === 'multiresource')
                                  }
                                  onCheckedChange={(value) => {
                                    if (value === false) {
                                      if (item.id === 'special') setSpecial(false);
                                      if (item.id === 'is_it_montlhy') form.setValue('explired', false);
                                      if (item.id === 'explired') form.setValue('is_it_montlhy', false);
                                      if (item.id === 'down_document') setDown(false);
                                    } else {
                                      if (item.id === 'special') setSpecial(true);
                                      if (item.id === 'is_it_montlhy') form.setValue('explired', value ? false : true);
                                      if (item.id === 'explired') form.setValue('is_it_montlhy', value ? false : true);
                                      if (item.id === 'down_document') {
                                        form.setValue('is_it_montlhy', false);
                                        form.setValue('mandatory', true);
                                        form.setValue('explired', false);
                                        form.setValue('special', false);
                                        form.setValue('multiresource', false);
                                        setDown(true);
                                      }
                                    }
                                    field.onChange(value ? true : false);
                                  }}
                                />
                              </div>
                            </div>
                            <FormMessage />
                          </div>
                        </FormControl>
                        <FormLabel className="flex gap-1 items-center mb-2">
                          {item.label}
                          <Tooltip>
                            <TooltipTrigger className="hover:cursor-help" type="button">
                              <InfoCircledIcon className="text-blue-500 size-5" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{item.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        </FormLabel>
                        <div className="space-y-1 leading-none"></div>
                      </div>
                    </FormItem>
                  )}
                />
              );
            })}
          </TooltipProvider>
        </div>
        {special && (
          <SpecialConditions
            form={form}
            conditions={conditions}
            employeePropertiesConfig={employeePropertiesConfig}
            vehiclePropertiesConfig={vehiclePropertiesConfig}
            optionsCache={optionsCache}
            loadingOptions={loadingOptions}
            isCalculatingCount={isCalculatingCount}
            employeeCount={employeeCount}
            vehicleCount={vehicleCount}
            previewEmployees={previewEmployees}
            previewVehicles={previewVehicles}
            showEmployeePreview={showEmployeePreview}
            setShowEmployeePreview={setShowEmployeePreview}
            showVehiclePreview={showVehiclePreview}
            setShowVehiclePreview={setShowVehiclePreview}
            getPropertyOptions={getPropertyOptions}
            updateConditionValues={updateConditionValues}
            removeCondition={removeCondition}
            handlePropertySelect={handlePropertySelect}
            addCondition={addCondition}
          />
        )}
        <Button type="submit" id="create_new_document" className={cn(codeControlClient ? 'hidden' : '')}>
          Crear tipo de documento
        </Button>
      </form>
    </Form>
  );
}

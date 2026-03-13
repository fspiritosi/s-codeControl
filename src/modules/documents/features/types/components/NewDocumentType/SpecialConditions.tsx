'use client';

import { Button } from '@/shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Card, CardContent } from '@/shared/components/ui/card';
import { MultiSelect } from '@/shared/components/ui/multi-select-combobox-condition';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/shared/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { PlusCircle, Truck, Users, X } from 'lucide-react';
import { Condition } from './useNewDocumentType';
import { getEmployeePropertyValue, getVehiclePropertyValue } from './helpers';

interface SpecialConditionsProps {
  form: any;
  conditions: Condition[];
  employeePropertiesConfig: any[];
  vehiclePropertiesConfig: any[];
  optionsCache: Record<string, any[]>;
  loadingOptions: Record<string, boolean>;
  isCalculatingCount: boolean;
  employeeCount: number | null;
  vehicleCount: number | null;
  previewEmployees: any[];
  previewVehicles: any[];
  showEmployeePreview: boolean;
  setShowEmployeePreview: (v: boolean) => void;
  showVehiclePreview: boolean;
  setShowVehiclePreview: (v: boolean) => void;
  getPropertyOptions: (propertyLabel: string, applies: 'Persona' | 'Equipos') => any[];
  updateConditionValues: (id: string, values: string[]) => void;
  removeCondition: (id: string) => void;
  handlePropertySelect: (conditionId: string, propertyLabel: string) => void;
  addCondition: () => void;
}

export function SpecialConditions({
  form, conditions, employeePropertiesConfig, vehiclePropertiesConfig,
  optionsCache, loadingOptions, isCalculatingCount,
  employeeCount, vehicleCount, previewEmployees, previewVehicles,
  showEmployeePreview, setShowEmployeePreview, showVehiclePreview, setShowVehiclePreview,
  getPropertyOptions, updateConditionValues, removeCondition,
  handlePropertySelect, addCondition,
}: SpecialConditionsProps) {
  return (
    <div className="mt-4 border rounded-lg p-4 ">
      <div className="flex justify-between flex-col items-center mb-4">
        <h3 className="font-semibold text-lg mb-2">Condiciones Especiales</h3>
        <div className="flex justify-around w-full">
          {form.getValues('applies') === 'Persona' && (
            <Button variant="outline" size="sm" type="button" onClick={() => setShowEmployeePreview(!showEmployeePreview)} disabled={isCalculatingCount}>
              {isCalculatingCount ? (
                <>
                  <div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Calculando...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-1" />
                  {showEmployeePreview ? 'Ocultar' : 'Ver'} Empleados ({employeeCount ?? 0})
                </>
              )}
            </Button>
          )}
          {form.getValues('applies') === 'Equipos' && (
            <Button variant="outline" size="sm" type="button" onClick={() => setShowVehiclePreview(!showVehiclePreview)} disabled={isCalculatingCount}>
              {isCalculatingCount ? (
                <>
                  <div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Calculando...
                </>
              ) : (
                <>
                  <Truck className="h-4 w-4 mr-1" />
                  {showVehiclePreview ? 'Ocultar' : 'Ver'} Equipos ({vehicleCount ?? 0})
                </>
              )}
            </Button>
          )}
          <Button variant="outline" size="sm" type="button" onClick={addCondition}>
            <PlusCircle className="h-4 w-4 mr-1" />
            Añadir Condición
          </Button>
        </div>
      </div>

      {conditions.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <p>Añade condiciones para especificar a qué empleados aplica este documento.</p>
          <Button variant="outline" className="mt-2" type="button" onClick={addCondition}>
            <PlusCircle className="h-4 w-4 mr-1" />
            Añadir Primera Condición
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {conditions.map((condition) => (
            <Card key={crypto.randomUUID()}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Select value={condition.property} onValueChange={(value) => handlePropertySelect(condition.id, value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Seleccionar propiedad" />
                    </SelectTrigger>
                    <SelectContent>
                      {form.getValues('applies') === 'Equipos'
                        ? vehiclePropertiesConfig.map((prop) => (
                            <SelectItem key={crypto.randomUUID()} value={prop.label}>{prop.label}</SelectItem>
                          ))
                        : employeePropertiesConfig.map((prop) => (
                            <SelectItem key={crypto.randomUUID()} value={prop.label}>{prop.label}</SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                  {condition.property && (() => {
                    const applies = form.getValues('applies');
                    const config = applies === 'Persona'
                      ? employeePropertiesConfig.find((p) => p.label === condition.property)
                      : vehiclePropertiesConfig.find((p) => p.label === condition.property);
                    const cacheKey = config ? `${applies}_${config.accessor_key}` : '';
                    const isLoading = loadingOptions[cacheKey] || false;
                    const cachedOptions = getPropertyOptions(condition.property, applies as 'Persona' | 'Equipos');
                    return (
                      <div className="flex items-center gap-2 flex-1">
                        {isLoading && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Cargando opciones...
                          </div>
                        )}
                        {!isLoading && (
                          <MultiSelect
                            options={cachedOptions}
                            selectedValues={condition.values}
                            setSelectedValues={(values: string[]) => updateConditionValues(condition.id, values)}
                            emptyMessage="No hay valores disponibles"
                            placeholder="Seleccionar valores"
                          />
                        )}
                      </div>
                    );
                  })()}
                  <Button size="icon" type="button" onClick={() => removeCondition(condition.id)} className="ml-auto">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {conditions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="text-sm font-medium">Resumen:</span>
              {conditions.map((condition) => {
                const applies = form.getValues('applies');
                return condition.property && condition.values.length ? (
                  <Badge key={crypto.randomUUID()} variant="outline" className="text-xs">
                    {condition.property}:{' '}
                    {(() => {
                      const config = applies === 'Persona'
                        ? employeePropertiesConfig.find((p) => p.label === condition.property)
                        : vehiclePropertiesConfig.find((p) => p.label === condition.property);
                      if (!config) return condition.values.join(', ');
                      if (['contractor_employee', 'province', 'hierarchical_position', 'category', 'guild', 'covenant', 'city', 'company_position', 'brand', 'model', 'type', 'types_of_vehicles', 'contractor_equipment', 'type_of_contract'].includes(config.accessor_key)) {
                        const cacheKey = `${applies}_${config.accessor_key}`;
                        const options = optionsCache[cacheKey] || [];
                        const displayNames = condition.values.map((value) => {
                          const option = options.find((opt) => opt.value === value);
                          return option ? option.label : value;
                        });
                        return displayNames.join(', ');
                      }
                      return condition.values.join(', ');
                    })()}
                  </Badge>
                ) : null;
              })}
            </div>
          )}
        </div>
      )}

      {(showEmployeePreview && form.getValues('applies') === 'Persona') ||
        (showVehiclePreview && form.getValues('applies') === 'Equipos') ? (
        <Accordion type="single" collapsible className="mt-4">
          <AccordionItem value="employees">
            <AccordionTrigger>
              {form.getValues('applies') === 'Persona'
                ? `Empleados que cumplen las condiciones (${employeeCount ?? 0})`
                : `Equipos que cumplen las condiciones (${vehicleCount ?? 0})`}
            </AccordionTrigger>
            <AccordionContent>
              <ScrollArea className="h-[200px] rounded-md border p-2">
                {(form.getValues('applies') === 'Persona' && (employeeCount ?? 0) === 0) ||
                  (form.getValues('applies') === 'Equipos' && (vehicleCount ?? 0) === 0) ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay {form.getValues('applies') === 'Persona' ? 'empleados' : 'equipos'} que cumplan todas las condiciones seleccionadas
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(form.getValues('applies') === 'Persona' ? previewEmployees : previewVehicles).map((employee: any) => (
                      <div key={crypto.randomUUID()} className="flex items-center gap-2 p-2 rounded-md">
                        {form.getValues('applies') === 'Persona' ? (
                          <Avatar>
                            <AvatarImage src={employee.picture || '/placeholder.svg'} alt={employee.firstname} />
                            <AvatarFallback>{employee.firstname.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <Avatar>
                            <AvatarImage src={employee.picture || '/placeholder.svg'} alt={employee.brand.name} />
                            <AvatarFallback>{employee.brand.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          <p className="font-medium">
                            {form.getValues('applies') === 'Persona'
                              ? `${employee.firstname} ${employee.lastname}`
                              : `${employee.brand.name} ${employee.model.name}`}
                          </p>
                          <div className="flex gap-1 flex-wrap">
                            {conditions
                              .filter((c) => c.property && c.values.length)
                              .flatMap((c) => {
                                const propertyConfig = form.getValues('applies') === 'Persona'
                                  ? employeePropertiesConfig.find((cfg) => cfg.label === c.property)
                                  : vehiclePropertiesConfig.find((cfg) => cfg.label === c.property);
                                if (!propertyConfig) return [];
                                const employeeValue = form.getValues('applies') === 'Persona'
                                  ? getEmployeePropertyValue(employee, propertyConfig.accessor_key)
                                  : getVehiclePropertyValue(employee, propertyConfig.accessor_key);
                                return c.values
                                  .filter((v) => employeeValue.toLowerCase() === v.toLowerCase())
                                  .map((v) => (
                                    <Badge key={crypto.randomUUID()} variant="outline" className="text-xs">
                                      {c.property}: {v}
                                    </Badge>
                                  ));
                              })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : null}
    </div>
  );
}

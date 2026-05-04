'use client';

import { Control, useFieldArray, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Trash2, Plus } from 'lucide-react';
import { createSupplierSchema } from '@/modules/suppliers/shared/validators';
import { SUPPLIER_ACCOUNT_TYPE_LABELS } from '@/modules/suppliers/shared/types';
import { parseCbuInput } from '@/modules/suppliers/shared/utils';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { Label } from '@/shared/components/ui/label';

type SupplierFormValues = z.infer<typeof createSupplierSchema>;

interface Props {
  control: Control<SupplierFormValues>;
}

const NO_DEFAULT_VALUE = '__none__';

export default function SupplierPaymentMethodsField({ control }: Props) {
  const { fields, append, remove, update } = useFieldArray<SupplierFormValues, 'payment_methods'>({
    control,
    name: 'payment_methods',
  });

  const watched = useWatch({ control, name: 'payment_methods' }) || [];

  const checkIndex = fields.findIndex((f, i) => watched[i]?.type === 'CHECK');
  const acceptsChecks = checkIndex >= 0;

  const defaultIndex = watched.findIndex((it) => it?.is_default);
  const defaultValue = defaultIndex >= 0 ? String(defaultIndex) : NO_DEFAULT_VALUE;

  const arrayError = (control._formState.errors as any)?.payment_methods?.message as string | undefined;
  const rootError = (control._formState.errors as any)?.payment_methods?.root?.message as string | undefined;

  const handleToggleCheck = (checked: boolean) => {
    if (checked && !acceptsChecks) {
      append({ type: 'CHECK', is_default: false });
    } else if (!checked && acceptsChecks) {
      remove(checkIndex);
    }
  };

  const handleAddAccount = () => {
    append({
      type: 'ACCOUNT',
      bank_name: '',
      account_holder: '',
      account_holder_tax_id: '',
      account_type: 'CHECKING',
      cbu: '',
      alias: '',
      currency: 'ARS',
      is_default: false,
    });
  };

  const handleDefaultChange = (value: string) => {
    const newDefaultIdx = value === NO_DEFAULT_VALUE ? -1 : Number(value);
    fields.forEach((f, i) => {
      const current = watched[i];
      if (!current) return;
      const shouldBeDefault = i === newDefaultIdx;
      if (current.is_default !== shouldBeDefault) {
        update(i, { ...current, is_default: shouldBeDefault } as any);
      }
    });
  };

  const accountIndices = fields
    .map((f, i) => ({ field: f, index: i }))
    .filter(({ index }) => watched[index]?.type === 'ACCOUNT');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Métodos de pago</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label className="text-base">Acepta cheques</Label>
            <p className="text-sm text-muted-foreground">
              Marcá esta opción si el proveedor recibe pagos con cheque.
            </p>
          </div>
          <Switch checked={acceptsChecks} onCheckedChange={handleToggleCheck} />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Cuentas bancarias</Label>
              <p className="text-sm text-muted-foreground">
                Cuentas para transferencias. Podés cargar varias.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleAddAccount}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar cuenta bancaria
            </Button>
          </div>

          {accountIndices.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No hay cuentas bancarias cargadas.</p>
          )}

          {accountIndices.map(({ field, index }) => (
            <div key={field.id} className="rounded-lg border p-4 space-y-4 relative">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Cuenta bancaria #{accountIndices.findIndex((a) => a.index === index) + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  aria-label="Eliminar cuenta"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={control}
                  name={`payment_methods.${index}.bank_name` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banco *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del banco" {...field} value={(field.value as string) ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`payment_methods.${index}.account_holder` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titular *</FormLabel>
                      <FormControl>
                        <Input placeholder="Razón social del titular" {...field} value={(field.value as string) ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`payment_methods.${index}.account_holder_tax_id` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CUIT del titular *</FormLabel>
                      <FormControl>
                        <Input placeholder="XX-XXXXXXXX-X" {...field} value={(field.value as string) ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`payment_methods.${index}.account_type` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de cuenta *</FormLabel>
                      <Select onValueChange={field.onChange} value={(field.value as string) ?? 'CHECKING'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(SUPPLIER_ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`payment_methods.${index}.cbu` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CBU *</FormLabel>
                      <FormControl>
                        <Input
                          inputMode="numeric"
                          maxLength={22}
                          placeholder="22 dígitos"
                          {...field}
                          value={(field.value as string) ?? ''}
                          onChange={(e) => field.onChange(parseCbuInput(e.target.value))}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">22 dígitos numéricos</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`payment_methods.${index}.alias` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alias</FormLabel>
                      <FormControl>
                        <Input placeholder="alias.opcional" {...field} value={(field.value as string) ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`payment_methods.${index}.currency` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moneda *</FormLabel>
                      <Select onValueChange={field.onChange} value={(field.value as string) ?? 'ARS'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ARS">ARS</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}
        </div>

        {fields.length > 0 && (
          <div className="space-y-3 rounded-lg border p-4">
            <div>
              <Label className="text-base">Método predeterminado</Label>
              <p className="text-sm text-muted-foreground">
                Se usará para precargar la Orden de Pago. Solo uno puede ser predeterminado.
              </p>
            </div>
            <RadioGroup value={defaultValue} onValueChange={handleDefaultChange} className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={NO_DEFAULT_VALUE} id="default-none" />
                <Label htmlFor="default-none" className="font-normal">
                  Sin predeterminado
                </Label>
              </div>
              {fields.map((field, index) => {
                const item = watched[index];
                if (!item) return null;
                let label = '';
                if (item.type === 'CHECK') {
                  label = 'Cheque';
                } else {
                  const bank = (item as any).bank_name || 'Cuenta sin banco';
                  const cbu = (item as any).cbu || '';
                  label = cbu ? `${bank} - ${cbu.slice(-4).padStart(4, '*')}` : bank;
                }
                return (
                  <div key={field.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={String(index)} id={`default-${index}`} />
                    <Label htmlFor={`default-${index}`} className="font-normal">
                      {label}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>
        )}

        {(arrayError || rootError) && (
          <p className="text-sm font-medium text-destructive">{arrayError || rootError}</p>
        )}
      </CardContent>
    </Card>
  );
}

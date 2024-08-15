'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormItem, FormLabel } from '@/components/ui/form';
import { Label } from './ui/label';
import { Select, SelectContent, SelectTrigger } from './ui/select';

type generic = {
  id: number;
  name: string;
  created_at: string;
};

type Props = {
  options: string[] | any[] | undefined;
  field: any;
  placeholder: string;
  defaultValues?: string[];
  disabled?: boolean;
  required?: boolean;
};

export function CheckboxDefaultValues({ options, field, placeholder, disabled, required }: Props) {
  function SelectValue() {
    // Obtén el valor actual del select de alguna manera
    const value = `${field?.value?.length || 0} elementos seleccionados`;

    // Si no hay ningún valor seleccionado, muestra el placeholder
    if (!value) {
      return <div>{placeholder}</div>;
    }

    // Si hay un valor seleccionado, muestra el valor
    return <div>{value}</div>;
  }

  return (
    <>
      <Label className="ml-2" htmlFor="Allocated_to">
        Afectado A
      </Label>
      <Select onValueChange={field?.onChange} defaultValue={field?.value?.[0]}>
        <FormControl>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {options?.map((item: string | generic) => {
            if (typeof item === 'string') return null; // Skip string items
            return (
              <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    disabled={disabled}
                    checked={field?.value?.includes(String(item.id))}
                    onCheckedChange={(checked) => {
                      const updatedValue = field?.value || []; // Initialize as an empty array if field.value is undefined
                      return checked
                        ? field?.onChange([...updatedValue, item.id])
                        : field?.onChange(updatedValue?.filter((value: any) => value !== String(item.id)));
                    }}
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal">{item.name}</FormLabel>
              </FormItem>
            );
          })}
        </SelectContent>
      </Select>
    </>
  );
}

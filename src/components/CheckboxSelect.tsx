'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormItem, FormLabel } from '@/components/ui/form';
import { Label } from './ui/label';
import { Select, SelectContent, SelectTrigger, SelectValue } from './ui/select';

const items = [
  {
    id: 'recents',
    label: 'Recents',
  },
  {
    id: 'home',
    label: 'Home',
  },
  {
    id: 'applications',
    label: 'Applications',
  },
  {
    id: 'desktop',
    label: 'Desktop',
  },
  {
    id: 'downloads',
    label: 'Downloads',
  },
  {
    id: 'documents',
    label: 'Documents',
  },
] as const;

type generic = {
  id: number;
  name: string;
  created_at: string;
};

type Props = {
  options: string[] | generic[] | undefined;
  field: any;
  placeholder: string;
};
export function CheckboxReactHookFormMultiple({ options, field }: Props) {
  //   const form = useForm<z.infer<typeof FormSchema>>({
  //     resolver: zodResolver(FormSchema),
  //     defaultValues: {
  //       items: [],
  //     },
  //   })

  return (
    <>
      <Label className="ml-2" htmlFor="Allocated_to">
        Afectado A
      </Label>
      <Select onValueChange={field?.onChange} defaultValue={field?.value || ''}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder={`${field.value?.length || 0} elementos seleccionados`} />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {options?.map((item: string | generic) => {
            if (typeof item === 'string') return null; // Skip string items
            return (
              <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value?.includes(String(item.id))}
                    onCheckedChange={(checked) => {
                      const updatedValue = field.value || []; // Initialize as an empty array if field.value is undefined
                      return checked
                        ? field.onChange([...updatedValue, item.id])
                        : field.onChange(updatedValue?.filter((value: any) => value !== String(item.id)));
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

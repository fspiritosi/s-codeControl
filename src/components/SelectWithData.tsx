import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ControllerRenderProps } from 'react-hook-form';
import { Checkbox } from './ui/checkbox';
import { FormControl } from './ui/form';
import { Label } from './ui/label';

type Province = {
  id: number;
  name: string;
};
type multiple = {
  id: string;
  name: string;
};
type Props = {
  label?: string;
  placeholder: string;
  options: string[] | undefined | Province[] | multiple[] | multiple | any;
  onChange: (value: string) => void;
  value: string;
  field: ControllerRenderProps;
  isMultiple?: boolean;
  handleProvinceChange?: (value: string) => void;
  editing?: boolean;
  selectedValues?: string[];
  disabled?: boolean;
};

export const SelectWithData = ({
  label,
  disabled,
  placeholder,
  options,
  onChange,
  value,
  field,
  editing,
  isMultiple,
  handleProvinceChange,
  selectedValues,
}: Props) => {
  let dataToRender = options;

  if ((options?.[0] as Province)?.name) {
    dataToRender = (options as Province[])?.map((option: Province) => option.name.trim());
  }

  if (isMultiple) {
    return (
      <>
        <Label className="ml-2" htmlFor={label}>
          {label}
        </Label>
        <Select onValueChange={field?.onChange} defaultValue={field?.value || ''}>
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {options?.map((option: multiple) => {
              return (
                <div key={option.id} className="flex items-center space-x-2 space-y-2">
                  <Checkbox
                    id={option.id}
                    checked={field.value?.includes(option.id)}
                    disabled={disabled}
                    onCheckedChange={(checked) => {
                      return checked
                        ? field.onChange([...field.value, option.id])
                        : field.onChange(field.value?.filter((value: any) => value !== option.id));
                    }}
                  />
                  <label htmlFor="terms" className={`text-sm font-medium leading-none`}>
                    {option.name}
                  </label>
                </div>
              );
            })}
          </SelectContent>
        </Select>
      </>
    );
  }
  return (
    <>
      <Label className="ml-2" htmlFor={label}>
        {label}
      </Label>
      <Select
        onValueChange={(e) => {
          if (handleProvinceChange && typeof handleProvinceChange === 'function') {
            handleProvinceChange(e);
          }
          field?.onChange(e);
        }}
        defaultValue={value}
      >
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder={value || field.value || placeholder} />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {dataToRender?.map((option: Province, index: number) => (
            <SelectItem disabled={disabled} key={crypto.randomUUID()} value={String(option)}>
              {String(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
};

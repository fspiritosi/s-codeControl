import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { useEffect, useState } from 'react';

interface Equipment {
  id: string;
  name?: string; // Opcional si puedes tener solo `intern_number`
  intern_number?: string; // Opcional si puedes tener solo `name`
}

interface MultiSelectProps {
  multiEmp: Equipment[]; // Usa la interfaz Equipment aquí
  placeholder?: string;
  disabled?: boolean;
  selectedItems: string[]; // Añadir la propiedad selectedItems
  onChange: (selectedItems: string[]) => void;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  multiEmp,
  placeholder = 'Seleccione empleados',
  disabled = false,
  selectedItems, // Añadir la propiedad selectedItems
  onChange,
}) => {
  const [internalSelectedItems, setInternalSelectedItems] = useState<string[]>(selectedItems);
  //console.log(internalSelectedItems);
  useEffect(() => {
    // Resetear internalSelectedItems cuando multiEmp cambie
    setInternalSelectedItems([]);
  }, [selectedItems]);

  useEffect(() => {
    // Actualizar internalSelectedItems cuando selectedItems cambie
    setInternalSelectedItems(selectedItems);
  }, [selectedItems]);

  const handleSelectChange = (value: string) => {
    setInternalSelectedItems((prev = []) => {
      const newSelectedItems = prev?.includes(value) ? prev.filter((item) => item !== value) : [...prev, value];
      onChange(newSelectedItems); // Llama a la función onChange con las nuevas selecciones
      return newSelectedItems;
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild className="w-full max-w-xs">
        <Button variant={'outline'} disabled={disabled} className="flex justify-between items-center w-full">
          <span>
            {internalSelectedItems?.length > 0 ? `${internalSelectedItems.length} ${placeholder}` : placeholder}
          </span>
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Command>
          <CommandInput placeholder="Buscar..." />
          <CommandList>
            {Array.isArray(multiEmp) ? (
              multiEmp.map((item) => (
                <CommandItem key={item.id} onSelect={() => handleSelectChange(item.id)}>
                  {item.name || item.intern_number}
                  <CheckIcon
                    className={cn(
                      'ml-auto h-4 w-4',
                      internalSelectedItems?.includes(item.id) ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))
            ) : (
              <CommandEmpty>No items found</CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default MultiSelect;

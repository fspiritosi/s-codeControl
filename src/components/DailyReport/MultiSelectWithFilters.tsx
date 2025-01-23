import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox'; // Asegúrate de importar el Checkbox de Shadcn
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CaretSortIcon } from '@radix-ui/react-icons';
import { useState } from 'react';

interface Item {
  id: string;
  name?: string;
  intern_number?: string;
}

interface MultiSelectWithFiltersProps {
  items: Item[];
  selectedItems: string[];
  onChange: (selectedItems: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const MultiSelectWithFilters: React.FC<MultiSelectWithFiltersProps> = ({
  items,
  selectedItems,
  onChange,
  placeholder = '',
  disabled = false,
}) => {
  const [internalSelectedItems, setInternalSelectedItems] = useState<string[]>([]);

  const handleSelectChange = (value: string) => {
    const newSelectedItems = internalSelectedItems.includes(value)
      ? internalSelectedItems.filter((item) => item !== value)
      : [...internalSelectedItems, value];

    setInternalSelectedItems(newSelectedItems);
    onChange(newSelectedItems); // Pasar los cambios al padre
  };

  const handleClearFilters = () => {
    setInternalSelectedItems([]);
    onChange([]); // Pasar los cambios al padre
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={'outline'} disabled={disabled} className="flex justify-between items-center h-6">
          <span>
            {internalSelectedItems.length > 0 ? `${internalSelectedItems.length} ${placeholder}` : placeholder}
          </span>
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Command>
          <CommandInput placeholder="Buscar..." />
          <CommandList>
            {Array.isArray(items) ? (
              items.map((item) => (
                <CommandItem key={item?.id} onSelect={() => handleSelectChange(item.id)} className="flex items-center">
                  <Checkbox
                    checked={internalSelectedItems.includes(item?.id)}
                    onCheckedChange={() => handleSelectChange(item?.id)}
                    className="mr-2"
                  />
                  {item?.name || item?.intern_number}
                </CommandItem>
              ))
            ) : (
              <CommandEmpty>No items found</CommandEmpty>
            )}
          </CommandList>
        </Command>
        <div className="p-2">
          <Button variant="outline" onClick={handleClearFilters} className="w-full">
            Limpiar filtros
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

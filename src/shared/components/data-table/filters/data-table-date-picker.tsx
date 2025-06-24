import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from '@radix-ui/react-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { X } from 'lucide-react';

interface DataTableDatePickerProps {
  date: Date | null;
  setDate: (date: Date | null) => void;
  label: string;
  disabled?: boolean;
  className?: string;
  clearFilter?: () => void;
}

export function DataTableDatePicker({
  date,
  setDate,
  label,
  disabled = false,
  className = '',
  clearFilter,
}: DataTableDatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="relative w-full">
          <Button
            variant={'outline'}
            size={'sm'}
            className={cn(
              'w-[200px] justify-start text-left font-normal border-dashed pr-8', // espacio para la X
              !date && '',
              className
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, 'PPP', { locale: es }) : <span>{label}</span>}
          </Button>
          {date && (
            <X
              className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setDate(null);
                if (typeof clearFilter === 'function') clearFilter();
              }}
            />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date ?? undefined}
          onSelect={(selected) => setDate(selected ?? null)}
          initialFocus
          locale={es}
        />
      </PopoverContent>
    </Popover>
  );
}

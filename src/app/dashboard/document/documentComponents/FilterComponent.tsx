// FilterHeader.tsx
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableHead } from '@/components/ui/table';

interface FilterHeaderProps {
  filters: {
    name: string;
    multiresource: string;
    special: string;
    monthly: string;
    expired: string;
    mandatory: string;
    private: string;
  };
  docOptions: {
    multiresource: string[];
    special: string[];
    monthly: string[];
    expired: string[];
    mandatory: string[];
    private: string[];
  };
  onFilterChange: (filterName: string, value: string) => void;
}

const FilterHeader = ({ filters, docOptions, onFilterChange }: FilterHeaderProps) => (
  <>
    <TableHead className="pl-0">
      <Input
        type="text"
        value={filters.name}
        onChange={(e) => onFilterChange('name', e.target.value)}
        placeholder="Nombre del Documento"
        className="max-w-[400px]"
      />
    </TableHead>
    <TableHead className="w-[100px] text-center" align="center">
      <Select
        key={filters.multiresource}
        value={filters.multiresource}
        onValueChange={(value) => onFilterChange('multiresource', value)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Multirecurso" />
        </SelectTrigger>
        <SelectContent>
          {docOptions.multiresource.map((option, index) => (
            <SelectItem key={crypto.randomUUID()} value={option}>
              {option}
            </SelectItem>
          ))}
          {filters.multiresource && <SelectItem value="clear">Limpiar filtro</SelectItem>}
        </SelectContent>
      </Select>
    </TableHead>
    <TableHead className="w-[130px] text-center" align="center">
      <Select key={filters.special} value={filters.special} onValueChange={(value) => onFilterChange('special', value)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Es especial?" />
        </SelectTrigger>
        <SelectContent>
          {docOptions.special.map((option, index) => (
            <SelectItem key={crypto.randomUUID()} value={option}>
              {option}
            </SelectItem>
          ))}
          {filters.special && <SelectItem value="clear">Limpiar filtro</SelectItem>}
        </SelectContent>
      </Select>
    </TableHead>
    <TableHead className="w-[130px] text-center" align="center">
      <Select value={filters.monthly} onValueChange={(value) => onFilterChange('monthly', value)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Es mensual?" />
        </SelectTrigger>
        <SelectContent>
          {docOptions.monthly.map((option, index) => (
            <SelectItem key={crypto.randomUUID()} value={option}>
              {option}
            </SelectItem>
          ))}
          {filters.monthly && <SelectItem value="clear">Limpiar filtro</SelectItem>}
        </SelectContent>
      </Select>
    </TableHead>
    <TableHead className="w-[100px] text-center" align="center">
      <Select value={filters.expired} onValueChange={(value) => onFilterChange('expired', value)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Vence" />
        </SelectTrigger>
        <SelectContent>
          {docOptions.expired.map((option, index) => (
            <SelectItem key={crypto.randomUUID()} value={option}>
              {option}
            </SelectItem>
          ))}
          {filters.expired && <SelectItem value="clear">Limpiar filtro</SelectItem>}
        </SelectContent>
      </Select>
    </TableHead>
    <TableHead className="w-[100px] text-center" align="center">
      <Select value={filters.mandatory} onValueChange={(value) => onFilterChange('mandatory', value)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Mandatorio" />
        </SelectTrigger>
        <SelectContent>
          {docOptions.mandatory.map((option, index) => (
            <SelectItem key={crypto.randomUUID()} value={option}>
              {option}
            </SelectItem>
          ))}
          {filters.mandatory && <SelectItem value="clear">Limpiar filtro</SelectItem>}
        </SelectContent>
      </Select>
    </TableHead>
    <TableHead className="w-[100px] text-center" align="center">
      <Select value={filters.private} onValueChange={(value) => onFilterChange('private', value)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Privado" />
        </SelectTrigger>
        <SelectContent>
          {docOptions.private.map((option, index) => (
            <SelectItem key={crypto.randomUUID()} value={option}>
              {option}
            </SelectItem>
          ))}
          {filters.private && <SelectItem value="clear">Limpiar filtro</SelectItem>}
        </SelectContent>
      </Select>
    </TableHead>
    <TableHead className="w-[100px] text-center" align="center">
      Editar
    </TableHead>
  </>
);

export default FilterHeader;

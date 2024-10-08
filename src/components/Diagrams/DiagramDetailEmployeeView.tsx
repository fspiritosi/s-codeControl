'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarIcon } from '@radix-ui/react-icons';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import InfoComponent from '../InfoComponent';

type diagram = {
  id: string;
  created_at: string;
  employee_id: string;
  diagram_type: {
    id: string;
    name: string;
    color: string;
    company_id: string;
    created_at: string;
    short_description: string;
  };
  day: number;
  month: number;
  year: number;
};

type DiagramDetailEmployeeViewProps = {
  fecha: string;
  description: string;
  state: string;
  id: string;
};

export function DiagramDetailEmployeeView({ diagrams }: { diagrams: diagram[] | [] }) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 30),
  });
  const [diagramType, setDiagramType] = useState<{ id: string; name: string } | undefined>(undefined);

  //saca todos los tipos de diagramas que hay en la lista de diagramas del empleado en particular
  function getUniqueDiagramTypes(diagrams: diagram[]) {
    const uniqueTypes: { id: string; name: string }[] = [];
    diagrams.forEach((diagram) => {
      const { id, name } = diagram.diagram_type;
      if (!uniqueTypes.some((type) => type.id === id)) {
        uniqueTypes.push({ id, name });
      }
    });
    return uniqueTypes;
  }

  const diagramTypes = getUniqueDiagramTypes(diagrams);

  function filterDiagramsByDate(diagrams: diagram[], date: DateRange | undefined) {
    if (!date) {
      return diagrams;
    }

    return diagrams.filter((diagram) => {
      const diagramDate = new Date(diagram.year, diagram.month - 1, diagram.day);
      return diagramDate >= (date.from ?? new Date(0)) && diagramDate <= (date.to ?? new Date());
    });
  }

  function filterDiagramsByType(diagrams: diagram[], diagramType: { id: string; name: string } | undefined) {
    if (!diagramType) {
      return diagrams;
    }

    return diagrams.filter((diagram) => diagram.diagram_type.id === diagramType.id);
  }

  const diagramsFilteredByDate = filterDiagramsByDate(diagrams, date);
  const diagramsFilteredByType = filterDiagramsByType(diagramsFilteredByDate, diagramType);

  function handleDiagramTypeChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setDiagramType(event.target.value.length ? diagramTypes.find((type) => type.id === event.target.value) : undefined);
  }

  return (
    <>
      <div className="px-4 my-2 flex gap-8">
        <div className={cn('grid gap-2')}>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={'outline'}
                className={cn('w-[300px] justify-start text-left font-normal', !date && 'text-muted-foreground')}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, 'dd/MM/yyyyy', { locale: es })} -{' '}
                      {format(date.to, 'dd/MM/yyyyy', { locale: es })}
                    </>
                  ) : (
                    format(date.from, 'dd/MM/yyyyy', { locale: es })
                  )
                ) : (
                  <span>Seleccionar fecha</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          {/* <span className="text-[0.8rem] text-muted-foreground"></span> */}
          <InfoComponent size='sm' message={'La selección maxima es de 30 días'} />
        </div>
        <select value={diagramType?.id} onChange={handleDiagramTypeChange} className="mb-4">
          <option value="">Todos los tipos de diagrama</option>
          {diagramTypes.map((diagram) => (
            <option key={diagram.id} value={diagram.id}>
              {diagram.name}
            </option>
          ))}
        </select>{' '}
      </div>
      <div className="px-4">
        <Table>
          <TableHeader>
            <TableHead>Fecha</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Estado</TableHead>
          </TableHeader>
          <TableBody>
            {diagramsFilteredByType.map((diagram) => (
              <TableRow key={diagram.id} style={{ backgroundColor: diagram?.diagram_type.color }}>
                <TableCell>
                  {diagram.day}/{diagram.month}/{diagram.year}
                </TableCell>
                <TableCell>{diagram.diagram_type.short_description}</TableCell>
                <TableCell>{diagram.diagram_type.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

/* TODO

1- Filtrar por fecha 👌 
2- Filtrar por tipo de diagrama 👌 
  2.1 - Crear un select con los tipos de diagramas 👌 
  2.2 - Traer los tipos de diagramas desde la API (no fue necesario, se filtra por las opciones que tenga el usuario) 👌
  2.3 - Filtrar los diagramas por el tipo seleccionado 👌 
3- Agregar un botón para descargar los diagramas
4- Agregar un boton para editar diagramas

*/

{
  /* <select value={diagramType?.id} onChange={handleDiagramTypeChange} className="mb-4">
          <option value="">Todos los tipos de diagrama</option>
          {diagramTypes.map((diagram) => (
            <option key={diagram.id} value={diagram.id}>
              {diagram.name}
            </option>
          ))}
        </select> */
}

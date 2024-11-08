'use client';

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
import { DiagramDetailTable } from './table/DiagramDetailTable';
import { DetailDiagramColums } from './table/diagram-detail-colums';

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

  return (
    <>
      <div className="px-4 my-2 flex gap-8">
        <div className={cn('gap-2 flex')}>
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
          <InfoComponent message="La selección maxima es de 30 días" size="sm" />
        </div>
      </div>
      <div className="px-4">
        <DiagramDetailTable
          columns={DetailDiagramColums}
          data={diagramsFilteredByType
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map((diagram) => ({
              ...diagram,
              ...diagram.diagram_type,
              diagram_type_id: diagram.diagram_type.id,
              diagram_type_created_at: diagram.diagram_type.created_at,
              created_at: `${diagram.year}-${diagram.month}-${diagram.day}`,
            }))}
        />
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

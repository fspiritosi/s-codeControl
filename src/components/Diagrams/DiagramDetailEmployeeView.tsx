'use client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { CalendarIcon } from '@radix-ui/react-icons';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import InfoComponent from '../InfoComponent';
import { Calendar } from '../ui/calendar';
import DiagramFormUpdated from './DiagramFormUpdated';
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

export function DiagramDetailEmployeeView({
  diagrams,
  diagrams_types,
  activeEmploees,
  historyData,
  role,
}: {
  historyData: any;
  diagrams: diagram[] | [];
  diagrams_types: any;
  activeEmploees: any;
  role: string | null;
}) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 30),
  });
  const [diagramType, setDiagramType] = useState<{ id: string; name: string } | undefined>(undefined);

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
      <Tabs defaultValue="Diagramas">
        <TabsList>
          <TabsTrigger value="Diagramas">Diagramas</TabsTrigger>
          {role !== 'Invitado' && <TabsTrigger value="NuevoDiagrama">Nuevo Diagrama</TabsTrigger>}
        </TabsList>
        <TabsContent value="Diagramas">
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
                        {format(date.from, 'dd/MM/yyyy', { locale: es })} -{' '}
                        {format(date.to, 'dd/MM/yyyy', { locale: es })}
                      </>
                    ) : (
                      format(date.from, 'dd/MM/yyyy', { locale: es })
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
            <InfoComponent message="La selección máxima es de 30 días" size="sm" />
          </div>
          <div className="gap-4 pr-7 ">
            <div className=" mt-3">
              <div className=" w-full">
                <DiagramDetailTable
                  columns={DetailDiagramColums}
                  historyData={historyData}
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
            </div>
            {/* <div className="col-span-5 mt-3">
              <Card className="w-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div className="flex items-center space-x-2">
                    <CardTitle className="text-xl font-bold">Historial</CardTitle>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger type="button">
                          <History className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Historial de cambios en horarios</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select defaultValue="10" onValueChange={handleItemsPerPageChange}>
                    <SelectTrigger className="w-[70px]">
                      <SelectValue placeholder="20" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Estado Anterior</TableHead>
                        <TableHead>Modificado Por</TableHead>
                        <TableHead>Fecha Modificación</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map((row: any, index: any) => (
                        <TableRow
                          key={`${row.date}-${index}`}
                          className={
                            row.description === 'MD'
                              ? 'bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/20 dark:hover:bg-pink-950/30'
                              : ''
                          }
                        >
                          <TableCell className="font-medium">{row.date}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                row.description === 'MD'
                                  ? 'border-pink-500 text-pink-700 dark:text-pink-400'
                                  : 'border-blue-500 text-blue-700 dark:text-blue-400'
                              }
                            >
                              {row.description}
                            </Badge>
                          </TableCell>
                          <TableCell>{row.status}</TableCell>
                          <TableCell>
                            {row.previousStatus !== 'Nuevo' ? (
                              <span className="text-muted-foreground">{row.previousStatus}</span>
                            ) : (
                              <Badge variant="secondary">Nuevo</Badge>
                            )}
                          </TableCell>
                          <TableCell>{row.modifiedBy}</TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{row.modifiedAt}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between space-x-2 py-4">
                    <div className="text-sm text-muted-foreground">
                      Página {currentPage} de {totalPages}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        type="button"
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        type="button"
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div> */}
          </div>
        </TabsContent>
        <TabsContent value="NuevoDiagrama">
          <DiagramFormUpdated
            employees={activeEmploees}
            diagrams={diagrams as EmployeeDiagramWithDiagramType[]}
            diagrams_types={diagrams_types}
            defaultId={activeEmploees[0].id}
          />
        </TabsContent>
      </Tabs>
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

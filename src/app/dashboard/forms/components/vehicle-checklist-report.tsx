'use client';

import { format } from 'date-fns';
import { CalendarIcon, CheckCircle2, Clock, FileDown, Truck } from 'lucide-react';
import moment from 'moment';
import 'moment/locale/es';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { es } from 'date-fns/locale';
import BtnXlsDownload from '@/components/BtnXlsDownload';

interface VehicleChecklistReportProps {
  onClose: () => void;
  checklists: CheckListWithAnswer[];
  vehicles: VehicleWithBrand[];
}

export function VehicleChecklistReport({ checklists, vehicles }: VehicleChecklistReportProps) {
  moment.locale('es'); // Configurar español globalmente
  const [selectedForm, setSelectedForm] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [filterOption, setFilterOption] = useState<string>('all');
  const [showResults, setShowResults] = useState(false);

  const handleGenerateReport = () => {
    setShowResults(true);
  };

  const handleBackToOptions = () => {
    setShowResults(false);
    setSelectedForm('');
    setDateRange({ from: undefined, to: undefined });
    setFilterOption('all');
  };

  // Función para obtener la frecuencia del formulario seleccionado
  const getFormFrequency = (formId: string): 'daily' | 'weekly' => {
    const selectedChecklist = checklists.find((checklist) => (checklist?.form as { id: string })?.id === formId);
    return ((selectedChecklist?.form as any)?.frequency as string) === 'Semanal' ? 'weekly' : 'daily';
  };

  // Función para generar fechas en el rango según la frecuencia
  const generateDatesInRange = (startDate: Date, endDate: Date, frequency: 'daily' | 'weekly') => {
    const dates: Date[] = [];
    let currentDate = moment(startDate).startOf(frequency === 'weekly' ? 'isoWeek' : 'day');
    const lastDate = moment(endDate).endOf(frequency === 'weekly' ? 'isoWeek' : 'day');

    while (currentDate <= lastDate) {
      dates.push(currentDate.toDate());
      currentDate = frequency === 'daily' ? currentDate.add(1, 'days') : currentDate.add(1, 'weeks');
    }
    return dates;
  };

  // Función para obtener el conductor de una respuesta
  const getDriverFromResponse = (response: CheckListWithAnswer) => {
    return response.form_answers.find(answer => 
      (answer.answer as { chofer?: string })?.chofer
    )?.answer as { chofer: string } | undefined;
  };

  // Función para verificar si un vehículo tiene respuesta en una fecha o semana específica
  const hasResponseInPeriod = (
    vehicle: VehicleWithBrand,
    date: Date,
    responses: CheckListWithAnswer[],
    frequency: 'daily' | 'weekly'
  ) => {
    if (frequency === 'daily') {
      const dateStr = moment(date).format('YYYY-MM-DD');
      return responses.find((checklist) =>
        checklist.form_answers.some((answer) => {
          const answerDate = moment((answer.answer as { fecha: string }).fecha);
          const answerDomain = (answer.answer as { dominio: string }).dominio;
          return answerDomain === vehicle.domain && answerDate.isSame(dateStr, 'day');
        })
      );
    } else {
      const weekStart = moment(date).startOf('isoWeek');
      const weekEnd = moment(date).endOf('isoWeek');

      return responses.find((checklist) =>
        checklist.form_answers.some((answer) => {
          const answerDate = moment((answer.answer as { fecha: string }).fecha);
          const answerDomain = (answer.answer as { dominio: string }).dominio;
          return answerDomain === vehicle.domain && answerDate.isBetween(weekStart, weekEnd, 'day', '[]');
        })
      );
    }
  };

  // Función para formatear la fecha según la frecuencia
  const formatPeriodDate = (date: Date, frequency: 'daily' | 'weekly') => {
    if (frequency === 'daily') {
      return moment(date).format('YYYY-MM-DD');
    } else {
      const weekStart = moment(date).startOf('isoWeek');
      const weekEnd = moment(date).endOf('isoWeek');
      return `${weekStart.format('D')}-${weekEnd.format('D')} ${weekStart.format('MMM')} ${weekStart.format('YYYY')}`;
    }
  };

  // Generar datos filtrados
  const getFilteredData = () => {
    if (!dateRange.from || !dateRange.to || !selectedForm) return [];

    const frequency = getFormFrequency(selectedForm);
    const dates = generateDatesInRange(dateRange.from, dateRange.to, frequency);

    let reportData: Array<{
      id: string;
      fecha: string;
      dominio: string | null;
      kilometraje: string;
      status: 'Completado' | 'Pendiente';
      vehicle: VehicleWithBrand;
      intern_number: string | null;
      conductor: string | null | undefined;
      checklist?: CheckListWithAnswer;
    }> = [];

    // Para cada fecha en el rango
    dates.forEach((date) => {
      // Para cada vehículo
      vehicles.forEach((vehicle) => {
        const checklistResponse = hasResponseInPeriod(vehicle, date, checklists, frequency);
        const hasResponse = !!checklistResponse;
        const conductor = checklistResponse ? getDriverFromResponse(checklistResponse)?.chofer : null;

        // Si estamos mostrando todos o si el estado coincide con el filtro
        if (
          filterOption === 'all' ||
          (filterOption === 'completed' && hasResponse) ||
          (filterOption === 'pending' && !hasResponse)
        ) {
          reportData.push({
            id: `${vehicle.id}-${moment(date).format('YYYY-MM-DD')}`,
            fecha: formatPeriodDate(date, frequency),
            dominio: vehicle.domain,
            kilometraje: vehicle.kilometer || 'N/A',
            status: hasResponse ? 'Completado' : 'Pendiente',
            vehicle: vehicle,
            intern_number: vehicle.intern_number,
            conductor,
            checklist: checklistResponse,
          });
        }
      });
    });

    // Aplicar filtros de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      reportData = reportData.filter(
        item =>
          (item.conductor?.toLowerCase().includes(searchLower)) ||
          item.dominio?.toLowerCase().includes(searchLower) ||
          item.intern_number?.toLowerCase().includes(searchLower) ||
          `${item.vehicle.brand.name} ${item.vehicle.model.name}`.toLowerCase().includes(searchLower)
      );
    }

    return reportData;
  };

  const filteredData = getFilteredData();

  return (
    <div className="space-y-8">
      {!showResults ? (
        <div className="space-y-4">
          <DialogTitle>Reporte de Checklists de Vehículos</DialogTitle>
          <DialogDescription>
            Seleccione los filtros para generar el reporte de checklists de vehículos.
          </DialogDescription>
          <div>
            <Label htmlFor="form-select">Seleccionar Formulario</Label>
            <Select onValueChange={setSelectedForm} value={selectedForm}>
              <SelectTrigger id="form-select">
                <SelectValue placeholder="Seleccione un formulario" />
              </SelectTrigger>
              <SelectContent>
                {checklists.map((checklist) => (
                  <SelectItem
                    key={(checklist?.form as { id: string })?.id}
                    value={(checklist?.form as { id: string })?.id ?? ''}
                  >
                    {(checklist?.form as { title: string })?.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Rango de Fechas</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn('w-full justify-start text-left font-normal', !dateRange && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'LLL dd, y', { locale: es })} -{' '}
                        {format(dateRange.to, 'LLL dd, y', { locale: es })}
                      </>
                    ) : (
                      format(dateRange.from, 'LLL dd, y', { locale: es })
                    )
                  ) : (
                    <span>Seleccione un rango de fechas</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(e) => setDateRange({ from: e?.from, to: e?.to })}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Filtrar por</Label>
            <RadioGroup value={filterOption} onValueChange={setFilterOption}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all">Todos</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="completed" id="completed" />
                <Label htmlFor="completed">Completados</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pending" id="pending" />
                <Label htmlFor="pending">Pendientes</Label>
              </div>
            </RadioGroup>
          </div>

          <Button onClick={handleGenerateReport}>Generar Reporte</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Resultados del Reporte</h2>
            <div className="flex items-center gap-2">
              <BtnXlsDownload
                dataToDownload={filteredData}
                nameFile={`reporte_checklist_${moment().format('YYYY-MM-DD')}`}
                fn={(data: any) =>
                  data.map((item: any) => ({
                    Fecha: item.fecha,
                    Estado: item.status,
                    Vehículo: `${item.vehicle.brand.name} ${item.vehicle.model.name}`,
                    'N° Interno': item.intern_number || 'N/A',
                    Dominio: item.dominio || 'N/A',
                    Conductor: item.conductor || 'N/A',
                    Kilometraje: item.kilometraje,
                  }))
                }
              />
              <Button onClick={handleBackToOptions} variant="outline">
                Volver a Opciones
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar por conductor, dominio o vehículo..."
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Fecha</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                  <TableHead className="font-semibold">Vehículo</TableHead>
                  <TableHead className="font-semibold">N° Interno</TableHead>
                  <TableHead className="font-semibold">Dominio</TableHead>
                  <TableHead className="font-semibold">Conductor</TableHead>
                  <TableHead className="font-semibold">Kilometraje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                      No se encontraron resultados
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell>{item.fecha}</TableCell>
                      <TableCell>
                        {item.status === 'Completado' ? (
                          <Badge className="bg-green-500 hover:bg-green-600">
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Completado
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600">
                            <Clock className="w-4 h-4 mr-1" />
                            Pendiente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4" />
                          {`${item.vehicle.brand.name} ${item.vehicle.model.name}`}
                        </div>
                      </TableCell>
                      <TableCell>{item.intern_number || 'N/A'}</TableCell>
                      <TableCell>{item.dominio || 'N/A'}</TableCell>
                      <TableCell>{item.conductor || '-'}</TableCell>
                      <TableCell>{item.kilometraje}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

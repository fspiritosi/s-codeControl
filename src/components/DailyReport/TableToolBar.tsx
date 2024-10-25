'use client';

import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectGroup, SelectItem } from '@/components/ui/select';

interface TableToolbarProps<TData> {
  table: Table<TData>;
  dailyReport: any[];
  reportData: any;
  setDailyReport: (data: any[]) => void;
  customers: any[];
  services: any[];
  items: any[];
  employees: any[];
  equipment: any[];
}

export function TableToolbar<TData>({
  table,
  dailyReport,
  reportData,
  setDailyReport,
  customers,
  services,
  items,
  employees,
  equipment,
}: TableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const filterByValue = (field: string, value: string) => {
    if (value === 'all') {
      setDailyReport(reportData?.dailyreportrows || []);
    } else {
      const filteredReports = dailyReport.filter(report => report[field]?.includes(value));
      setDailyReport(filteredReports);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {/* Filtro por cliente */}
        <Select
          onValueChange={(value) => filterByValue('customer', value)}
        >
          <SelectTrigger className="h-6 w-24 border-spacing-1 ml-2">
            <span>Cliente</span>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Todos</SelectItem>
              {Array.from(new Set(dailyReport.map(report => report.customer))).map((customerId) => {
                const customer = customers.find(c => c.id === customerId);
                return customer ? (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ) : null;
              })}
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* Filtro por servicio */}
        <Select
          onValueChange={(value) => filterByValue('services', value)}
        >
          <SelectTrigger className="h-6 w-24 border-spacing-1 ml-2">
            <span>Servicio</span>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Todos</SelectItem>
              {Array.from(new Set(dailyReport.map(report => report.services))).map((serviceId) => {
                const service = services.find(s => s.id === serviceId);
                return service ? (
                  <SelectItem key={service.id} value={service.id}>
                    {service.service_name}
                  </SelectItem>
                ) : null;
              })}
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* Filtro por item */}
        <Select
          onValueChange={(value) => filterByValue('item', value)}
        >
          <SelectTrigger className="h-6 w-24 border-spacing-1 ml-2">
            <span>Item</span>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Todos</SelectItem>
              {Array.from(new Set(dailyReport.map(report => report.item))).map((itemId) => {
                const item = items.find(i => i.id === itemId);
                return item ? (
                  <SelectItem key={item.id} value={item.id}>
                    {item.item_name}
                  </SelectItem>
                ) : null;
              })}
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* Filtro por empleados */}
        <Select
          onValueChange={(value) => filterByValue('employees', value)}
        >
          <SelectTrigger className="h-6 w-24 border-spacing-1 ml-2">
            <span>Empleados</span>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Todos</SelectItem>
              {Array.from(new Set(dailyReport.flatMap(report => report.employees))).map((employeeId) => {
                const employee = employees.find(emp => emp.id === employeeId);
                return employee ? (
                  <SelectItem key={employee.id} value={employee.id}>
                    {`${employee.firstname} ${employee.lastname}`}
                  </SelectItem>
                ) : null;
              })}
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* Filtro por equipos */}
        <Select
          onValueChange={(value) => filterByValue('equipment', value)}
        >
          <SelectTrigger className="h-6 w-24 border-spacing-1 ml-2">
            <span>Equipos</span>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Todos</SelectItem>
              {Array.from(new Set(dailyReport.flatMap(report => report.equipment))).map((equipmentId) => {
                const equipmentItem = equipment.find(eq => eq.id === equipmentId);
                return equipmentItem ? (
                  <SelectItem key={equipmentItem.id} value={equipmentItem.id}>
                    {equipmentItem.intern_number}
                  </SelectItem>
                ) : null;
              })}
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* Filtro por jornada */}
        <Select
          onValueChange={(value) => filterByValue('working_day', value)}
        >
          <SelectTrigger className="h-6 w-24 border-spacing-1 ml-2">
            <span>Jornada</span>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Todos</SelectItem>
              {Array.from(new Set(dailyReport.map(report => report.working_day))).map((workingDay) => (
                <SelectItem key={workingDay} value={workingDay}>
                  {workingDay?.charAt(0).toUpperCase() + workingDay?.slice(1)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* Filtro por estado */}
        <Select
          onValueChange={(value) => filterByValue('status', value)}
        >
          <SelectTrigger className="h-6 w-24 border-spacing-1 ml-2">
            <span>Estado</span>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Todos</SelectItem>
              {Array.from(new Set(dailyReport.map(report => report.status))).map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* Botón para limpiar filtros */}
        {isFiltered && (
          <Button variant="ghost" onClick={() => table.resetColumnFilters()} className="h-8 px-2 lg:px-3">
            Limpiar filtros
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

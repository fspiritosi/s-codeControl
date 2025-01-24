'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { PlusCircledIcon } from '@radix-ui/react-icons';
import { AnimatePresence, motion } from 'framer-motion';
import cookies from 'js-cookie';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import MultiSelect from './MultiSelect';
// import { id } from 'date-fns/locale'
import { supabaseBrowser } from '@/lib/supabase/browser';
import { dailyReportSchema } from '@/zodSchemas/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import moment from 'moment';
import { Card, CardDescription } from '../ui/card';
import GenericDialog from './GenericDialog';
// import { cn } from '@/lib/utils'


import DailyReportSkeleton from '../Skeletons/DayliReportSkeleton';
import DocumentView from './DocumentView';
import { dailyColumns } from './tables/DailyReportColumns';
import { TypesOfCheckListTable } from './tables/data-table-dily-report';
import BtnXlsDownload from '../BtnXlsDownload'
// import { Customers, Services, Items, Employee, Equipment} from '@/components/DailyReport/DailyReport';
import { getCustomerName, getServiceName, getItemName, getEmployeeNames, getEquipmentNames } from '@/components/DailyReport/utils/utils';
export interface Customers {
  id: string;
  name: string;
  is_active: boolean;
}

export interface Employee {
  id: string;
  firstname: string;
  lastname: string;
  allocated_to: string[];
  is_active: boolean;
}

export interface Equipment {
  id: string;
  name: string;
  intern_number: number;
  allocated_to: string[];
  is_active: boolean;
  condition: 'operativo' | 'no operativo' | 'en reparación' | 'operativo condicionado';
}

export interface Services {
  service_validity: string | number | Date;
  service_start: string | number | Date;
  id: string;
  customer_id: string;
  service_name: string;
  is_active: boolean;
  item_id: string;
}

export interface Items {
  id: string;
  item_name: string;
  customer_service_id: { id: string };
}

export interface DailyReportItem {
  id: string;
  date: string;
  working_day: string;
  customer: string | undefined;
  employees: string[];
  equipment: string[];
  services: string;
  item: string;
  start_time: string;
  end_time: string;
  status: 'pendiente' | 'ejecutado' | 'cancelado' | 'reprogramado';
  description: string;
  document_path?: string;
}

interface DailyReportData {
  id: string;
  date: string;
  status: boolean;
  dailyreportrows: DailyReportItem[];
}

interface DailyReportProps {
  reportData?: DailyReportData | undefined;
  allReport?: DailyReportData[];
}

interface Diagram {
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
    work_active: boolean;
  };
  day: number;
  month: number;
  year: number;
}
interface RepairsSolicituds {
  id: string;
  created_at: string;
  reparation_type: {
    id: string;
    name: string;
    criticity: string;
    is_active: boolean;
    company_id: string;
    created_at: string;
    description: string;
    type_of_maintenance: string;
  };
  equipment_id: {
    id: string;
    type: {
      id: string;
      name: string;
      is_active: boolean;
      created_at: string;
    };
    year: string;
    brand: {
      id: number;
      name: string;
      is_active: boolean;
      created_at: string;
    };
    model: {
      id: number;
      name: string;
      brand: number;
      is_active: boolean;
      created_at: string;
    };
    serie: string;
    domain: string;
    engine: string;
    status: string;
    chassis: string;
    picture: string;
    user_id: string;
    condition: string;
    is_active: boolean;
    kilometer: string;
    company_id: string;
    created_at: string;
    allocated_to: string[];
    intern_number: string;
    type_of_vehicle: number;
    termination_date: string | null;
    reason_for_termination: string | null;
  };
  state: string;
  user_description: string;
  mechanic_description: string;
  end_date: string | null;
  user_id: {
    id: string;
    role: string;
    email: string;
    avatar: string | null;
    fullname: string;
    created_at: string;
    credential_id: string;
  };
  mechanic_id: string | null;
  mechanic_images: (string | null)[];
  user_images: string[];
  employee_id: string | null;
  kilometer: string | null;
  repairlogs: {
    id: string;
    title: string;
    kilometer: string | null;
    repair_id: string;
    created_at: string;
    description: string;
    modified_by_user: string | null;
    modified_by_employee: string | null;
  }[];
}

export default function DailyReport({ reportData, allReport }: DailyReportProps) {
  // console.log(reportData);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customers[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customers | null>(null);
  const [customerEmployees, setCustomerEmployees] = useState<Employee[]>([]);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [customerEquipment, setCustomerEquipment] = useState<Equipment[]>([]);
  const [services, setServices] = useState<Services[]>([]);
  const [customerServices, setCustomerServices] = useState<Services[]>([]);
  const [selectedService, setSelectedService] = useState<Services | null>(null);
  const [items, setItems] = useState<Items[]>([]);
  const [customerItems, setCustomerItems] = useState<Items[]>([]);
  const [dailyReport, setDailyReport] = useState<DailyReportItem[]>(reportData?.dailyreportrows || []);
  const [isMultipleEmployeesAllowed, setIsMultipleEmployeesAllowed] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reportStatus, setReportStatus] = useState<boolean>(reportData?.status || false);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectRow, setSelectRow] = useState<string | null>(null);
  const [workingDay, setWorkingDay] = useState<string>('');
  const [diagram, setDiagram] = useState<Diagram[]>([]);
  const [repairOrders, setRepairOrders] = useState<RepairsSolicituds[]>([]);
  const [date, setDate] = useState<Date | undefined>(() => {
    if (reportData && reportData.date) {
      return new Date(reportData.date);
    }
    return undefined;
  });
  const [existingReportId, setExistingReportId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [futureReports, setFutureReports] = useState<DailyReportData[]>([]);
  const [selectedReport, setSelectedReport] = useState<DailyReportData | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<String | null>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [filaId, setFilaId] = useState<string | null>(null);
  const [filteredRow, setFilteredRow] = useState<DailyReportItem | null>(null);
  const supabase = supabaseBrowser();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const URL = process.env.NEXT_PUBLIC_BASE_URL;
  const formMethods = useForm<DailyReportItem>({
    resolver: zodResolver(dailyReportSchema),
    defaultValues: {
      customer: undefined,
      employees: [],
      equipment: [],
      working_day: '',
      services: '',
      item: '',
      start_time: '',
      end_time: '',
      status: 'pendiente',
      description: '',
    },
  });
  const { handleSubmit, control, setValue, watch, reset } = formMethods;

  const company_id = cookies.get('actualComp');
  const modifiedCompany = company_id?.replace(/['"]/g, '').trim();

  const fetchCompanyName = async () => {
    const response = await fetch(`${URL}/api/company?actual=${company_id}`);
    const data = await response.json();
    const companyName = data.data[0].company_name;
    const companyData = data.data[0];
    setCompanyData(companyData);
    // console.log(companyName);
    setCompanyName(companyName);
    return companyName;
  };

  async function fetchEmployees() {
    const { employees } = await fetch(`${URL}/api/employees/?actual=${company_id}`).then((e) => e.json());
    setEmployees(employees);
    return employees;
  }

  async function fetchCustomers() {
    const { customers, error } = await fetch(`${URL}/api/company/customers/?actual=${company_id}`).then((e) =>
      e.json()
    );
    const activeCustomers = customers.filter((customer: Customers) => customer.is_active);
    setIsLoading(false);
    setCustomers(activeCustomers);
  }

  async function fetchEquipment() {
    try {
      const response = await fetch(`${URL}/api/equipment/?actual=${company_id}`);
      if (!response.ok) {
        throw new Error(`Error en la solicitud: ${response.statusText}`);
      }
      const data = await response.json();
      const equipment = data.equipments;
      const activeEquipment = equipment.filter((eq: Equipment) => eq.is_active);
      setEquipment(activeEquipment);
      return equipment;
    } catch (error) {
      console.error('Error fetching equipment:', error);
    }
  }

  async function fetchServices() {
    const { services } = await fetch(`${URL}/api/services?actual=${company_id}`).then((e) => e.json());
    const activeServices = services.filter((service: Services) => service.is_active);
    setServices(activeServices);

    return services;
  }

  async function fetchItems() {
    const { items } = await fetch(`${URL}/api/services/items/report?actual=${company_id}`).then((e) => e.json());
    setItems(items);
    return items;
  }

  async function fetchDiagrams() {
    const { data: diagrams } = await fetch(`${URL}/api/employees/diagrams`).then((e) => e.json());
    setDiagram(diagrams);
    return diagrams;
  }

  const [isDialogOpen2, setIsDialogOpen2] = useState(false);

  async function fetchDocument(document_path: string) {
    const { data: url } = supabase.storage.from('daily_reports').getPublicUrl(document_path);
    setDocumentUrl(url.publicUrl);
    return url.publicUrl;
  }

  const handleViewDocument = async (documentPath: string, row_id?: string) => {
    const filteredRow = dailyReport.find((row) => row.id === row_id);
    //console.log(filteredRow);
    setFilteredRow(filteredRow as DailyReportItem);
    const url = await fetchDocument(documentPath); // Asume que fetchDocumentUrl es una función que obtiene la URL del documento
    setDocumentUrl(url);
    setFilaId(row_id || null);
    // window.open(url, '_blank');
    setIsDialogOpen2(true);
  };

  const closeDialog2 = () => {
    setIsDialogOpen2(false);
    setDocumentUrl(null);
  };

  useEffect(() => {
    fetchCompanyName();
    fetchEmployees();
    fetchCustomers();
    fetchEquipment();
    fetchServices();
    fetchItems();
    fetchDiagrams();
  }, []);
  //console.log(companyName);

  useEffect(() => {
    // Filtrar servicios válidos en la fecha del parte diario
    const validServices = services.filter((service) => {
      const serviceStartDate = moment(service.service_start).toDate();
      const serviceValidityDate = moment(service.service_validity).toDate();
      const reportDate = moment(reportData?.date).toDate();

      return service.is_active && reportDate >= serviceStartDate && reportDate <= serviceValidityDate;
    });

    // Filtrar clientes que tienen servicios válidos
    const customersWithServices = customers.filter((customer) =>
      validServices.some((service) => service.customer_id === customer.id)
    );

    // Solo actualizar el estado si la lista filtrada es diferente
    if (customersWithServices.length !== customers.length) {
      setCustomers(customersWithServices);
    }
  }, [customers, services, reportData]);

  useEffect(() => {
    if (reportData) {
      setDate(new Date(reportData.date));
      setEditingId(reportData.id);
      setDailyReport(
        reportData.dailyreportrows?.map((row) => ({
          ...row,
          // date: format(new Date(row.date), "yyyy-MM-dd"),
          daily_report_id: reportData.id,
        }))
      );
      setReportStatus(reportData.status);
      setExistingReportId(reportData.id);
    }
  }, [reportData]);

  useEffect(() => {
    if (startTime && endTime) {
      const start = new Date(`1970-01-01T${startTime}:00`);
      const end = new Date(`1970-01-01T${endTime}:00`);
      const diffInHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      setIsMultipleEmployeesAllowed(diffInHours > 12);
    }
  }, [startTime, endTime]);

  const handleSelectCustomer = (customerId: string, reportDate: Date) => {
    const customer = customers.find((c: Customers) => c.id.toString() === customerId);
    if (customer) {
      setSelectedCustomer(customer);

      const filteredEmployees = employees.filter((employee: Employee) => {
        const isAllocatedToCustomer = employee.allocated_to?.includes(customer.id);
        const isActiveOnReportDate = diagram.some((diagram) => {
          const diagramDate = new Date(diagram.year, diagram.month - 1, diagram.day);
          return (
            diagramDate.getFullYear() === reportDate.getFullYear() &&
            diagramDate.getMonth() === reportDate.getMonth() &&
            diagramDate.getDate() === reportDate.getDate() &&
            diagram.diagram_type.work_active &&
            diagram.employee_id === employee.id
          );
        });
        return isAllocatedToCustomer && isActiveOnReportDate;
      });
      setCustomerEmployees(filteredEmployees);

      const filteredEquipment = equipment.filter((equipment: Equipment) => {
        const isAllocatedToCustomer = equipment.allocated_to?.includes(customer.id);
        const isNotUnderRepair = !(equipment.condition === 'en reparación' || equipment.condition === 'no operativo');
        return isAllocatedToCustomer && isNotUnderRepair;
      });
      setCustomerEquipment(filteredEquipment);

      const filteredServices = services.filter((service: Services) => {
        const serviceStartDate = new Date(service.service_start);
        const serviceValidityDate = new Date(service.service_validity);
        return (
          service.customer_id === customerId &&
          service.is_active &&
          reportDate >= serviceStartDate &&
          reportDate <= serviceValidityDate
        );
      });

      setCustomerServices(filteredServices);

      // Reset dependent selects
      setValue('services', '');
      setValue('item', '');
      setValue('employees', []);
      setValue('equipment', []);
      setCustomerItems([]);
      setSelectedService(null);
    }
  };

  const handleSelectService = (serviceId: string) => {
    const service = services.find((s: Services) => s.id === serviceId);
    if (service) {
      setSelectedService(service);

      const filteredItems = items.filter((item: Items) => item.customer_service_id.id === serviceId);
      setCustomerItems(filteredItems);

      // Reset dependent selects
      setValue('item', '');
    }
  };

  const handleAddNewRow = () => {
    setEditingId(null);
    resetForm();
    setIsEditing(true);
  };

  const resetForm = () => {
    reset({
      customer: undefined,
      services: '',
      working_day: '',
      item: '',
      start_time: '',
      end_time: '',
      employees: [],
      equipment: [],
      status: 'pendiente',
      description: '',
    });
    setStartTime('');
    setEndTime('');
    setSelectedCustomer(null);
    setCustomerEmployees([]);
    setCustomerEquipment([]);
    setCustomerServices([]);
    setCustomerItems([]);
    setSelectedService(null);
  };

  const handleEdit = async (id: string) => {
    const itemToEdit = dailyReport.find((item) => item.id === id);
    if (itemToEdit) {
      setEditingId(id);
      // setDate(new Date(itemToEdit.date))
      await handleSelectCustomer(itemToEdit.customer || '', reportData ? new Date(reportData.date) : new Date());
      setValue('customer', itemToEdit.customer);
      setValue('working_day', itemToEdit.working_day);
      setValue('employees', itemToEdit.employees);
      setValue('equipment', itemToEdit.equipment);
      setValue('services', itemToEdit.services);
      await handleSelectService(itemToEdit.services);
      setValue('item', itemToEdit.item);
      // Normalizar el valor de working_day
      const normalizedWorkingDay = itemToEdit.working_day?.trim().toLowerCase();

      // Verificar si la jornada es de 8 o 12 horas y poner en vacío la hora de inicio y fin
      if (normalizedWorkingDay === 'jornada 8 horas' || normalizedWorkingDay === 'jornada 12 horas') {

        setValue('start_time', '');
        setValue('end_time', '');

      } else {
        setValue('start_time', itemToEdit.start_time?.slice(0, 5));
        setValue('end_time', itemToEdit.end_time?.slice(0, 5));
      }
      setValue('status', itemToEdit.status);
      setValue('description', itemToEdit.description);
      setIsEditing(true);
    }
  };

  const handleConfirmOpen = (id: string) => {
    setSelectRow(id);

    setConfirmDelete(true);
  };

  const handleConfirmClose = () => {
    setConfirmDelete(false);
  };
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/daily-report/daily-report-row?id=${id}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al obtener el estado de la fila: ${errorText}`);
      }

      const rowData = await response.json();

      const { dailyreportrows } = rowData;
      const row = dailyreportrows.find((item: any) => item.id === id);

      if (!row) {
        throw new Error('Fila no encontrada');
      }

      const { status } = row;

      if (status !== 'pendiente') {
        toast({
          title: 'Error',
          description: "Solo se pueden eliminar filas con estado 'pendiente'.",
          variant: 'destructive',
        });
        return;
      }

      const deleteResponse = await fetch(`/api/daily-report/daily-report-row`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        throw new Error(`Error al eliminar la fila: ${errorText}`);
      }

      setDailyReport(dailyReport.filter((item) => item.id !== id));

      toast({
        title: 'Éxito',
        description: 'Fila eliminada correctamente.',
      });
    } catch (error) {
      console.error('Error al eliminar la fila:', error);
      toast({
        title: 'Error',
        description: `Hubo un problema al eliminar la fila: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  const handleWorkingDayChange = (value: string) => {
    setWorkingDay(value);
  };

  const selectedEmployees = watch('employees');
  const selectedEquipment = watch('equipment');

  const formatTime = (time: string): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
  };

  const saveDailyReport = async (data: any) => {
    try {
      const formattedStartTime = formatTime(data.start_time);
      const formattedEndTime = formatTime(data.end_time);

      // Obtener el array de filas existentes, asegurándonos de que sea un array
      const existingRows = Array.isArray(dailyReport) ? dailyReport : [];

      // Verificar si ya existe una fila exactamente igual
      const isDuplicate = existingRows.some(
        (row) =>
          row.customer === data.customer &&
          row.services === data.services &&
          row.item === data.item &&
          row.working_day === data.working_day &&
          row.start_time === formattedStartTime &&
          row.end_time === formattedEndTime &&
          row.description === data.description &&
          row.status === data.status &&
          JSON.stringify(row.employees) === JSON.stringify(data.employees) &&
          JSON.stringify(row.equipment) === JSON.stringify(data.equipment)
      );

      if (isDuplicate) {
        toast({
          title: 'Error',
          description: 'Ya existe una fila con los mismos datos.',
          variant: 'destructive',
        });
        return; // Salir de la función si ya existe una fila igual
      }

      const rowResponse = await fetch('/api/daily-report/daily-report-row', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          daily_report_id: reportData?.id,
          customer_id: data.customer,
          service_id: data.services,
          item_id: data.item,
          start_time: formattedStartTime,
          end_time: formattedEndTime,
          description: data.description,
          status: data.status,
        }),
      });

      if (!rowResponse.ok) {
        const errorText = await rowResponse.text();
        throw new Error(`Error al insertar la fila en dailyreportrow: ${errorText}`);
      }

      const { data: rowData } = await rowResponse.json();
      const rowId = rowData[0].id; // Asegúrate de que esto sea correcto

      if (data.employees && data.employees.length > 0) {
        await fetch('/api/daily-report/dailyreportemployeerelations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            data.employees.map((employee_id: string) => ({
              daily_report_row_id: rowId,
              employee_id: employee_id,
            }))
          ),
        });
      }

      if (data.equipment && data.equipment.length > 0) {
        await fetch('/api/daily-report/dailyreportequipmentrelations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            data.equipment.map((equipment_id: string) => ({
              daily_report_row_id: rowId,
              equipment_id: equipment_id,
            }))
          ),
        });
      }

      setDailyReport((prevReport) => {
        // Verificar que prevReport sea un array
        if (!Array.isArray(prevReport)) {
          prevReport = [];
        }

        return [
          ...prevReport,
          {
            id: rowId,
            date: reportData?.date || '',
            working_day: data.working_day,
            customer: data.customer,
            employees: data.employees,
            equipment: data.equipment,
            services: data.services,
            item: data.item,
            start_time: formattedStartTime,
            end_time: formattedEndTime,
            status: data.status,
            description: data.description,
            document_path: data.document_path,
          },
        ];
      });

      resetForm();

      toast({
        title: 'Éxito',
        description: 'Fila agregada correctamente al parte diario.',
      });
    } catch (error) {
      console.error('Error al procesar el parte diario:', error);
      toast({
        title: 'Error',
        description: `Hubo un problema al procesar el parte diario: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  const updateDailyReport = async (data: any, rowId: string) => {
    try {
      if (data.working_day === 'jornada 8 horas' || data.working_day === 'jornada 12 horas') {
        data.start_time = '';
        data.end_time = '';

      }
      const formattedStartTime = formatTime(data.start_time);
      const formattedEndTime = formatTime(data.end_time);

      // Actualizar la fila existente
      const rowResponse = await fetch(`/api/daily-report/daily-report-row?id=${rowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          daily_report_id: existingReportId,
          customer_id: data.customer,
          service_id: data.services,
          item_id: data.item,
          working_day: data.working_day,
          start_time: formattedStartTime,
          end_time: formattedEndTime,
          description: data.description,
          status: data.status,
        }),
      });

      if (!rowResponse.ok) {
        const errorText = await rowResponse.text();
        throw new Error(`Error al actualizar la fila en dailyreportrow: ${errorText}`);
      }

      const { data: rowData } = await rowResponse.json();

      // Obtener relaciones actuales de empleados
      const employeeRelationsResponse = await fetch(`/api/daily-report/dailyreportemployeerelations?row_id=${rowId}`);
      if (!employeeRelationsResponse.ok) {
        const errorText = await employeeRelationsResponse.text();
        throw new Error(`Error al obtener relaciones de empleados: ${errorText}`);
      }
      const employeeRelationsData = await employeeRelationsResponse.json();

      const currentEmployees = employeeRelationsData.dailyreportemployeerelations.map((rel: any) => ({
        id: rel.id,
        employee_id: rel.employee_id,
      }));

      // Obtener relaciones actuales de equipos
      const equipmentRelationsResponse = await fetch(`/api/daily-report/dailyreportequipmentrelations?row_id=${rowId}`);
      if (!equipmentRelationsResponse.ok) {
        const errorText = await equipmentRelationsResponse.text();
        throw new Error(`Error al obtener relaciones de equipos: ${errorText}`);
      }
      const equipmentRelationsData = await equipmentRelationsResponse.json();

      const currentEquipment = equipmentRelationsData.dailyreportequipmentrelations.map((rel: any) => ({
        id: rel.id,
        equipment_id: rel.equipment_id,
      }));

      // Determinar relaciones a eliminar
      const employeesToRemove = currentEmployees.filter((rel: any) => !data.employees?.includes(rel.employee_id));
      const equipmentToRemove = currentEquipment.filter((rel: any) => !data.equipment?.includes(rel.equipment_id));

      // Eliminar relaciones no utilizadas
      if (employeesToRemove.length > 0) {
        await fetch('/api/daily-report/dailyreportemployeerelations', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            daily_report_row_id: rowId,
            employees: employeesToRemove.map((rel: any) => ({ id: rel.id, employee_id: rel.employee_id })),
          }),
        });
      }

      if (equipmentToRemove.length > 0) {
        await fetch('/api/daily-report/dailyreportequipmentrelations', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            daily_report_row_id: rowId,
            equipment: equipmentToRemove.map((rel: any) => ({ id: rel.id, equipment_id: rel.equipment_id })),
          }),
        });
      }
      //Antes de actuaslizar las relaciones se debe verificar que no existan relaciones con el mismo empleado y el mismo rowId

      const existingRelationEmployeeResponse = await fetch(
        `/api/daily-report/dailyreportemployeerelations/check-employee`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rowId: rowId,
            employees: data.employees,
          }),
        }
      );
      const existingEmployee = await existingRelationEmployeeResponse.json();

      // Actualizar relaciones con nuevos datos
      if (data.employees && !existingEmployee.exists && data.employees.length > 0) {
        await fetch('/api/daily-report/dailyreportemployeerelations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            data.employees.map((employee_id: string) => ({
              daily_report_row_id: rowId,
              employee_id: employee_id,
            }))
          ),
        });
      }

      //Antes de actuaslizar las relaciones se debe verificar que no existan relaciones con el mismo empleado y el mismo rowId

      const existingRelationEquipmentResponse = await fetch(
        `/api/daily-report/dailyreportequipmentrelations/check-equipment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rowId: rowId,
            equipment: data.equipment,
          }),
        }
      );
      const existingEquipment = await existingRelationEquipmentResponse.json();

      if (data.equipment && !existingEquipment.exists && data.equipment.length > 0) {
        await fetch('/api/daily-report/dailyreportequipmentrelations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            data.equipment.map((equipment_id: string) => ({
              daily_report_row_id: rowId,
              equipment_id: equipment_id,
            }))
          ),
        });
      }

      setDailyReport((prevReport) =>
        prevReport.map((report) =>
          report.id === rowId
            ? {
              ...report,
              customer: data.customer,
              employees: data.employees,
              equipment: data.equipment,
              services: data.services,
              item: data.item,
              working_day: data.working_day,
              start_time: formattedStartTime,
              end_time: formattedEndTime,
              status: data.status,
              description: data.description,
              document_path: data.document_path,
            }
            : report
        )
      );

      toast({
        title: 'Éxito',
        description: 'Fila actualizada correctamente en el parte diario.',
      });
    } catch (error) {
      console.error('Error al actualizar el parte diario:', error);
      toast({
        title: 'Error',
        description: `Hubo un problema al actualizar el parte diario: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (data: any) => {
    if (editingId) {
      await updateDailyReport(data, editingId);
    } else {
      await saveDailyReport(data);
    }
    setIsEditing(false);
    setEditingId(null);
  };

  // Obtener la fecha actual
  const currentDate = new Date();

  // Función para calcular la diferencia de días
  const calculateDateDifference = (dateString: string) => {
    const reportDate = new Date(dateString);

    const timeDifference = currentDate.getTime() - reportDate.getTime();

    const dayDifference = timeDifference / (1000 * 3600 * 24);
    return dayDifference;
  };

  const dayDifference = calculateDateDifference(reportData?.date || '');

  const canEdit = dayDifference <= 6;

  const handleValueChange = (value: string) => {
    if (value === 'reprogramado' && editingId) {
      const currentReport = dailyReport.find((report: DailyReportItem) => report.id === editingId);

      if (currentReport) {
        const futureReports = allReport?.filter((report) => moment(report.date).isAfter(moment(currentReport?.date)));

        setFutureReports(futureReports as any);
        setSelectedReport(currentReport as any);
        setIsDialogOpen(true);
      }
    } else if (value === 'ejecutado' && editingId) {
      setIsDialogOpen(true);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFutureReports([]);
    setSelectedReport(null);
    setSelectedDate(null);
  };

  const handleSaveToDailyReport = async () => {
    if (selectedDate && selectedReport) {
      try {
        const updatedReport = {
          ...selectedReport,
          id: null,
          daily_report_id: selectedDate,
          description: `Reprogramado desde ${selectedReport.date}`,
        };

        await reprogramarReporte(updatedReport, existingReportId as string, selectedDate as string);

        setIsDialogOpen(false);
      } catch (error) {
        console.error('Error al guardar el reporte:', error);
      }
    }
  };
  ////////////////////////////////////////////////////////////

  const reprogramarReporte = async (data: any, rowId: string, newDailyReportId: string) => {
    try {
      const formattedStartTime = formatTime(data.start_time);
      const formattedEndTime = formatTime(data.end_time);

      // Crear una nueva fila en el nuevo parte diario
      const newRowResponse = await fetch(`/api/daily-report/daily-report-row`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          daily_report_id: newDailyReportId,
          customer_id: data.customer,
          service_id: data.services,
          item_id: data.item,
          working_day: data.working_day,
          start_time: formattedStartTime,
          end_time: formattedEndTime,
          description: `Reprogramado desde ${data.date}`,
          status: 'pendiente',
        }),
      });

      if (!newRowResponse.ok) {
        const errorText = await newRowResponse.text();
        throw new Error(`Error al crear la nueva fila en dailyreportrow: ${errorText}`);
      }

      const { data: newRowData } = await newRowResponse.json();
      const newRowId = newRowData.id;

      // Actualizar el estado de la fila original a "reprogramado"
      const updateRowResponse = await fetch(`/api/daily-report/daily-report-row?id=${rowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'reprogramado',
          description: `Reprogramado a ${data.date}`,
        }),
      });

      if (!updateRowResponse.ok) {
        const errorText = await updateRowResponse.text();
        throw new Error(`Error al actualizar la fila original en dailyreportrow: ${errorText}`);
      }

      // Obtener relaciones actuales de empleados
      const employeeRelationsResponse = await fetch(`/api/daily-report/dailyreportemployeerelations?row_id=${rowId}`);
      if (!employeeRelationsResponse.ok) {
        const errorText = await employeeRelationsResponse.text();
        throw new Error(`Error al obtener relaciones de empleados: ${errorText}`);
      }
      const employeeRelationsData = await employeeRelationsResponse.json();

      const currentEmployees = employeeRelationsData.dailyreportemployeerelations.map((rel: any) => ({
        id: rel.id,
        employee_id: rel.employee_id,
      }));

      // Obtener relaciones actuales de equipos
      const equipmentRelationsResponse = await fetch(`/api/daily-report/dailyreportequipmentrelations?row_id=${rowId}`);
      if (!equipmentRelationsResponse.ok) {
        const errorText = await equipmentRelationsResponse.text();
        throw new Error(`Error al obtener relaciones de equipos: ${errorText}`);
      }
      const equipmentRelationsData = await equipmentRelationsResponse.json();

      const currentEquipment = equipmentRelationsData.dailyreportequipmentrelations.map((rel: any) => ({
        id: rel.id,
        equipment_id: rel.equipment_id,
      }));

      // Crear nuevas relaciones de empleados para la nueva fila
      if (currentEmployees.length > 0) {
        await fetch('/api/daily-report/dailyreportemployeerelations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            currentEmployees.map((employee: any) => ({
              daily_report_row_id: newRowId,
              employee_id: employee.employee_id,
            }))
          ),
        });
      }

      // Crear nuevas relaciones de equipos para la nueva fila
      if (currentEquipment.length > 0) {
        await fetch('/api/daily-report/dailyreportequipmentrelations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            currentEquipment.map((equipment: any) => ({
              daily_report_row_id: newRowId,
              equipment_id: equipment.equipment_id,
            }))
          ),
        });
      }

      // Actualizar el estado del componente si es necesario
      setDailyReport((prevReport) =>
        prevReport.map((report) =>
          report.id === rowId
            ? {
              ...report,
              status: 'reprogramado',
              description: `Reprogramado a ${data.date}`,
            }
            : report
        )
      );

      toast({
        title: 'Éxito',
        description: 'Fila reprogramada correctamente al nuevo parte diario.',
      });
    } catch (error) {
      console.error('Error al reprogramar la fila al nuevo parte diario:', error);
      toast({
        title: 'Error',
        description: `Hubo un problema al reprogramar la fila al nuevo parte diario: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  function createDataToDownload(data: DailyReportItem[]) {
    const dataToDownload = data.map((report: DailyReportItem) => ({
      Fecha: report.date,
      Cliente: report.customer ? getCustomerName(report.customer, customers) : 'N/A',
      Servicio: report.services ? getServiceName(report.services, services) : 'N/A',
      Item: report.item ? getItemName(report.item, items) : 'N/A',
      Empleados: Array.isArray(report.employees) ? getEmployeeNames(report.employees, employees) : 'N/A',
      Equipos: Array.isArray(report.equipment) ? getEquipmentNames(report.equipment, equipment) : 'N/A',
      Jornada: report.working_day,
      'Hora de Inicio': report.start_time,
      'Hora de Fin': report.end_time,
      Estado: report.status,
      Descripción: report.description,
    }));
    return dataToDownload;
  }

  if (isLoading) {
    return <DailyReportSkeleton />;
  }

  return (
    <div className="mx-auto p-4">
      <div className="relative w-full h-full overflow-hidden">
        <motion.div className="flex w-full" animate={{ height: 'auto' }} transition={{ duration: 0.3 }}>
          <AnimatePresence>
            {isEditing && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '23%', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="pr-4 overflow-hidden"
              >
                <h1 className="text-2xl font-bold mb-4">{editingId ? 'Editar Fila' : 'Agregar Nueva Fila'}</h1>
                <FormProvider {...formMethods}>
                  <Form {...formMethods}>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={control}
                        name="customer"
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel>Cliente</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                handleSelectCustomer(value, reportData?.date ? new Date(reportData.date) : new Date());
                              }}
                            >
                              <SelectTrigger className="w-full max-w-xs">
                                <SelectValue placeholder="Seleccione un cliente" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  {customers?.map((customer: Customers) => (
                                    <SelectItem key={customer.id} value={customer.id}>
                                      {customer.name}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            {fieldState.error && <p className="text-red-500">{fieldState.error.message}</p>}
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name="services"
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel>Servicios</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                handleSelectService(value);
                              }}
                            >
                              <SelectTrigger className="w-full max-w-xs">
                                <SelectValue placeholder="Seleccione el servicio" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>Servicios</SelectLabel>
                                  {customerServices?.map((service: Services) => (
                                    <SelectItem key={service.id} value={service.id}>
                                      {service.service_name}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            {fieldState.error && <p className="text-red-500">{fieldState.error.message}</p>}
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="item"
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel>Items</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="w-full max-w-xs">
                                <SelectValue placeholder="Seleccione un item" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>Items</SelectLabel>
                                  {customerItems?.map((item: Items) => (
                                    <SelectItem key={item.id} value={item.id}>
                                      {item.item_name}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            {fieldState.error && <p className="text-red-500">{fieldState.error.message}</p>}
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="employees"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="block w-full max-w-xs">Empleados</FormLabel>
                            <div className="w-full max-w-xs">
                              {' '}
                              {/* Contenedor con clases de Tailwind */}
                              <MultiSelect
                                multiEmp={customerEmployees.map((employee: Employee) => ({
                                  id: employee.id,
                                  name: `${employee.firstname} ${employee.lastname}`,
                                }))}
                                placeholder="Seleccione empleados"
                                selectedItems={field.value}
                                onChange={(selected: any) => field.onChange(selected)}
                              />
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="equipment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="block w-full max-w-xs">Equipos</FormLabel>
                            <MultiSelect
                              multiEmp={customerEquipment.map((eq: Equipment) => ({
                                id: eq.id,
                                intern_number: eq.intern_number.toString(),
                              }))}
                              placeholder="Seleccione equipos"
                              selectedItems={field.value}
                              onChange={(selected: any) => field.onChange(selected)}
                            />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="working_day"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Jornada</FormLabel>
                            <Select
                              value={field.value || workingDay}
                              onValueChange={(value) => {
                                field.onChange(value);
                                handleWorkingDayChange(value);
                              }}
                            >
                              <SelectTrigger className="w-full max-w-xs">
                                <SelectValue placeholder="Tipo de jornada" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectItem value="jornada 8 horas">Jornada 8 horas</SelectItem>
                                  <SelectItem value="jornada 12 horas">Jornada 12 horas</SelectItem>
                                  <SelectItem value="por horario">Por horario</SelectItem>
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      {isDialogOpen && (
                        <>
                          {watch('status') === 'reprogramado' && (
                            <GenericDialog
                              title="Reprogramar Reporte"
                              description="Selecciona un parte diario para reprogramar este reporte."
                              isOpen={isDialogOpen}
                              onClose={handleCloseDialog}
                            >
                              <div className="max-w-[45vw] mx-auto">
                                <Select onValueChange={(value) => setSelectedDate(value)}>
                                  <SelectTrigger className="w-full max-w-xs">
                                    <SelectValue placeholder="Seleccione un parte diario" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectGroup>
                                      {futureReports.map((futureReport) => (
                                        <SelectItem key={futureReport.id} value={futureReport.id}>
                                          {moment(futureReport.date).format('DD/MM/YYYY')}
                                        </SelectItem>
                                      ))}
                                    </SelectGroup>
                                  </SelectContent>
                                </Select>
                                <div className="mt-4 flex justify-center w-full">
                                  <Button variant="outline" onClick={handleCloseDialog} className="mr-2">
                                    Cerrar
                                  </Button>
                                <Button onClick={handleSaveToDailyReport} disabled={!selectedDate}>
                                  Guardar
                                </Button>
                              </div>
                            </div>
                          </GenericDialog>
                          )}
                      {watch('status') === 'ejecutado' && (
                        <GenericDialog
                          title="Confirmar Estado Ejecutado"
                          description="Si se pasa el estado a ejecutado, no se podrá modificar más."
                          isOpen={isDialogOpen}
                          onClose={handleCloseDialog}
                        >
                          <div className="max-w-[45vw] mx-auto">
                            <div className="mt-4 flex justify-center w-full">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setValue('status', 'pendiente');
                                  handleCloseDialog();
                                }}
                                className="mr-2"
                              >
                                Cancelar
                              </Button>
                              <Button
                                onClick={() => {
                                  handleCloseDialog();
                                }}
                              >
                                Aceptar
                              </Button>
                            </div>
                          </div>
                        </GenericDialog>
                      )}
                    </>
                        )}
                    {workingDay === 'por horario' && (
                      <>
                        <FormField
                          control={control}
                          name="start_time"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hora de inicio</FormLabel>
                              <Input
                                type="time"
                                name="start_time"
                                value={startTime ? startTime : field.value}
                                onChange={(e) => {
                                  setStartTime(e.target.value);
                                  field.onChange(e.target.value);
                                }}
                                className="w-full max-w-xs"
                              />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={control}
                          name="end_time"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hora de finalización</FormLabel>
                              <Input
                                type="time"
                                name="end_time"
                                value={field.value || endTime}
                                onChange={(e) => {
                                  setEndTime(e.target.value);
                                  field.onChange(e.target.value);
                                }}
                                className="w-full max-w-xs"
                              />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    {editingId && (
                      <FormField
                        control={control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                handleValueChange(value);
                              }}
                            >
                              <SelectTrigger className="w-full max-w-xs">
                                <SelectValue placeholder="Seleccione un estado" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pendiente">Pendiente</SelectItem>
                                <SelectItem value="ejecutado">Ejecutado</SelectItem>
                                <SelectItem value="cancelado">Cancelado</SelectItem>
                                <SelectItem value="reprogramado">Reprogramado</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="w-full max-w-xs">Descripción</FormLabel>
                          <Textarea placeholder="Ingrese una breve descripción" className="resize-none" {...field} />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full max-w-xs">
                      {editingId ? 'Guardar Cambios' : 'Agregar Fila'}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        resetForm();
                      }}
                      variant="outline"
                      className="w-full max-w-xs"
                    >
                      Cancelar
                    </Button>
                  </form>
                </Form>
              </FormProvider>
              </motion.div>
            )}
      </AnimatePresence>
      <motion.div
        animate={{ width: isEditing ? '77%' : '100%' }}
        transition={{ duration: 0.3 }}
        className="overflow-x-auto"
      >
        {canEdit && (
          <div className="flex justify-end items-center mb-4">
            <Button onClick={handleAddNewRow} className="items-end">
              <PlusCircledIcon className="mr-2 h-4 w-4" />
              Agregar Fila
            </Button>
          </div>
        )}

        <TypesOfCheckListTable
          columns={dailyColumns(handleViewDocument, handleEdit, handleConfirmOpen, canEdit as any, customers, services, items, companyName as any)}
          data={dailyReport || ''}
          customers={customers}
          services={services}
          items={items}
          employees={employees}
          equipment={equipment}
          companyName={companyName || ''}
          handleViewDocument={function (documentPath: string, row_id?: string): Promise<void> {
            throw new Error('Function not implemented.');
          }} />
        <BtnXlsDownload fn={createDataToDownload} dataToDownload={dailyReport} nameFile={`'Parte_Diario'${reportData?.date}`} />

      </motion.div>
    </motion.div>
      </div >
    <GenericDialog isOpen={isDialogOpen2} onClose={closeDialog2} title="" description="">
      <Card className="mb-2 w-full max-w-5xl mx-auto h-[85vh]">
        <CardDescription className="p-3 flex justify-center items-center h-full">
          <DocumentView
            rowId={filaId || ''}
            row={(filteredRow as DailyReportItem) || ''}
            documentUrl={documentUrl || ''}
            customerName={getCustomerName(selectedCustomer?.id || '', customers)}
            companyName={companyName || ''}
            serviceName={getServiceName(selectedService?.id || '', services)}
            itemNames={getItemName(selectedService?.item_id || '', items)}
            employeeNames={filteredRow?.employees.map((emp: string) => getEmployeeNames([emp], employees))}
            equipmentNames={filteredRow?.equipment.map((eq: string) => getEquipmentNames([eq], equipment))}
          />
        </CardDescription>
      </Card>
    </GenericDialog>
  {
    confirmDelete && (
      <div>
        <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <DialogContent className="w-full max-w-fit mx-auto p-2 flex flex-col items-center">
            <DialogTitle className="text-xl font-semibold mb-4">Confirmar Eliminación</DialogTitle>
            <DialogDescription className="text-center mb-4">
              ¿Estás seguro de que deseas eliminar esta fila?
            </DialogDescription>
            <div className="flex justify-center mt-2 space-x-2">
              <Button onClick={handleConfirmClose} className="mr-2">
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  handleDelete(selectRow as any);
                  handleConfirmClose();
                }}
                variant="destructive"
              >
                Eliminar
              </Button>
            </div>
          </DialogContent>
          <DialogFooter className="flex justify-center">
            <Button onClick={handleConfirmClose} variant="outline">
              Cerrar
            </Button>
          </DialogFooter>
        </Dialog>
      </div>
    )
  }
    </div >
  );
}

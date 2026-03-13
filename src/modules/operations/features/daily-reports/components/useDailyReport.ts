'use client';

import { storage } from '@/shared/lib/storage';
import { toast } from '@/shared/components/ui/use-toast';
import { dailyReportSchema } from '@/shared/zodSchemas/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, isAfter } from 'date-fns';
import cookies from 'js-cookie';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Customers,
  Employee,
  Equipment,
  Services,
  Items,
  DailyReportItem,
  DailyReportData,
  DailyReportProps,
  Diagram,
  RepairsSolicituds,
} from './types';

export function useDailyReport({ reportData, allReport }: DailyReportProps) {
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDialogOpen2, setIsDialogOpen2] = useState(false);
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

  // Fetch functions
  const fetchCompanyName = async () => {
    const response = await fetch(`${URL}/api/company?actual=${company_id}`);
    const data = await response.json();
    const name = data.data[0].company_name;
    const cData = data.data[0];
    setCompanyData(cData);
    setCompanyName(name);
    return name;
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
      const eq = data.equipments;
      const activeEquipment = eq.filter((e: Equipment) => e.is_active);
      setEquipment(activeEquipment);
      return eq;
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

  async function fetchDocument(document_path: string) {
    const publicUrl = storage.getPublicUrl('daily_reports', document_path);
    setDocumentUrl(publicUrl);
    return publicUrl;
  }

  const handleViewDocument = async (documentPath: string, row_id?: string) => {
    const row = dailyReport.find((r) => r.id === row_id);
    setFilteredRow(row as DailyReportItem);
    const url = await fetchDocument(documentPath);
    setDocumentUrl(url);
    setFilaId(row_id || null);
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

  useEffect(() => {
    const validServices = services.filter((service) => {
      const serviceStartDate = new Date(service.service_start);
      const serviceValidityDate = new Date(service.service_validity);
      const reportDate = new Date(reportData?.date as string);
      return service.is_active && reportDate >= serviceStartDate && reportDate <= serviceValidityDate;
    });

    const customersWithServices = customers.filter((customer) =>
      validServices.some((service) => service.customer_id === customer.id)
    );

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
        const isActiveOnReportDate = diagram.some((d) => {
          const diagramDate = new Date(d.year, d.month - 1, d.day);
          return (
            diagramDate.getFullYear() === reportDate.getFullYear() &&
            diagramDate.getMonth() === reportDate.getMonth() &&
            diagramDate.getDate() === reportDate.getDate() &&
            d.diagram_type.work_active &&
            d.employee_id === employee.id
          );
        });
        return isAllocatedToCustomer && isActiveOnReportDate;
      });
      setCustomerEmployees(filteredEmployees);

      const filteredEquipment = equipment.filter((eq: Equipment) => {
        const isAllocatedToCustomer = eq.allocated_to?.includes(customer.id);
        const isNotUnderRepair = !(eq.condition === 'en reparación' || eq.condition === 'no operativo');
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
      await handleSelectCustomer(itemToEdit.customer || '', reportData ? new Date(reportData.date) : new Date());
      setValue('customer', itemToEdit.customer);
      setValue('working_day', itemToEdit.working_day);
      setValue('employees', itemToEdit.employees);
      setValue('equipment', itemToEdit.equipment);
      setValue('services', itemToEdit.services);
      await handleSelectService(itemToEdit.services);
      setValue('item', itemToEdit.item);
      const normalizedWorkingDay = itemToEdit.working_day?.trim().toLowerCase();
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
      const response = await fetch(`/api/daily-report/daily-report-row?id=${id}`, { method: 'GET' });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al obtener el estado de la fila: ${errorText}`);
      }
      const rowData = await response.json();
      const { dailyreportrows } = rowData;
      const row = dailyreportrows.find((item: any) => item.id === id);
      if (!row) throw new Error('Fila no encontrada');
      const { status } = row;
      if (status !== 'pendiente') {
        toast({ title: 'Error', description: "Solo se pueden eliminar filas con estado 'pendiente'.", variant: 'destructive' });
        return;
      }
      const deleteResponse = await fetch(`/api/daily-report/daily-report-row`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        throw new Error(`Error al eliminar la fila: ${errorText}`);
      }
      setDailyReport(dailyReport.filter((item) => item.id !== id));
      toast({ title: 'Éxito', description: 'Fila eliminada correctamente.' });
    } catch (error) {
      console.error('Error al eliminar la fila:', error);
      toast({ title: 'Error', description: `Hubo un problema al eliminar la fila: ${error instanceof Error ? error.message : 'Unknown error'}`, variant: 'destructive' });
    }
  };

  const handleWorkingDayChange = (value: string) => {
    setWorkingDay(value);
  };

  const formatTime = (time: string): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
  };

  const saveDailyReport = async (data: any) => {
    try {
      const formattedStartTime = formatTime(data.start_time);
      const formattedEndTime = formatTime(data.end_time);
      const existingRows = Array.isArray(dailyReport) ? dailyReport : [];
      const isDuplicate = existingRows.some(
        (row) =>
          row.customer === data.customer && row.services === data.services && row.item === data.item &&
          row.working_day === data.working_day && row.start_time === formattedStartTime &&
          row.end_time === formattedEndTime && row.description === data.description && row.status === data.status &&
          JSON.stringify(row.employees) === JSON.stringify(data.employees) &&
          JSON.stringify(row.equipment) === JSON.stringify(data.equipment)
      );
      if (isDuplicate) {
        toast({ title: 'Error', description: 'Ya existe una fila con los mismos datos.', variant: 'destructive' });
        return;
      }

      const rowResponse = await fetch('/api/daily-report/daily-report-row', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daily_report_id: reportData?.id, customer_id: data.customer, service_id: data.services,
          item_id: data.item, start_time: formattedStartTime, end_time: formattedEndTime,
          description: data.description, status: data.status,
        }),
      });
      if (!rowResponse.ok) {
        const errorText = await rowResponse.text();
        throw new Error(`Error al insertar la fila en dailyreportrow: ${errorText}`);
      }
      const { data: rowData } = await rowResponse.json();
      const rowId = rowData[0].id;

      if (data.employees && data.employees.length > 0) {
        await fetch('/api/daily-report/dailyreportemployeerelations', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data.employees.map((employee_id: string) => ({ daily_report_row_id: rowId, employee_id }))),
        });
      }
      if (data.equipment && data.equipment.length > 0) {
        await fetch('/api/daily-report/dailyreportequipmentrelations', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data.equipment.map((equipment_id: string) => ({ daily_report_row_id: rowId, equipment_id }))),
        });
      }

      setDailyReport((prevReport) => {
        if (!Array.isArray(prevReport)) prevReport = [];
        return [...prevReport, {
          id: rowId, date: reportData?.date || '', working_day: data.working_day,
          customer: data.customer, employees: data.employees, equipment: data.equipment,
          services: data.services, item: data.item, start_time: formattedStartTime,
          end_time: formattedEndTime, status: data.status, description: data.description,
          document_path: data.document_path,
        }];
      });
      resetForm();
      toast({ title: 'Éxito', description: 'Fila agregada correctamente al parte diario.' });
    } catch (error) {
      console.error('Error al procesar el parte diario:', error);
      toast({ title: 'Error', description: `Hubo un problema al procesar el parte diario: ${error instanceof Error ? error.message : 'Unknown error'}`, variant: 'destructive' });
    }
  };

  const updateDailyReport = async (data: any, rowId: string) => {
    try {
      if (data.working_day === 'jornada 8 horas' || data.working_day === 'jornada 12 horas') {
        data.start_time = ''; data.end_time = '';
      }
      const formattedStartTime = formatTime(data.start_time);
      const formattedEndTime = formatTime(data.end_time);

      const rowResponse = await fetch(`/api/daily-report/daily-report-row?id=${rowId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daily_report_id: existingReportId, customer_id: data.customer, service_id: data.services,
          item_id: data.item, working_day: data.working_day, start_time: formattedStartTime,
          end_time: formattedEndTime, description: data.description, status: data.status,
        }),
      });
      if (!rowResponse.ok) {
        const errorText = await rowResponse.text();
        throw new Error(`Error al actualizar la fila en dailyreportrow: ${errorText}`);
      }

      const employeeRelationsResponse = await fetch(`/api/daily-report/dailyreportemployeerelations?row_id=${rowId}`);
      if (!employeeRelationsResponse.ok) throw new Error(await employeeRelationsResponse.text());
      const employeeRelationsData = await employeeRelationsResponse.json();
      const currentEmployees = employeeRelationsData.dailyreportemployeerelations.map((rel: any) => ({ id: rel.id, employee_id: rel.employee_id }));

      const equipmentRelationsResponse = await fetch(`/api/daily-report/dailyreportequipmentrelations?row_id=${rowId}`);
      if (!equipmentRelationsResponse.ok) throw new Error(await equipmentRelationsResponse.text());
      const equipmentRelationsData = await equipmentRelationsResponse.json();
      const currentEquipment = equipmentRelationsData.dailyreportequipmentrelations.map((rel: any) => ({ id: rel.id, equipment_id: rel.equipment_id }));

      const employeesToRemove = currentEmployees.filter((rel: any) => !data.employees?.includes(rel.employee_id));
      const equipmentToRemove = currentEquipment.filter((rel: any) => !data.equipment?.includes(rel.equipment_id));

      if (employeesToRemove.length > 0) {
        await fetch('/api/daily-report/dailyreportemployeerelations', {
          method: 'DELETE', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ daily_report_row_id: rowId, employees: employeesToRemove.map((rel: any) => ({ id: rel.id, employee_id: rel.employee_id })) }),
        });
      }
      if (equipmentToRemove.length > 0) {
        await fetch('/api/daily-report/dailyreportequipmentrelations', {
          method: 'DELETE', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ daily_report_row_id: rowId, equipment: equipmentToRemove.map((rel: any) => ({ id: rel.id, equipment_id: rel.equipment_id })) }),
        });
      }

      const existingRelationEmployeeResponse = await fetch(`/api/daily-report/dailyreportemployeerelations/check-employee`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowId, employees: data.employees }),
      });
      const existingEmployee = await existingRelationEmployeeResponse.json();

      if (data.employees && !existingEmployee.exists && data.employees.length > 0) {
        await fetch('/api/daily-report/dailyreportemployeerelations', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data.employees.map((employee_id: string) => ({ daily_report_row_id: rowId, employee_id }))),
        });
      }

      const existingRelationEquipmentResponse = await fetch(`/api/daily-report/dailyreportequipmentrelations/check-equipment`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowId, equipment: data.equipment }),
      });
      const existingEquipment = await existingRelationEquipmentResponse.json();

      if (data.equipment && !existingEquipment.exists && data.equipment.length > 0) {
        await fetch('/api/daily-report/dailyreportequipmentrelations', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data.equipment.map((equipment_id: string) => ({ daily_report_row_id: rowId, equipment_id }))),
        });
      }

      setDailyReport((prevReport) =>
        prevReport.map((report) =>
          report.id === rowId ? {
            ...report, customer: data.customer, employees: data.employees, equipment: data.equipment,
            services: data.services, item: data.item, working_day: data.working_day,
            start_time: formattedStartTime, end_time: formattedEndTime, status: data.status,
            description: data.description, document_path: data.document_path,
          } : report
        )
      );
      toast({ title: 'Éxito', description: 'Fila actualizada correctamente en el parte diario.' });
    } catch (error) {
      console.error('Error al actualizar el parte diario:', error);
      toast({ title: 'Error', description: `Hubo un problema al actualizar el parte diario: ${error instanceof Error ? error.message : 'Unknown error'}`, variant: 'destructive' });
    }
  };

  const reprogramarReporte = async (data: any, rowId: string, newDailyReportId: string) => {
    try {
      const formattedStartTime = formatTime(data.start_time);
      const formattedEndTime = formatTime(data.end_time);

      const newRowResponse = await fetch(`/api/daily-report/daily-report-row`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daily_report_id: newDailyReportId, customer_id: data.customer, service_id: data.services,
          item_id: data.item, working_day: data.working_day, start_time: formattedStartTime,
          end_time: formattedEndTime, description: `Reprogramado desde ${data.date}`, status: 'pendiente',
        }),
      });
      if (!newRowResponse.ok) throw new Error(await newRowResponse.text());
      const { data: newRowData } = await newRowResponse.json();
      const newRowId = newRowData.id;

      await fetch(`/api/daily-report/daily-report-row?id=${rowId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'reprogramado', description: `Reprogramado a ${data.date}` }),
      });

      const empRelResponse = await fetch(`/api/daily-report/dailyreportemployeerelations?row_id=${rowId}`);
      const empRelData = await empRelResponse.json();
      const currentEmps = empRelData.dailyreportemployeerelations.map((rel: any) => ({ id: rel.id, employee_id: rel.employee_id }));

      const eqRelResponse = await fetch(`/api/daily-report/dailyreportequipmentrelations?row_id=${rowId}`);
      const eqRelData = await eqRelResponse.json();
      const currentEqs = eqRelData.dailyreportequipmentrelations.map((rel: any) => ({ id: rel.id, equipment_id: rel.equipment_id }));

      if (currentEmps.length > 0) {
        await fetch('/api/daily-report/dailyreportemployeerelations', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentEmps.map((e: any) => ({ daily_report_row_id: newRowId, employee_id: e.employee_id }))),
        });
      }
      if (currentEqs.length > 0) {
        await fetch('/api/daily-report/dailyreportequipmentrelations', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentEqs.map((e: any) => ({ daily_report_row_id: newRowId, equipment_id: e.equipment_id }))),
        });
      }

      setDailyReport((prevReport) =>
        prevReport.map((report) =>
          report.id === rowId ? { ...report, status: 'reprogramado', description: `Reprogramado a ${data.date}` } : report
        )
      );
      toast({ title: 'Éxito', description: 'Fila reprogramada correctamente al nuevo parte diario.' });
    } catch (error) {
      console.error('Error al reprogramar la fila al nuevo parte diario:', error);
      toast({ title: 'Error', description: `Hubo un problema al reprogramar la fila al nuevo parte diario: ${error instanceof Error ? error.message : 'Unknown error'}`, variant: 'destructive' });
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

  const currentDate = new Date();
  const calculateDateDifference = (dateString: string) => {
    const reportDate = new Date(dateString);
    const timeDifference = currentDate.getTime() - reportDate.getTime();
    return timeDifference / (1000 * 3600 * 24);
  };
  const dayDifference = calculateDateDifference(reportData?.date || '');
  const canEdit = dayDifference <= 6;

  const handleValueChange = (value: string) => {
    if (value === 'reprogramado' && editingId) {
      const currentReport = dailyReport.find((report: DailyReportItem) => report.id === editingId);
      if (currentReport) {
        const future = allReport?.filter((report) => isAfter(new Date(report.date), new Date(currentReport?.date)));
        setFutureReports(future as any);
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

  return {
    // State
    companyName, employees, customers, selectedCustomer, customerEmployees,
    startTime, setStartTime, endTime, setEndTime, equipment, customerEquipment,
    services, customerServices, selectedService, items, customerItems,
    dailyReport, isMultipleEmployeesAllowed, editingId, reportStatus,
    isEditing, setIsEditing, confirmDelete, setConfirmDelete, selectRow,
    workingDay, setWorkingDay, diagram, date, existingReportId,
    isDialogOpen, futureReports, selectedReport, documentUrl, selectedDate,
    setSelectedDate, companyData, filaId, filteredRow, isLoading,
    isDialogOpen2, formMethods, handleSubmit, control, setValue, watch, reset,
    canEdit,
    // Handlers
    handleSelectCustomer, handleSelectService, handleAddNewRow, resetForm,
    handleEdit, handleConfirmOpen, handleConfirmClose, handleDelete,
    handleWorkingDayChange, onSubmit, handleValueChange, handleCloseDialog,
    handleSaveToDailyReport, handleViewDocument, closeDialog2,
    // Data helpers
    createDataToDownload: (data: DailyReportItem[]) => {
      const { getCustomerName, getServiceName, getItemName, getEmployeeNames, getEquipmentNames } = require('./utils/utils');
      return data.map((report: DailyReportItem) => ({
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
    },
    reportData,
  };
}
'use client';

import React, { useState, useEffect } from 'react';
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '../ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from "@/lib/utils";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useForm, SubmitHandler, FormProvider } from 'react-hook-form';
import cookies from 'js-cookie';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from '../ui/input';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form";
import MultiSelect from './MultiSelect';
import { toast } from '@/components/ui/use-toast';

interface Customers {
    id: string;
    name: string;
    is_active: boolean;
}

interface Employee {
    id: string;
    firstname: string;
    lastname: string;
    allocated_to: string[];
    is_active: boolean;
}

interface Equipment {
    id: string;
    name: string;
    intern_number: number;
    allocated_to: string[];
    is_active: boolean;
}

interface Services {
    id: string;
    customer_id: string;
    service_name: string;
    is_active: boolean;
}

interface Items {
    id: string;
    item_name: string;
    customer_service_id: { id: string };
}

interface DailyReportItem {
    id: string;
    date: string;
    customer: string | undefined;
    employees: string[];
    equipment: string[];
    services: string;
    item: string;
    start_time: string;
    end_time: string;
}

export default function DailyReport() {
    const [date, setDate] = useState<Date>();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [customers, setCustomers] = useState<Customers[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customers | null>(null);
    const [customerEmployees, setCustomerEmployees] = useState<Employee[]>([]);
    const [startTime, setStartTime] = useState<string>("");
    const [endTime, setEndTime] = useState<string>("");
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [customerEquipment, setCustomerEquipment] = useState<Equipment[]>([]);
    const [services, setServices] = useState<Services[]>([]);
    const [customerServices, setCustomerServices] = useState<Services[]>([]);
    const [selectedService, setSelectedService] = useState<Services | null>(null);
    const [items, setItems] = useState<Items[]>([]);
    const [customerItems, setCustomerItems] = useState<Items[]>([]);
    const [dailyReport, setDailyReport] = useState<DailyReportItem[]>([]);
    const [isMultipleEmployeesAllowed, setIsMultipleEmployeesAllowed] = useState<boolean>(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const URL = process.env.NEXT_PUBLIC_BASE_URL;

    const formMethods = useForm<DailyReportItem>({
        defaultValues: {
            id: '',
            date: '',
            customer: undefined,
            employees: [],
            equipment: [],
            services: '',
            item: '',
            start_time: '',
            end_time: '',
        }
    });
    const { handleSubmit, control, setValue, watch, reset } = formMethods;

    const company_id = cookies.get('actualComp');
    console.log(company_id);
    const modifiedCompany = company_id?.replace(/['"]/g, '').trim();

    async function fetchEmployees() {
        const { employees } = await fetch(`${URL}/api/employees/?actual=${company_id}`).then((e) => e.json());
        setEmployees(employees);
        return employees;
    }

    async function fetchCustomers() {
        const { customers, error } = await fetch(`${URL}/api/company/customers/?actual=${company_id}`).then((e) => e.json());
        console.log(error);
        setCustomers(customers);
    }

    async function fetchEquipment() {
        try {
            const response = await fetch(`${URL}/api/equipment/?actual=${company_id}`);
            if (!response.ok) {
                throw new Error(`Error en la solicitud: ${response.statusText}`);
            }
            const data = await response.json();
            const equipment = data.equipments;
            setEquipment(equipment);
            return equipment;
        } catch (error) {
            console.error('Error fetching equipment:', error);
        }
    }

    async function fetchServices() {
        const { services } = await fetch(`${URL}/api/services?actual=${company_id}`).then((e) => e.json());
        setServices(services);
        return services;
    }

    async function fetchItems() {
        const { items } = await fetch(`${URL}/api/services/items/report?actual=${company_id}`).then((e) => e.json());
        setItems(items);
        return items;
    }

    useEffect(() => {
        fetchEmployees();
        fetchCustomers();
        fetchEquipment();
        fetchServices();
        fetchItems();
    }, []);

    useEffect(() => {
        if (startTime && endTime) {
            const start = new Date(`1970-01-01T${startTime}:00`);
            const end = new Date(`1970-01-01T${endTime}:00`);
            const diffInHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            console.log(diffInHours);
            setIsMultipleEmployeesAllowed(diffInHours > 12);
        }
    }, [startTime, endTime]);

    const handleSelectCustomer = (customerId: string) => {
        console.log(customerId);
        const customer = customers.find((c: Customers) => c.id.toString() === customerId);
        console.log(customer);
        if (customer) {
            setSelectedCustomer(customer);

            const filteredEmployees = employees.filter((employee: Employee) =>
                employee.allocated_to.includes(customer.id)
            );
            setCustomerEmployees(filteredEmployees);

            const filteredEquipment = equipment.filter((equipment: Equipment) =>
                equipment.allocated_to.includes(customer.id)
            );
            setCustomerEquipment(filteredEquipment);

            const filteredServices = services.filter((service: Services) =>
                service.customer_id === customerId
            );
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
        console.log(service);
        if (service) {
            setSelectedService(service);

            const filteredItems = items.filter((item: Items) =>
                item.customer_service_id.id === serviceId
            );
            setCustomerItems(filteredItems);
            console.log(filteredItems);

            // Reset dependent selects
            setValue('item', '');
        }
    };

    const handleAdd: SubmitHandler<DailyReportItem> = (data) => {
        console.log(data);
        const startDateTime = startTime ? new Date(`1970-01-01T${startTime}:00`) : undefined;
        const endDateTime = endTime ? new Date(`1970-01-01T${endTime}:00`) : undefined;
        const newReportItem: DailyReportItem = {
            id: editingId || Date.now().toString(),
            date: date ? format(date, "yyyy-MM-dd") : '',
            customer: selectedCustomer?.id,
            employees: data.employees,
            equipment: data.equipment,
            services: data.services,
            item: data.item,
            start_time: startDateTime?.toISOString() || '',
            end_time: endDateTime?.toISOString() || '',
        };

        if (editingId) {
            setDailyReport(dailyReport.map(item => item.id === editingId ? newReportItem : item));
            setEditingId(null);
        } else {
            setDailyReport([...dailyReport, newReportItem]);
        }

        resetForm();
    };

    const resetForm = () => {
        reset();
        setStartTime('');
        setEndTime('');
        setSelectedCustomer(null);
        setCustomerEmployees([]);
        setCustomerEquipment([]);
        setCustomerServices([]);
        setCustomerItems([]);
        setSelectedService(null);
        setDate(undefined);
    };

    const handleEdit = (id: string) => {
        const itemToEdit = dailyReport.find(item => item.id === id);
        if (itemToEdit) {
            setEditingId(id);
            setDate(new Date(itemToEdit.date));
            handleSelectCustomer(itemToEdit.customer || '');
            setValue('customer', itemToEdit.customer);
            setValue('employees', itemToEdit.employees);
            setValue('equipment', itemToEdit.equipment);
            setValue('services', itemToEdit.services);
            handleSelectService(itemToEdit.services);
            setValue('item', itemToEdit.item);
            setStartTime(new Date(itemToEdit.start_time).toTimeString().slice(0, 5));
            setEndTime(new Date(itemToEdit.end_time).toTimeString().slice(0, 5));
        }
    };

    const handleDelete = (id: string) => {
        setDailyReport(dailyReport.filter(item => item.id !== id));
    };

    const selectedEmployees = watch('employees');
    const selectedEquipment = watch('equipment');

    const getEmployeeNames = (employeeIds: string[]) => {
        return employeeIds.map(id => {
            const employee = employees.find(emp => emp.id === id);
            return employee ? `${employee.firstname} ${employee.lastname}` : 'Unknown';
        }).join(', ');
    };

    const getEquipmentNames = (equipmentIds: string[]) => {
        return equipmentIds.map(id => {
            const eq = equipment.find(e => e.id === id);
            return eq ? eq.intern_number.toString() : 'Unknown';
        }).join(', ');
    };

    const getServiceName = (serviceId: string) => {
        const service = services.find(s => s.id === serviceId);
        return service ? service.service_name : 'Unknown';
    };

    const getCustomerName = (customerId: string) => {
        const customer = customers.find(c => c.id === customerId);
        return customer ? customer.name : 'Unknown';
    };

    const getItemName = (itemId: string) => {
        const item = items.find(i => i.id === itemId);
        return item ? item.item_name : 'Unknown';
    };

    const saveDailyReport = async () => {
        if (!date) {
            toast({
                title: "Error",
                description: "Por favor, seleccione una fecha para el reporte diario.",
                variant: "destructive",
            });
            return;
        }

        try {
            const dailyReportResponse = await fetch(`${URL}/api/daily-report`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ date: format(date, "yyyy-MM-dd"), company_id: modifiedCompany }),
            });

            if (!dailyReportResponse.ok) {
                const errorText = await dailyReportResponse.text();
                throw new Error(`Error al guardar el reporte diario: ${errorText}`);
            }

            const dailyReportResult = await dailyReportResponse.json();
            const dailyReportId = dailyReportResult.data[0]?.id;
            console.log("dailyReportId", dailyReportId);

            for (const row of dailyReport) {
                const { customer, services, item, start_time, end_time, employees, equipment } = row;

                if (!customer || !services || !item || !start_time || !end_time) {
                    console.error("Campos obligatorios faltantes en la fila:", row);
                    continue;
                }

                const dailyReportRowResponse = await fetch(`${URL}/api/daily-report/daily-report-row`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        daily_report_id: dailyReportId,
                        customer_id: customer,
                        service_id: services,
                        item_id: item,
                        start_time,
                        end_time,
                    }),
                });

                if (!dailyReportRowResponse.ok) {
                    const errorText = await dailyReportRowResponse.text();
                    throw new Error(`Error al guardar la fila del reporte diario: ${errorText}`);
                }

                const dailyReportRow = await dailyReportRowResponse.json();
                const dailyReportRowId = dailyReportRow.data[0]?.id;
                console.log("dailyReportRowId", dailyReportRowId);

                for (const employee_id of employees) {
                    const employeeRelationResponse = await fetch(`${URL}/api/daily-report/dailyreportemployeerelations`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            daily_report_row_id: dailyReportRowId,
                            employee_id,
                        }),
                    });

                    if (!employeeRelationResponse.ok) {
                        const errorText = await employeeRelationResponse.text();
                        throw new Error(`Error al guardar la relación con el empleado: ${errorText}`);
                    }
                }

                for (const equipment_id of equipment) {
                    const equipmentRelationResponse = await fetch(`${URL}/api/daily-report/dailyreportequipmentrelations`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            daily_report_row_id: dailyReportRowId,
                            equipment_id,
                        }),
                    });

                    if (!equipmentRelationResponse.ok) {
                        const errorText = await equipmentRelationResponse.text();
                        throw new Error(`Error al guardar la relación con el equipo: ${errorText}`);
                    }
                }
            }

            console.log("Datos guardados exitosamente");
            toast({
                title: "Éxito",
                description: "El reporte diario se ha guardado correctamente.",
            });
        } catch (error) {
            console.error("Error al guardar los datos:", error);
            toast({
                title: "Error",
                description: "Hubo un problema al guardar el reporte diario. Por favor, intente de nuevo.",
                variant: "destructive",
            });
        }
    };

    return (
        <div>
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel>
                    <h1>DailyReport</h1>
                    <FormProvider {...formMethods}>
                        <Form {...formMethods}>
                            <form onSubmit={handleSubmit(handleAdd)} className="space-y-6">
                                <div>
                                    <FormField
                                        control={control}
                                        name='date'
                                        render={({ field }) => (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-[240px] justify-start text-left font-normal",
                                                            !date && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {date ? format(date, "dd/MM/yyyy") : <span>Seleccione una fecha</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={date}
                                                        onSelect={(newDate) => {
                                                            setDate(newDate);
                                                            field.onChange(newDate ? format(newDate, "yyyy-MM-dd") : '');
                                                        }}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        )}
                                    />
                                </div>
                                <div>
                                    <FormField
                                        control={control}
                                        name='customer'
                                        render={({ field }) => (
                                            <Select
                                                value={field.value}
                                                onValueChange={(value) => {
                                                    field.onChange(value);
                                                    handleSelectCustomer(value);
                                                }}
                                            >
                                                <SelectTrigger className="w-[250px]">
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
                                        )}
                                    />
                                </div>
                                <div>
                                    <FormField
                                        control={control}
                                        name='start_time'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Hora de inicio</FormLabel>
                                                <Input
                                                    type="time"
                                                    name="start_time"
                                                    className="w-[200px]"
                                                    value={startTime}
                                                    onChange={(e) => {
                                                        setStartTime(e.target.value);
                                                        field.onChange(e.target.value);
                                                    }}
                                                />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={control}
                                        name='end_time'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Hora de finalización</FormLabel>
                                                <Input
                                                    type="time"
                                                    name="end_time"
                                                    className="w-[200px]"
                                                    value={endTime}
                                                    onChange={(e) => {
                                                        setEndTime(e.target.value);
                                                        field.onChange(e.target.value);
                                                    }}
                                                />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div>
                                    <FormField
                                        control={control}
                                        name='employees'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Empleados</FormLabel>
                                                <MultiSelect
                                                    multiEmp={customerEmployees.map((employee: Employee) => ({
                                                        id: employee.id,
                                                        name: `${employee.firstname} ${employee.lastname}`
                                                    }))}
                                                    placeholder="Seleccione empleados"
                                                    selectedItems={field.value}
                                                    onChange={(selected: any) => field.onChange(selected)}
                                                />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div>
                                    <FormField
                                        control={control}
                                        name='equipment'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Equipos</FormLabel>
                                                <MultiSelect
                                                    multiEmp={customerEquipment.map((eq: Equipment) => ({
                                                        id: eq.id,
                                                        intern_number: eq.intern_number.toString()
                                                    }))}
                                                    placeholder="Seleccione equipos"
                                                    selectedItems={field.value}
                                                    onChange={(selected: any) => field.onChange(selected)}
                                                />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div>
                                    <FormField
                                        control={control}
                                        name='services'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Servicios</FormLabel>
                                                <Select
                                                    value={field.value}
                                                    onValueChange={(value) => {
                                                        field.onChange(value);
                                                        handleSelectService(value);
                                                    }}
                                                >
                                                    <SelectTrigger className="w-[250px]">
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
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div>
                                    <FormField
                                        control={control}
                                        name='item'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Items</FormLabel>
                                                <Select
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                >
                                                    <SelectTrigger className="w-[250px]">
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
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button type="submit">{editingId ? 'Editar' : 'Agregar'}</Button>
                            </form>
                        </Form>
                    </FormProvider>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel>
                    <div className="ml-6">
                        <span>AQUI SE IRA VIENDO EL PARTE DIARIO QUE SE ESTÁ ARMANDO</span>
                        <Table>
                            <TableCaption>
                                Parte diario del día: {date ? format(date, "dd/MM/yyyy") : 'Fecha no seleccionada'}
                            </TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Servicio</TableHead>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Empleados</TableHead>
                                    <TableHead>Equipos</TableHead>
                                    <TableHead>Hora de Inicio</TableHead>
                                    <TableHead>Hora de Finalización</TableHead>
                                    <TableHead>Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dailyReport.map((report: DailyReportItem) => (
                                    <TableRow key={report.id}>
                                        <TableCell>{report.customer ? getCustomerName(report.customer) : 'N/A'}</TableCell>
                                        <TableCell>{report.services ? getServiceName(report.services) : 'N/A'}</TableCell>
                                        <TableCell>{report.item ? getItemName(report.item) : 'N/A'}</TableCell>
                                        <TableCell>{Array.isArray(report.employees) ? getEmployeeNames(report.employees) : 'N/A'}</TableCell>
                                        <TableCell>{Array.isArray(report.equipment) ? getEquipmentNames(report.equipment) : 'N/A'}</TableCell>
                                        <TableCell>{report.start_time ? new Date(report.start_time).toLocaleTimeString() : 'N/A'}</TableCell>
                                        <TableCell>{report.end_time ? new Date(report.end_time).toLocaleTimeString() : 'N/A'}</TableCell>
                                        <TableCell>
                                            <Button onClick={() => handleEdit(report.id)} className="mr-2">Editar</Button>
                                            <Button onClick={() => handleDelete(report.id)} variant="destructive">Eliminar</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <Button onClick={saveDailyReport} variant={'default'} className="mt-4">
                            Guardar Reporte Diario
                        </Button>
                        
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
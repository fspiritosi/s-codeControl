"use client";
import React from 'react'
import { useState, useEffect } from 'react'
import { CalendarIcon } from "@radix-ui/react-icons"
import { differenceInHours, format, set } from "date-fns"

import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '../ui/button'
import { Calendar } from '@/components/ui/calendar'
import { cn } from "@/lib/utils"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { useForm } from 'react-hook-form'
import cookies from 'js-cookie'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";


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
    description: string;
    serial_number: string;
    model: string;
    brand: string;
    status: string;
    company_id: string;
    created_at: string;
    updated_at: string;
    domain: string;
    intern_number: number;
    allocated_to: string[];
    is_active: boolean;
}
interface Services {
    id: string;
    customer_id: string;
    service_name: string;
    service_start: Date;
    service_validity: Date;
    company_id: string;
    is_active: boolean;
}
interface Items {
    id: string;
    service_id: string;
    item_name: string;
    item_description: string;
    item_price: number;
    company_id: string;
    is_active: boolean;
    customer_service_id: { id: string, customer_id: { id: string, name: string } };
}
interface DailyReportItem {
    date: Date | undefined;
    customer: Customers | null;
    employees: Employee[];
    equipment: Equipment[];
    services: Services[];
    items: Items[];
    start_time: Date | undefined;
    end_time: Date | undefined;
}
export default function DailyReport() {
    const [date, setDate] = useState<Date>()
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [customers, setCustomers] = useState<Customers[]>([]);
    const { control, formState: { errors } } = useForm();
    const [selectedCustomer, setSelectedCustomer] = useState<Customers | null>(null);
    const [customerEmployees, setCustomerEmployees] = useState<Employee[]>([]);
    const [startTime, setStartTime] = useState<string>("");
    const [endTime, setEndTime] = useState<string>("");
    const [equipment, setEquipment] = useState([]);
    const [customerEquipment, setCustomerEquipment] = useState<Equipment[]>([]);
    const [services, setServices] = useState([]);
    const [customerServices, setCustomerServices] = useState<Services[]>([]);
    const [selectedService, setSelectedService] = useState<Services | null>(null);
    const [items, setItems] = useState([]);
    const [customerItems, setCustomerItems] = useState<Items[]>([]);
    const [dailyReport, setDailyReport] = useState<DailyReportItem[]>([]);
    const [isMultipleEmployeesAllowed, setIsMultipleEmployeesAllowed] = useState<boolean>(false);
    const { handleSubmit, setValue } = useForm();


    const URL = process.env.NEXT_PUBLIC_BASE_URL;

    const form = useForm({
        defaultValues: {
            date: "",
            customer: "",
            employee: "",
            equipment: "",
            service: "",
            item: "",
            start_time: "",
            end_time: "",
        }
    })
    const company_id = cookies.get('actualComp');
    console.log(company_id)
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
        const { data: equipment } = await fetch(`${URL}/api/equipment/?actual=${company_id}`).then((e) => e.json());
        setEquipment(equipment);
        return equipment
    }
    async function fetchServices() {
        const { services } = await fetch(`${URL}/api/services?actual=${company_id}`).then((e) => e.json());
        setServices(services);
        return services
    }

    async function fetchItems() {
        const { items } = await fetch(`${URL}/api/services/items/report?actual=${company_id}`).then((e) => e.json());
        setItems(items);
        return items
    }



    useEffect(() => {
        fetchEmployees();
        fetchCustomers();
        fetchEquipment();
        fetchServices();
        fetchItems();
    }, [])

    useEffect(() => {
        if (startTime && endTime) {
            const start = new Date(`1970-01-01T${startTime}:00`);
            const end = new Date(`1970-01-01T${endTime}:00`);
            const diffInHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            console.log(diffInHours)

            setIsMultipleEmployeesAllowed(diffInHours > 12);
        }
    }, [startTime, endTime]);
    console.log(employees);
    console.log(customers);
    console.log(equipment)
    console.log(services)
    console.log(items)

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
                equipment.allocated_to?.includes(customer.id))
            setCustomerEquipment(filteredEquipment);
            const filteredServices = services.filter((service: Services) =>
                service.customer_id === customer.id)
            setCustomerServices(filteredServices)
            console.log(selectedService)

        }
    };

    const handleSelectService = (serviceId: string) => {
        console.log(serviceId);
        console.log(services)
        const service = services.find((s: Services) => s.id === serviceId);
        if (service) {
            setSelectedService(service);

            const filteredItems = items.filter((item: Items) =>

                item.customer_service_id.id === selectedService?.id)
            console.log(filteredItems)
            setCustomerItems(filteredItems)
        }
        console.log(selectedService)
    }
    console.log(selectedCustomer)
    console.log(customerEmployees)
    console.log(customerEquipment)
    console.log(customerServices)
    console.log(customerItems)

    const handleAdd = (data: DailyReportItem) => {
        const startDateTime = startTime ? new Date(`${format(data.start_time as Date, 'dd-MM-yyyy')}T${startTime}:00`) : undefined;
    const endDateTime = endTime ? new Date(`${format(data.end_time as Date, 'dd-MM-yyyy')}T${endTime}:00`) : undefined;
        const newReportItem: DailyReportItem = {
            date,
            customer: selectedCustomer,
            employees: customerEmployees, // aqui va el empleado seleccionado
            equipment: customerEquipment, // aqui va el equipo seleccionado
            services: customerServices, // aqui va el servicio seleccionado
            items: customerItems, // aqui va el item seleccionado
            start_time: startDateTime, // aqui va la hora de inicio
            end_time: endDateTime,// aqui va la hora de finalizacion
        };
        setDailyReport([...dailyReport, newReportItem]);
    }
    console.log(dailyReport)



    // contodos los datos de el formulario quiero ir armando un array de objetos que se llame dailyReport y que se vaya llenando con los datos que se van seleccionando 
    // cada vez que seleccione un grupo de datos quiero tener un boton agregar que me permita agregarlos al array de dailyReport y  cuando termine de seleccionar todos los datos
    // quiero tener un boton guardar que me permita guardar el array de dailyReport en la base de datos. como lo puedo hacer?

    return (
        <div>
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel>
                    <h1>DailyReport</h1>
                    <Form {...form} >
                        <form onSubmit={handleAdd} className="space-y-6">
                            <div>
                                <FormField
                                    control={form.control}
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
                                                    onSelect={setDate}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                />
                            </div>
                            <div>
                                <FormField
                                    control={form.control}
                                    name='customer'
                                    render={({ field }) => (
                                        < Select onValueChange={handleSelectCustomer}>
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
                                    control={form.control}
                                    name='start_time'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Hora de inicio</FormLabel>
                                            <Input
                                                type="time"
                                                name="start_time"
                                                className="w-[200px]"
                                                value={startTime}
                                                onChange={(e) => setStartTime(e.target.value)}
                                            />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name='end_time'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Hora de finalización</FormLabel>

                                            <Input
                                                type="time"
                                                name="end_time"
                                                className="w-[200px]"
                                                value={endTime}
                                                onChange={(e) => setEndTime(e.target.value)}
                                            />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div>
                                <FormField
                                    control={form.control}
                                    name='employee'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Empleados</FormLabel>
                                            <Select>
                                                <SelectTrigger className="w-[250px]">
                                                    <SelectValue placeholder="Seleccione un empleado" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        <SelectLabel>empleados</SelectLabel>
                                                        {customerEmployees?.map((employee: Employee) => (
                                                            <SelectItem key={employee.id} value={employee.id}>
                                                                {employee.firstname} {employee.lastname}
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
                                    control={form.control}
                                    name='equipment'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Equipos</FormLabel>
                                            <Select>
                                                <SelectTrigger className="w-[250px]">
                                                    <SelectValue placeholder="Seleccione un equipo" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        <SelectLabel>equipos</SelectLabel>
                                                        {customerEquipment?.map((equipment: Equipment) => (
                                                            <SelectItem key={equipment.id} value={equipment.id}>
                                                                {equipment.intern_number}
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
                                    control={form.control}
                                    name='service'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Servicios</FormLabel>
                                            <Select onValueChange={handleSelectService}>
                                                <SelectTrigger className="w-[250px]">
                                                    <SelectValue placeholder="Seleccione el servicio" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        <SelectLabel>servicios</SelectLabel>
                                                        {customerServices?.map((services: Services) => (
                                                            <SelectItem key={services.id} value={services.id}>
                                                                {services.service_name}
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
                                    control={form.control}
                                    name='item'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Items</FormLabel>
                                            <Select>
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
                            <Button type="button" onClick={handleAdd}>Agregar</Button>
                        </form>
                    </Form>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel >
                    <div className="ml-6">
                        <span>AQUI SE IRA VIENDO EL PARTE DIARIO QUE SE ESTÁ ARMANDO</span>
                        <Table>
                            <TableCaption>Parte diario del día</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">Fecha</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Servicio</TableHead>
                                    <TableHead>Empleados</TableHead>
                                    <TableHead>Equipos</TableHead>
                                    <TableHead>Hora de Inicio</TableHead>
                                    <TableHead>Hora de Finalización</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dailyReport.map((report: DailyReportItem, index: number) => (
                                    <TableRow key={index}>
                                        <TableCell>{report.date ? format(report.date, "dd/MM/yyyy") : null}</TableCell>
                                        <TableCell>{report.customer?.name || null}</TableCell>
                                        <TableCell>{report.services.map(service => service.service_name).join(", ") || null}</TableCell>
                                        <TableCell>{report.employees.map(employee => `${employee.firstname} ${employee.lastname}`).join(", ") || null}</TableCell>
                                        <TableCell>{report.equipment.map(equipment => equipment.name).join(", ") || null}</TableCell>
                                        <TableCell>{report.start_time ? report.start_time.toString() : null}</TableCell>
                                        <TableCell>{report.end_time ? report.end_time.toString() : null}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    )
}

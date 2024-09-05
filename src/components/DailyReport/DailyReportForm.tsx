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
import { useForm, FormProvider } from 'react-hook-form';
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
interface DailyReportFormProps {
    selectedDate: Date | null;
    row: {
        id: number;
        fecha: string;
        cliente: string;
        servicio: string;
        item: string;
        empleados: string;
        equipos: string;
        horaInicio: string;
        horaFin: string;
    };
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export default function DailyReportForm({ selectedDate }: DailyReportFormProps) {
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

    const handleAdd = () => {

        const newReportItem: DailyReportItem = {
            date,
            customer: selectedCustomer,
            employees: customerEmployees, // aqui va el empleado seleccionado
            equipment: customerEquipment, // aqui va el equipo seleccionado
            services: customerServices, // aqui va el servicio seleccionado
            items: customerItems, // aqui va el item seleccionado
            start_time: new Date(`1970-01-01T${startTime}:00`),
            end_time: new Date(`1970-01-01T${endTime}:00`),
        };
        setDailyReport([...dailyReport, newReportItem]);
    }
    console.log(dailyReport)

    const handleCustomerChange = (value: any) => {
        setSelectedCustomer(value);
    };

    const formattedDate = selectedDate?.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

    // contodos los datos de el formulario quiero ir armando un array de objetos que se llame dailyReport y que se vaya llenando con los datos que se van seleccionando 
    // cada vez que seleccione un grupo de datos quiero tener un boton agregar que me permita agregarlos al array de dailyReport y  cuando termine de seleccionar todos los datos
    // quiero tener un boton guardar que me permita guardar el array de dailyReport en la base de datos. como lo puedo hacer?
    


    return (


        <FormProvider {...form}>
            <TableRow className='w-full border-collapse border'>
                <TableCell className="border  text-center min-w-[150px] max-w-[150px]">
                    {formattedDate}
                </TableCell>
                <TableCell className="border  text-center min-w-[150px] max-w-[150px]">
                    <FormField
                        control={form.control}
                        name='customer'
                        render={({ field }) => (
                            <Select onValueChange={(value) => {
                                field.onChange(value);
                                handleSelectCustomer(value);
                            }}>
                                <SelectTrigger className=" w-[150px]">
                                    <SelectValue placeholder="cliente" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {customers?.map((customer) => (
                                            <SelectItem key={customer.id} value={customer.id}>
                                                {customer.name}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        )}
                    />
                </TableCell>
                <TableCell className="border  text-center min-w-[150px] max-w-[150px]">
                    <FormField
                        control={form.control}
                        name='service'
                        render={({ field }) => (
                            <Select onValueChange={(value) => {
                                field.onChange(value);
                                handleSelectService(value);
                            }}>

                                <SelectTrigger className=" w-[150px]">
                                    <SelectValue placeholder="servicio" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>servicios</SelectLabel>
                                        {customerServices?.map((service) => (
                                            <SelectItem key={service.id} value={service.id}>
                                                {service.service_name}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        )}
                    />
                </TableCell>
                <TableCell className="border text-center min-w-[150px] max-w-[150px]">
                    <FormField
                        control={form.control}
                        name='item'
                        render={({ field }) => (
                            <FormItem>

                                <Select>
                                    <SelectTrigger className=" w-[150px]">
                                        <SelectValue placeholder="item" />
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
                </TableCell>
                <TableCell className="border text-center min-w-[150px] max-w-[150px]">
                    <FormField
                        control={form.control}
                        name='employee'
                        render={({ field }) => (
                            <Select onValueChange={field.onChange}>
                                <SelectTrigger className=" w-[150px]">
                                    <SelectValue placeholder="empleado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>empleados</SelectLabel>
                                        {customerEmployees?.map((employee) => (
                                            <SelectItem key={employee.id} value={employee.id}>
                                                {employee.firstname} {employee.lastname}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        )}
                    />
                </TableCell>
                <TableCell className="border  text-center min-w-[150px] max-w-[150px]">
                    <FormField
                        control={form.control}
                        name='equipment'
                        render={({ field }) => (
                            <Select onValueChange={field.onChange}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="equipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>equipos</SelectLabel>
                                        {customerEquipment?.map((equipment) => (
                                            <SelectItem key={equipment.id} value={equipment.id}>
                                                {equipment.intern_number}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        )}
                    />
                </TableCell>
                <TableCell className="border  text-center min-w-[150px] max-w-[150px]">
                    <FormField
                        control={form.control}
                        name='start_time'
                        render={({ field }) => (
                            <Input
                                type="time"
                                name="start_time"
                                className=" w-[150px]"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                            />
                        )}
                    />
                </TableCell>
                <TableCell className="border  text-center min-w-[150px] max-w-[150px]">
                    <FormField
                        control={form.control}
                        name='end_time'
                        render={({ field }) => (
                            <Input
                                type="time"
                                name="end_time"
                                className=" w-[150px]"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                            />
                        )}
                    />
                </TableCell>
            </TableRow>
        </FormProvider>

    )
}

'use client'

import React, { useState, useEffect } from 'react'
import { CalendarIcon, PlusCircledIcon } from "@radix-ui/react-icons"
import { format, parse } from "date-fns"
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useForm, SubmitHandler, FormProvider } from 'react-hook-form'
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
import { Input } from '@/components/ui/input'
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
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form"
import MultiSelect from './MultiSelect'
import { toast } from '@/components/ui/use-toast'
import { Textarea } from "@/components/ui/textarea"
import { any } from 'zod'
import { Check, PencilIcon } from 'lucide-react';
import { FilePenLine } from 'lucide-react';
import { Trash2 } from 'lucide-react';
interface Customers {
    id: string
    name: string
    is_active: boolean
}

interface Employee {
    id: string
    firstname: string
    lastname: string
    allocated_to: string[]
    is_active: boolean
}

interface Equipment {
    id: string
    name: string
    intern_number: number
    allocated_to: string[]
    is_active: boolean
}

interface Services {
    id: string
    customer_id: string
    service_name: string
    is_active: boolean
}

interface Items {
    id: string
    item_name: string
    customer_service_id: { id: string }
}

interface DailyReportItem {
    id: string
    date: string
    customer: string | undefined
    employees: string[]
    equipment: string[]
    services: string
    item: string
    start_time: string
    end_time: string
    status: 'pendiente' | 'ejecutado' | 'cancelado' | 'reprogramado'
    description: string
}

interface DailyReportData {
    id: string
    date: string
    status: 'abierto' | 'cerrado'
    dailyreportrows: DailyReportItem[]
}

interface DailyReportProps {
    reportData?: DailyReportData
}

export default function DailyReport({ reportData }: DailyReportProps) {
    // const [date, setDate] = useState<Date | undefined>(reportData ? new Date(reportData.date) : undefined)
    const [employees, setEmployees] = useState<Employee[]>([])
    const [customers, setCustomers] = useState<Customers[]>([])
    const [selectedCustomer, setSelectedCustomer] = useState<Customers | null>(null)
    const [customerEmployees, setCustomerEmployees] = useState<Employee[]>([])
    const [startTime, setStartTime] = useState<string>("")
    const [endTime, setEndTime] = useState<string>("")
    const [equipment, setEquipment] = useState<Equipment[]>([])
    const [customerEquipment, setCustomerEquipment] = useState<Equipment[]>([])
    const [services, setServices] = useState<Services[]>([])
    const [customerServices, setCustomerServices] = useState<Services[]>([])
    const [selectedService, setSelectedService] = useState<Services | null>(null)
    const [items, setItems] = useState<Items[]>([])
    const [customerItems, setCustomerItems] = useState<Items[]>([])
    const [dailyReport, setDailyReport] = useState<DailyReportItem[]>(reportData?.dailyreportrows || [])
    const [isMultipleEmployeesAllowed, setIsMultipleEmployeesAllowed] = useState<boolean>(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [reportStatus, setReportStatus] = useState<'abierto' | 'cerrado'>(reportData?.status || 'abierto')
    const [isEditing, setIsEditing] = useState(false)

    const URL = process.env.NEXT_PUBLIC_BASE_URL
    const formMethods = useForm<DailyReportItem>({
        defaultValues: {
            // id: '',
            date: '',
            customer: undefined,
            employees: [],
            equipment: [],
            services: '',
            item: '',
            start_time: '',
            end_time: '',
            status: 'pendiente',
            description: '',
        }
    })
    const { handleSubmit, control, setValue, watch, reset } = formMethods
    const [date, setDate] = useState<Date | undefined>(() => {
        if (reportData && reportData.date) {
            return new Date(reportData.date);
        }
        return undefined;
    });

    useEffect(() => {
        if (reportData && reportData.date) {
            setDate(new Date(reportData.date));
        }
    }, [reportData]);
    const company_id = cookies.get('actualComp')
    const modifiedCompany = company_id?.replace(/['"]/g, '').trim()

    async function fetchEmployees() {
        const { employees } = await fetch(`${URL}/api/employees/?actual=${company_id}`).then((e) => e.json())
        setEmployees(employees)
        return employees
    }

    async function fetchCustomers() {
        const { customers, error } = await fetch(`${URL}/api/company/customers/?actual=${company_id}`).then((e) => e.json())
        console.log(error)
        setCustomers(customers)
    }

    async function fetchEquipment() {
        try {
            const response = await fetch(`${URL}/api/equipment/?actual=${company_id}`)
            if (!response.ok) {
                throw new Error(`Error en la solicitud: ${response.statusText}`)
            }
            const data = await response.json()
            const equipment = data.equipments
            setEquipment(equipment)
            return equipment
        } catch (error) {
            console.error('Error fetching equipment:', error)
        }
    }

    async function fetchServices() {
        const { services } = await fetch(`${URL}/api/services?actual=${company_id}`).then((e) => e.json())
        setServices(services)
        return services
    }

    async function fetchItems() {
        const { items } = await fetch(`${URL}/api/services/items/report?actual=${company_id}`).then((e) => e.json())
        setItems(items)
        return items
    }

    useEffect(() => {
        fetchEmployees()
        fetchCustomers()
        fetchEquipment()
        fetchServices()
        fetchItems()
    }, [])

    useEffect(() => {
        if (reportData) {
            setDate(new Date(reportData.date))
            setEditingId(reportData.id);
            setDailyReport(reportData.dailyreportrows.map(row => ({
                ...row,
                date: format(new Date(row.date), "yyyy-MM-dd"),
                daily_report_id: reportData.id
            })))
            setReportStatus(reportData.status)
        }
    }, [reportData])
    console.log(reportData)
    useEffect(() => {
        if (startTime && endTime) {
            const start = new Date(`1970-01-01T${startTime}:00`)
            const end = new Date(`1970-01-01T${endTime}:00`)
            const diffInHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
            setIsMultipleEmployeesAllowed(diffInHours > 12)
        }
    }, [startTime, endTime])

    const handleSelectCustomer = (customerId: string) => {
        const customer = customers.find((c: Customers) => c.id.toString() === customerId)
        if (customer) {
            setSelectedCustomer(customer)

            const filteredEmployees = employees.filter((employee: Employee) =>
                employee.allocated_to.includes(customer.id)
            )
            setCustomerEmployees(filteredEmployees)

            const filteredEquipment = equipment.filter((equipment: Equipment) =>
                equipment.allocated_to.includes(customer.id)
            )
            setCustomerEquipment(filteredEquipment)

            const filteredServices = services.filter((service: Services) =>
                service.customer_id === customerId
            )
            setCustomerServices(filteredServices)

            // Reset dependent selects
            setValue('services', '')
            setValue('item', '')
            setValue('employees', [])
            setValue('equipment', [])
            setCustomerItems([])
            setSelectedService(null)
        }
    }

    const handleSelectService = (serviceId: string) => {
        const service = services.find((s: Services) => s.id === serviceId)
        if (service) {
            setSelectedService(service)

            const filteredItems = items.filter((item: Items) =>
                item.customer_service_id.id === serviceId
            )
            setCustomerItems(filteredItems)

            // Reset dependent selects
            setValue('item', '')
        }
    }

    const handleAddNewRow = () => {
        // setEditingId(null)
        // resetForm()
        setIsEditing(true)
    }

    const handleAdd: SubmitHandler<DailyReportItem> = (data) => {
        const startDateTime = startTime ? new Date(`1970-01-01T${startTime}:00`) : undefined
        const endDateTime = endTime ? new Date(`1970-01-01T${endTime}:00`) : undefined
        const newReportItem: DailyReportItem = {
            id: editingId || '',
            date: date ? format(date, "yyyy-MM-dd") : '',
            customer: selectedCustomer?.id,
            employees: data.employees,
            equipment: data.equipment,
            // services: data.services,
            services: selectedService?.id || '',
            item: data.item,
            start_time: startDateTime ? format(startDateTime, "HH:mm:ss") : '',
            end_time: endDateTime ? format(endDateTime, "HH:mm:ss") : '',
            status: data.status,
            description: data.description,
        }

        if (editingId) {
            setDailyReport(dailyReport.map(item => item.id === editingId ? newReportItem : item))
        } else {
            setDailyReport([...dailyReport, newReportItem])
        }

        resetForm()
        setIsEditing(false)
    }

    const resetForm = () => {
        reset()
        setStartTime('')
        setEndTime('')
        setSelectedCustomer(null)
        setCustomerEmployees([])
        setCustomerEquipment([])
        setCustomerServices([])
        setCustomerItems([])
        setSelectedService(null)
        // setDate(undefined)
    }

    const handleEdit = (id: string) => {
        const itemToEdit = dailyReport.find(item => item.id === id)
        if (itemToEdit) {
            setEditingId(id)
            setDate(new Date(itemToEdit.date))
            handleSelectCustomer(itemToEdit.customer || '')
            setValue('customer', itemToEdit.customer)
            setValue('employees', itemToEdit.employees)
            setValue('equipment', itemToEdit.equipment)
            setValue('services', itemToEdit.services)
            handleSelectService(itemToEdit.services)
            setValue('item', itemToEdit.item)
            setStartTime(itemToEdit.start_time.slice(0, 5))
            setEndTime(itemToEdit.end_time.slice(0, 5))
            setValue('status', itemToEdit.status)
            setValue('description', itemToEdit.description)
            setIsEditing(true)
        }
    }

    const handleDelete = (id: string) => {
        setDailyReport(dailyReport.filter(item => item.id !== id))
    }

    const selectedEmployees = watch('employees')
    const selectedEquipment = watch('equipment')

    const getEmployeeNames = (employeeIds: string[]) => {
        return employeeIds.map(id => {
            const employee = employees.find(emp => emp.id === id)
            return employee ? `${employee.firstname} ${employee.lastname}` : 'Unknown'
        }).join(', ')
    }

    const getEquipmentNames = (equipmentIds: string[]) => {
        return equipmentIds.map(id => {
            const eq = equipment.find(e => e.id === id)
            return eq ? eq.intern_number.toString() : 'Unknown'
        }).join(', ')
    }

    const getServiceName = (serviceId: string) => {
        const service = services.find(s => s.id === serviceId)
        return service ? service.service_name : 'Unknown'
    }

    const getCustomerName = (customerId: string) => {
        const customer = customers.find(c => c.id === customerId)
        return customer ? customer.name : 'Unknown'
    }

    const getItemName = (itemId: string) => {
        const item = items.find(i => i.id === itemId)
        return item ? item.item_name : 'Unknown'
    }

    const formatTime = (time: string): string => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
    };

    // const saveDailyReport: SubmitHandler<DailyReportItem> = async (data) => {
    //     try {
    //         const {
    //             date,
    //             status,
    //             customer,
    //             services,
    //             item,
    //             start_time,
    //             end_time,
    //             employees,
    //             equipment,
    //             description,
    //         } = data;

    //         // Verificar que los datos se están obteniendo correctamente
    //         console.log('Form Data:', {
    //             date,
    //             status,
    //             customer,
    //             services,
    //             item,
    //             start_time,
    //             end_time,
    //             employees,
    //             equipment,
    //             description,
    //             company_id: modifiedCompany,
    //         });

    //         // Asegurarse de que todos los campos requeridos están presentes
    //         if (!status || !modifiedCompany) {
    //             throw new Error('Los campos status y company_id son requeridos.');
    //         }

    //         // Construir las filas (rows) para enviar al endpoint
    //         const rows = [{
    //             customer_id: customer,
    //             service_id: services,
    //             item_id: item,
    //             start_time,
    //             end_time,
    //             employees,
    //             equipment,
    //             description,
    //         }];

    //         // Extraer la fecha del objeto dailyReport cuando se está editando
    //         let requestBody: {
    //             status: boolean;
    //             company_id: string;
    //             rows: {
    //                 customer_id: string | undefined;
    //                 service_id: string;
    //                 item_id: string;
    //                 start_time: string;
    //                 end_time: string;
    //                 employees: string[];
    //                 equipment: string[];
    //                 description: string;
    //             }[];
    //             date?: string; // Propiedad opcional
    //         } = {
    //             status: true,
    //             company_id: modifiedCompany,
    //             rows,
    //         };

    //         // Incluir la fecha solo si no se está editando
    //         if (!editingId) {
    //             if (!date) {
    //                 throw new Error('El campo date es requerido.');
    //             }
    //             requestBody.date = date;
    //         } else {
    //             // Extraer la fecha del objeto dailyReport
    //             const existingReport = dailyReport.find(report => report.id === editingId);
    //             if (existingReport) {
    //                 requestBody.date = existingReport.date;
    //             } else {
    //                 throw new Error('No se encontró el parte diario existente.');
    //             }
    //         }

    //         console.log('Request Body:', requestBody);

    //         const rowResponse = await fetch('/api/daily-report/create-all', {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json",
    //             },
    //             body: JSON.stringify(requestBody),
    //         });

    //         if (!rowResponse.ok) {
    //             throw new Error("Error al guardar el parte diario.");
    //         }

    //         const responseData = await rowResponse.json();

    //         toast({
    //             title: "Éxito",
    //             description: "Parte diario guardado correctamente.",
    //         });

    //         // Limpiar el formulario
    //         reset();

    //         // Aquí no hacemos ninguna redirección

    //     } catch (error) {
    //         console.error("Error al guardar los datos:", error);
    //         toast({
    //             title: "Error",
    //             description: "Hubo un problema al guardar el parte diario. Intente nuevamente.",
    //             variant: "destructive",
    //         });
    //     }
    // };

















    // const updateDailyReport = async (dailyReport: any) => {
    //     try {
    //       // Asumimos que todas las filas tienen el mismo daily_report_id
    //       const daily_report_id = dailyReport[0].daily_report_id;

    //       const response = await fetch('/api/daily-report/update-all', {
    //         method: 'PUT',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify({ 
    //           rows: dailyReport,
    //           daily_report_id: daily_report_id
    //         })
    //       });

    //       const data = await response.json();

    //       if (response.ok) {
    //         console.log('Reporte diario actualizado exitosamente');
    //         toast({
    //           title: "Éxito",
    //           description: "El reporte diario se ha actualizado correctamente.",
    //         });
    //       } else {
    //         console.error('Error al actualizar el reporte diario:', data.error);
    //         toast({
    //           title: "Error",
    //           description: data.error || "Hubo un problema al actualizar el reporte diario.",
    //           variant: "destructive",
    //         });
    //       }
    //     } catch (error) {
    //       console.error('Error:', error);
    //       toast({
    //         title: "Error",
    //         description: "Ocurrió un error inesperado. Por favor, intente de nuevo.",
    //         variant: "destructive",
    //       });
    //     }
    //   };


    // const saveDailyReport = async (data: any) => {
    //     console.log(data);
    //     try {
    //         // Organizar los datos de las filas
    //         const formattedStartTime = formatTime(data.start_time);
    //         const formattedEndTime = formatTime(data.end_time);
    //         const rowsData = {
    //             customer_id: data.customer,
    //             service_id: data.services,
    //             item_id: data.item,
    //             start_time: formattedStartTime,
    //             end_time: formattedEndTime,
    //             employees: data.employees,
    //             equipment: data.equipment,
    //             description: data.description,
    //         };

    //         console.log(rowsData);
    //         const effectiveDate = date || reportData?.date;
    //         // Crear el cuerpo de la solicitud
    //         const requestBody = {
    //             date: effectiveDate, // Solo si estás creando
    //             company_id: company_id,
    //             status: true,
    //             editingId: data.editingId, // Incluir si estás editando
    //             rows: rowsData, // Las filas que deseas agregar
    //             employees: data.employees, // Los empleados seleccionados
    //             equipment: data.equipment, // El equipo seleccionado
    //         };
    //         console.log(requestBody);
    //         // Enviar la solicitud al backend
    //         const response = await fetch(`/api/daily-report/create-all`, {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json",
    //             },
    //             body: JSON.stringify(requestBody),
    //         });

    //         if (!response.ok) {
    //             throw new Error("Error al procesar el parte diario.");
    //         }

    //         const responseData = await response.json();

    //         toast({
    //             title: "Éxito",
    //             description: data.editingId
    //                 ? "Parte diario editado correctamente."
    //                 : "Parte diario creado correctamente.",
    //         });

    //         // Limpiar el formulario si es necesario
    //         resetForm();

    //     } catch (error) {
    //         console.error("Error al procesar el parte diario:", error);
    //         toast({
    //             title: "Error",
    //             description: "Hubo un problema al procesar el parte diario. Intente nuevamente.",
    //             variant: "destructive",
    //         });
    //     }
    // };

    const saveDailyReport = async (data: any) => {
        try {
            // Validation
            if (!date) {
                throw new Error("La fecha es requerida.");
            }
            if (!data.customer || !data.services || !data.item || !data.start_time || !data.end_time || !data.status) {
                throw new Error("Por favor, complete todos los campos obligatorios.");
            }

            const formattedStartTime = formatTime(data.start_time);
            const formattedEndTime = formatTime(data.end_time);

            let dailyReportId = editingId;

            if (!dailyReportId) {
                const dailyReportResponse = await fetch('/api/daily-report', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        date: format(date, "yyyy-MM-dd"),
                        company_id: company_id,
                        status: true,
                    }),
                });

                if (!dailyReportResponse.ok) {
                    const errorText = await dailyReportResponse.text();
                    throw new Error(`Error al crear el parte diario: ${errorText}`);
                }

                const { data: dailyReport } = await dailyReportResponse.json();
                dailyReportId = dailyReport[0].id;
                setEditingId(dailyReportId);
            }

            // Log the data being sent to the API
            console.log('Data being sent to API:', {
                daily_report_id: dailyReportId,
                customer_id: data.customer,
                service_id: data.services,
                item_id: data.item,
                start_time: formattedStartTime,
                end_time: formattedEndTime,
                description: data.description,
                status: data.status,
            });

            const rowResponse = await fetch('/api/daily-report/daily-report-row', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    daily_report_id: dailyReportId,
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

            if (data.employees && data.employees.length > 0) {
                await fetch('/api/daily-report/dailyreportemployeerelations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(
                        data.employees.map((employee_id: string) => ({
                            daily_report_row_id: rowData[0].id,
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
                            daily_report_row_id: rowData[0].id,
                            equipment_id: equipment_id,
                        }))
                    ),
                });
            }

            // Add the new row to the local state
            setDailyReport(prevReport => [...prevReport, {
                id: rowData[0].id,
                date: format(date, "yyyy-MM-dd"),
                customer: data.customer,
                employees: data.employees,
                equipment: data.equipment,
                services: data.services,
                item: data.item,
                start_time: formattedStartTime,
                end_time: formattedEndTime,
                status: data.status,
                description: data.description,
            }]);

            // Reset form fields except for the date
            resetForm();

            toast({
                title: "Éxito",
                description: "Fila agregada correctamente al parte diario.",
            });
            handleAdd(data)
        } catch (error) {
            console.error("Error al procesar el parte diario:", error);
            toast({
                title: "Error",
                description: `Hubo un problema al procesar el parte diario: ${error instanceof Error ? error.message : 'Unknown error'}`,
                variant: "destructive",
            });
        }
    };

    console.log(reportData)
    console.log(dailyReport);
    console.log(isEditing)
    console.log(date)
    console.log(editingId)
    return (
        <div className="container mx-auto p-4">
            <div className="relative w-full h-full overflow-hidden">
                <motion.div
                    className="flex w-full"
                    animate={{ height: "auto" }}
                    transition={{ duration: 0.3 }}
                >
                    <AnimatePresence>
                        {isEditing && (
                            <motion.div
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: "30%", opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="pr-4 overflow-hidden"
                            >
                                <h1 className="text-2xl font-bold mb-4">
                                    {editingId ? 'Editar Reporte Diario' : 'Agregar Nueva Fila'}
                                </h1>
                                <FormProvider {...formMethods}>
                                    <Form {...formMethods}>
                                        <form onSubmit={handleSubmit(saveDailyReport)} className="space-y-6">
                                            <FormField
                                                control={control}
                                                name='date'
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Fecha</FormLabel>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant={"outline"}
                                                                    className={cn(
                                                                        "w-full justify-start text-left font-normal",
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
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={control}
                                                name='customer'
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Cliente</FormLabel>
                                                        <Select
                                                            value={field.value}
                                                            onValueChange={(value) => {
                                                                field.onChange(value)
                                                                handleSelectCustomer(value)
                                                            }}
                                                        >
                                                            <SelectTrigger className="w-full">
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
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={control}
                                                name='start_time'
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Hora de inicio</FormLabel>
                                                        <Input
                                                            type="time"
                                                            name="start_time"
                                                            value={startTime}
                                                            onChange={(e) => {
                                                                setStartTime(e.target.value)
                                                                field.onChange(e.target.value)
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
                                                            value={endTime}
                                                            onChange={(e) => {
                                                                setEndTime(e.target.value)
                                                                field.onChange(e.target.value)
                                                            }}
                                                        />
                                                    </FormItem>
                                                )}
                                            />

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

                                            <FormField
                                                control={control}
                                                name='services'
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Servicios</FormLabel>
                                                        <Select
                                                            value={field.value}
                                                            onValueChange={(value) => {
                                                                field.onChange(value)
                                                                handleSelectService(value)
                                                            }}
                                                        >
                                                            <SelectTrigger className="w-full">
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
                                                            <SelectTrigger className="w-full">
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

                                            <FormField
                                                control={control}
                                                name='status'
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Estado</FormLabel>
                                                        <Select
                                                            value={field.value}
                                                            onValueChange={field.onChange}
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Seleccione un estado" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="ejecutado">Ejecutado</SelectItem>
                                                                <SelectItem value="cancelado">Cancelado</SelectItem>
                                                                <SelectItem value="reprogramado">Reprogramado</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={control}
                                                name='description'
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Descripción</FormLabel>
                                                        <Textarea
                                                            placeholder="Ingrese una breve descripción"
                                                            className="resize-none"
                                                            {...field}
                                                        />
                                                    </FormItem>
                                                )}
                                            />

                                            <Button type="submit" className="w-full">
                                                {editingId ? 'Guardar Cambios' : 'Agregar Fila'}
                                            </Button>
                                            <Button type="button" onClick={() => setIsEditing(false)} variant="outline" className="w-full">
                                                Cancelar
                                            </Button>
                                        </form>
                                    </Form>
                                </FormProvider>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <motion.div
                        animate={{ width: isEditing ? "70%" : "100%" }}
                        transition={{ duration: 0.3 }}
                        className="overflow-x-auto"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Parte Diario en Construcción</h2>
                            <Button onClick={handleAddNewRow} className="flex items-center">
                                <PlusCircledIcon className="mr-2 h-4 w-4" />
                                Agregar Fila
                            </Button>
                        </div>
                        <Table>
                            <TableCaption>

                            </TableCaption>
                            <TableHeader>
                                <TableRow>
                                    {/* <TableHead>Fecha</TableHead> */}
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Servicio</TableHead>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Empleados</TableHead>
                                    <TableHead>Equipos</TableHead>
                                    <TableHead>Hora de Inicio</TableHead>
                                    <TableHead>Hora de Finalización</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead>Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dailyReport.map((report: DailyReportItem) => (
                                    <TableRow key={report.id}>
                                        {/* <TableCell>{format(new Date(report.date), "dd/MM/yyyy")}</TableCell> */}
                                        <TableCell>{report.customer ? getCustomerName(report.customer) : 'N/A'}</TableCell>
                                        <TableCell>{report.services ? getServiceName(report.services) : 'N/A'}</TableCell>
                                        <TableCell>{report.item ? getItemName(report.item) : 'N/A'}</TableCell>
                                        <TableCell>{Array.isArray(report.employees) ? getEmployeeNames(report.employees) : 'N/A'}</TableCell>
                                        <TableCell>{Array.isArray(report.equipment) ? getEquipmentNames(report.equipment) : 'N/A'}</TableCell>
                                        <TableCell>{report.start_time}</TableCell>
                                        <TableCell>{report.end_time}</TableCell>
                                        <TableCell>{report.status}</TableCell>
                                        <TableCell>{report.description}</TableCell>
                                        <TableCell>
                                            <Button onClick={() => handleEdit(report.id)} className="mr-2">
                                                <FilePenLine className="h-4 w-4" />
                                            </Button>
                                            <Button onClick={() => handleDelete(report.id)} variant="destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </motion.div>
                </motion.div>
            </div>
            <div className="mt-6 flex justify-center space-x-4">
                <Select
                    value={reportStatus}
                    onValueChange={(value: 'abierto' | 'cerrado') => setReportStatus(value)}
                    disabled={reportStatus === 'cerrado'}
                >
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Estado del reporte" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="abierto">Abierto</SelectItem>
                        <SelectItem value="cerrado">Cerrado</SelectItem>
                    </SelectContent>
                </Select>
                {/* {reportData ? (
                    <Button 
                    onClick={async () => {
                        await updateDailyReport(dailyReport);
                    }} 
                        className="px-6 py-3 text-lg font-semibold"
                        disabled={dailyReport.length === 0 || !reportData?.id}
                    >
                        Actualizar Reporte Diario
                    </Button>
                ) : (
                    <Button 
                        onClick={saveDailyReport} 
                        className="px-6 py-3 text-lg font-semibold"
                        disabled={dailyReport.length === 0}
                    >
                        Guardar Reporte Diario
                    </Button>
                )} */}
            </div>
        </div>
    )
}
'use client'

import React, { useState, useEffect } from 'react'
import { CalendarIcon, PlusCircledIcon } from "@radix-ui/react-icons"
// import { format } from "date-fns"
// import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
// import { Calendar } from '@/components/ui/calendar'
// import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useForm, FormProvider } from 'react-hook-form'
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
import { FilePenLine, Trash2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { id } from 'date-fns/locale'

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
    // date: string
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
    status: boolean
    dailyreportrows: DailyReportItem[]
}

interface DailyReportProps {
    reportData?: DailyReportData | undefined
}

export default function DailyReport({ reportData }: DailyReportProps) {
    console.log('Report data:', reportData)
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
    const [reportStatus, setReportStatus] = useState<boolean>(reportData?.status || false)
    const [isEditing, setIsEditing] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [selectRow, setSelectRow] = useState<string | null>(null)
    const [date, setDate] = useState<Date | undefined>(() => {
        if (reportData && reportData.date) {
            return new Date(reportData.date);
        }
        return undefined;
    });
    const [existingReportId, setExistingReportId] = useState<string | null>(null)

    const URL = process.env.NEXT_PUBLIC_BASE_URL
    const formMethods = useForm<DailyReportItem>({
        defaultValues: {
            // date: '',
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
            setDailyReport(reportData.dailyreportrows?.map(row => ({
                ...row,
                // date: format(new Date(row.date), "yyyy-MM-dd"),
                daily_report_id: reportData.id
            })))
            setReportStatus(reportData.status)
            setExistingReportId(reportData.id)
        }
    }, [reportData])

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
        setEditingId(null)
        resetForm()
        setIsEditing(true)
    }

    const resetForm = () => {
        reset({
            customer: undefined,
            services: '',
            item: '',
            start_time: '',
            end_time: '',
            employees: [],
            equipment: [],
            status: 'pendiente',
            description: '',
        })
        setStartTime('')
        setEndTime('')
        setSelectedCustomer(null)
        setCustomerEmployees([])
        setCustomerEquipment([])
        setCustomerServices([])
        setCustomerItems([])
        setSelectedService(null)
    }
    console.log('Daily Report:', dailyReport)
    const handleEdit = (id: string) => {
        const itemToEdit = dailyReport.find(item => item.id === id)
        if (itemToEdit) {
            setEditingId(id)
            // setDate(new Date(itemToEdit.date))
            handleSelectCustomer(itemToEdit.customer || '')
            setValue('customer', itemToEdit.customer)
            setValue('employees', itemToEdit.employees)
            setValue('equipment', itemToEdit.equipment)
            setValue('services', itemToEdit.services)
            handleSelectService(itemToEdit.services)
            setValue('item', itemToEdit.item)
            setValue('start_time', itemToEdit.start_time.slice(0, 5))
            setValue('end_time', itemToEdit.end_time.slice(0, 5))
            setValue('status', itemToEdit.status)
            setValue('description', itemToEdit.description)
            setIsEditing(true)
        }
    }

    const handleConfirmOpen = (id: string) => {
        setSelectRow(id)

        setConfirmDelete(true)
    }

    const handleConfirmClose = () => {
        setConfirmDelete(false)
    }
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
            console.log('Row data:', rowData);
            const { dailyreportrows } = rowData;
            const row = dailyreportrows.find((item: any) => item.id === id);

            if (!row) {
                throw new Error('Fila no encontrada');
            }

            const { status } = row;

            if (status !== 'pendiente') {
                toast({
                    title: "Error",
                    description: "Solo se pueden eliminar filas con estado 'pendiente'.",
                    variant: "destructive",
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

            setDailyReport(dailyReport.filter(item => item.id !== id));

            toast({
                title: "Éxito",
                description: "Fila eliminada correctamente.",
            });
        } catch (error) {
            console.error("Error al eliminar la fila:", error);
            toast({
                title: "Error",
                description: `Hubo un problema al eliminar la fila: ${error instanceof Error ? error.message : 'Unknown error'}`,
                variant: "destructive",
            });
        }
    };

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



    const saveDailyReport = async (data: any) => {
        try {

            const formattedStartTime = formatTime(data.start_time);
            const formattedEndTime = formatTime(data.end_time);

            // Obtener el array de filas existentes
            const existingRows = dailyReport;
            console.log('Existing rows:', existingRows);
            // Verificar si ya existe una fila exactamente igual
            const isDuplicate = existingRows.some(row =>
                row.customer === data.customer &&
                row.services === data.services &&
                row.item === data.item &&
                row.start_time === formattedStartTime &&
                row.end_time === formattedEndTime &&
                row.description === data.description &&
                row.status === data.status &&
                JSON.stringify(row.employees) === JSON.stringify(data.employees) &&
                JSON.stringify(row.equipment) === JSON.stringify(data.equipment)
            );
            console.log('Is duplicate:', isDuplicate);
            if (isDuplicate) {
                toast({
                    title: "Error",
                    description: "Ya existe una fila con los mismos datos.",
                    variant: "destructive",
                });
                return; // Salir de la función si ya existe una fila igual
            }


            console.log(reportData)
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
            console.log('Row ID:', rowId);
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

            setDailyReport(prevReport => {
                // Verificar que prevReport sea un array
                if (!Array.isArray(prevReport)) {
                    prevReport = [];
                }

                return [...prevReport, {
                    id: rowId,
                    customer: data.customer,
                    employees: data.employees,
                    equipment: data.equipment,
                    services: data.services,
                    item: data.item,
                    start_time: formattedStartTime,
                    end_time: formattedEndTime,
                    status: data.status,
                    description: data.description,
                }];
            });

            resetForm();

            toast({
                title: "Éxito",
                description: "Fila agregada correctamente al parte diario.",
            });
        } catch (error) {
            console.error("Error al procesar el parte diario:", error);
            toast({
                title: "Error",
                description: `Hubo un problema al procesar el parte diario: ${error instanceof Error ? error.message : 'Unknown error'}`,
                variant: "destructive",
            });
        }
    };


    const updateDailyReport = async (data: any, rowId: string) => {
        console.log('Updating row:', rowId);
        console.log('Data:', data);
        try {
            const formattedStartTime = formatTime(data.start_time);
            const formattedEndTime = formatTime(data.end_time);
            console.log('Formatted start time:', formattedStartTime);
            console.log('Formatted end time:', formattedEndTime);


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
            console.log('employeeRelationsData:', employeeRelationsData);
            const currentEmployees = employeeRelationsData.dailyreportemployeerelations.map((rel: any) => ({
                id: rel.id,
                employee_id: rel.employee_id
            }));

            // Obtener relaciones actuales de equipos
            const equipmentRelationsResponse = await fetch(`/api/daily-report/dailyreportequipmentrelations?row_id=${rowId}`);
            if (!equipmentRelationsResponse.ok) {
                const errorText = await equipmentRelationsResponse.text();
                throw new Error(`Error al obtener relaciones de equipos: ${errorText}`);
            }
            const equipmentRelationsData = await equipmentRelationsResponse.json();
            console.log('equipmentRelationsData:', equipmentRelationsData);
            const currentEquipment = equipmentRelationsData.dailyreportequipmentrelations.map((rel: any) => ({
                id: rel.id,
                equipment_id: rel.equipment_id
            }));

            // Determinar relaciones a eliminar
            const employeesToRemove = currentEmployees.filter((rel: any) => !data.employees.includes(rel.employee_id));
            const equipmentToRemove = currentEquipment.filter((rel: any) => !data.equipment.includes(rel.equipment_id));

            console.log('employeesToRemove:', employeesToRemove);
            console.log('equipmentToRemove:', equipmentToRemove);

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

            const existingRelationEmployeeResponse = await fetch(`/api/daily-report/dailyreportemployeerelations/check-employee`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rowId: rowId,
                    employees: data.employees,
                }),
            });
            const existingEmployee = await existingRelationEmployeeResponse.json();

            // if (existingEmployee.exists) {
            //     toast({
            //         title: "Error",
            //         description: "Ya existe una relación entre esa fila y ese empleado.",
            //         variant: "destructive",
            //     });
            //     // return; // Salir de la función si ya existe una relación
            // }

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

            const existingRelationEquipmentResponse = await fetch(`/api/daily-report/dailyreportequipmentrelations/check-equipment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rowId: rowId,
                    equipment: data.equipment,
                }),
            });
            const existingEquipment = await existingRelationEquipmentResponse.json();

            // if (existingEquipment.exists) {
            //     toast({
            //         title: "Error",
            //         description: "Ya existe una relación entre esa fila y ese equipo.",
            //         variant: "destructive",
            //     });
            //     // return; // Salir de la función si ya existe una relación
            // }

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

            setDailyReport(prevReport => prevReport.map(report =>
                report.id === rowId ? {
                    ...report,
                    customer: data.customer,
                    employees: data.employees,
                    equipment: data.equipment,
                    services: data.services,
                    item: data.item,
                    start_time: formattedStartTime,
                    end_time: formattedEndTime,
                    status: data.status,
                    description: data.description,
                } : report
            ));

            toast({
                title: "Éxito",
                description: "Fila actualizada correctamente en el parte diario.",
            });
        } catch (error) {
            console.error("Error al actualizar el parte diario:", error);
            toast({
                title: "Error",
                description: `Hubo un problema al actualizar el parte diario: ${error instanceof Error ? error.message : 'Unknown error'}`,
                variant: "destructive",
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

    console.log(dailyReport)
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
                                    {editingId ? 'Editar Fila' : 'Agregar Nueva Fila'}
                                </h1>
                                <FormProvider {...formMethods}>
                                    <Form {...formMethods}>
                                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

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
                                                            value={startTime ? startTime : field.value}
                                                            onChange={(e) => {
                                                                setStartTime(e.target.value)
                                                                field.onChange(e.target.value)
                                                            }}
                                                            step={900}

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
                                                            value={field.value || endTime}
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
                                            <Button type="button" onClick={() => {
                                                setIsEditing(false)
                                                resetForm()
                                            }} variant="outline" className="w-full">
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
                                {dailyReport?.map((report: DailyReportItem) => {
                                    const dayDifference = calculateDateDifference(reportData?.date || '');
                                    console.log('Day difference:', dayDifference);
                                    const canEdit = dayDifference <= 2;

                                    return (
                                        <TableRow key={report.id}>
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
                                                {canEdit && (
                                                    <>
                                                        <Button onClick={() => handleEdit(report.id)} className="mr-2">
                                                            <FilePenLine className="h-4 w-4" />
                                                        </Button>
                                                        <Button onClick={() => handleConfirmOpen(report.id)} variant="destructive">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </motion.div>
                </motion.div>

            </div>
            {confirmDelete &&
                <div>
                    <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
                        <DialogContent className="max-w-[30vw] h-[30vh] flex flex-col">
                            <DialogTitle className="text-xl font-semibold mb-4">Confirmar Eliminación</DialogTitle>
                            <DialogDescription>
                                ¿Estás seguro de que deseas eliminar esta fila?
                            </DialogDescription>
                            <div className="flex justify-end mt-4">
                                <Button onClick={handleConfirmClose} className="mr-2">Cancelar</Button>
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
                        <DialogFooter>
                            <Button onClick={handleConfirmClose} variant="outline">
                                Cerrar
                            </Button>
                        </DialogFooter>
                    </Dialog>
                </div>
            }
        </div>

    )
}
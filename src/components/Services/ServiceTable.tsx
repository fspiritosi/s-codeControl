'use client';
import React, { useState, useEffect } from 'react';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Table, TableHead, TableRow, TableCell, TableBody } from '@/components/ui/table'; // Asegúrate de importar los componentes necesarios
import { Button } from '@/components/ui/button';
import EditModal from '@/components/EditModal';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabaseBrowser } from '@/lib/supabase/browser';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { z } from 'zod';
import { CalendarIcon } from "@radix-ui/react-icons"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

type Service = {
    id: string;
    service_name: string;
    customer_id: string;
    description: string;
    service_price: number;
    service_start: string;
    service_validity: string;
    is_active: true;
};

type Customer = {
    id: string;
    name: string;
};

type ServiceTableProps = {
    services: Service[];
    customers: Customer[];
};

const dateSchema = z.object({
    service_start: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: 'Fecha de inicio no válida',
    }),
    service_validity: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: 'Fecha de validez no válida',
    }),
}).refine((data) => new Date(data.service_start) < new Date(data.service_validity), {
    message: 'La fecha de inicio debe ser menor que la fecha de validez del servicio',
    path: ['service_validity'],
});

const ServiceTable = ({ services, customers }: ServiceTableProps) => {
    const supabase = supabaseBrowser();
    const [filteredServices, setFilteredServices] = useState<Service[]>(services);
    const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isActiveFilter, setIsActiveFilter] = useState(true);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedDate1, setSelectedDate1] = useState<Date | null>(null);
    const [date, setDate] = React.useState<Date>()
    const [date1, setDate1] = React.useState<Date>()
    
    useEffect(() => {
        filterServices();
    }, [selectedCustomer, isActiveFilter, services]);

    const filterServices = () => {
        let filtered = services;

        if (selectedCustomer !== 'all') {
            filtered = filtered.filter(service => service.customer_id.toString() === selectedCustomer);
        }

        filtered = filtered.filter(service => service.is_active === isActiveFilter);

        setFilteredServices(filtered);
    };
    const modified_editing_service_id = editingService?.id.toString().replace(/"/g, '');
    const handleEditClick = (service: Service) => {
        setEditingService(service);
        setIsModalOpen(true);
    };
    const closeModal = () => {
        setErrors({});
        setSelectedDate(null);
        setSelectedDate1(null);
        setIsModalOpen(false);
    };

    const handleSave = async () => {
        if (editingService) {
            
            try {
                dateSchema.parse({
                    // service_start: editingService.service_start,
                    service_start: editingService.service_start,
                    service_validity: editingService.service_validity,
                });

                setErrors({});

                const response = await fetch(`/api/services/?id=${modified_editing_service_id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(editingService),
                });

                if (response.ok) {
                    // Actualizar la lista de servicios con el servicio editado
                    const updatedService = await response.json();
                    setFilteredServices((prevServices) =>
                        prevServices.map((service) =>
                            service.id === updatedService.id ? updatedService : service
                        )
                    );
                    toast.success('Servicio actualizado correctamente');
                    setIsModalOpen(false);
                } else {
                    console.error('Error al actualizar el servicio');
                    toast.error('Error al actualizar el servicio');
                }
            } catch (e) {
                if (e instanceof z.ZodError) {
                    const newErrors: { [key: string]: string } = {};
                    e.errors.forEach(error => {
                        newErrors[error.path[0]] = error.message;
                    });
                    setErrors(newErrors);
                } else {
                    console.error('Error inesperado:', e);
                    toast.error('Error inesperado al actualizar el servicio');
                }
            }
        }
        setSelectedDate(null);
        setSelectedDate1(null);
    };
    const handleDeactivate = async () => {
        if (editingService) {
            try {
                const newActiveState = !editingService.is_active;
                const response = await fetch(`/api/services/?id=${modified_editing_service_id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ ...editingService, is_active: newActiveState }),
                });

                if (response.ok) {
                    // Actualizar la lista de servicios con el servicio desactivado
                    const updatedService = await response.json();
                    setFilteredServices((prevServices) =>
                        prevServices.map((service) =>
                            service.id === updatedService.id ? updatedService : service
                        )
                    );
                    toast.success(`Servicio ${newActiveState ? 'activado' : 'desactivado'} correctamente`);
                    setIsModalOpen(false);
                } else {
                    console.error('Error al desactivar el servicio');
                    toast.error('Error al desactivar el servicio');
                }
            } catch (error) {
                console.error('Error al desactivar el servicio:', error);
            }
        }
    };

    useEffect(() => {
        const channel = supabase.channel('custom-all-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'customer_services' },
                async (payload) => {

                    const { data, error } = await supabase.from('customer_services').select('*');
                    if (error) {
                        console.error('Error fetching services:', error);
                    } else {
                        setFilteredServices(data);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);
    return (
        <div>

            <div className="flex space-x-4">
                <Select onValueChange={(value) => setSelectedCustomer(value)} value={selectedCustomer} defaultValue='all'>
                    <SelectTrigger className="w-[400px]">
                        <SelectValue placeholder="Filtrar por cliente" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='all'>Todos los clientes</SelectItem>
                        {customers.map((customer: Customer) => (
                            <SelectItem value={String(customer.id)} key={customer.id}>{customer.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select onValueChange={(value) => setIsActiveFilter(value === 'true')} value={String(isActiveFilter)} defaultValue='true'>
                    <SelectTrigger className="w-[400px]">
                        <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='true'>Activos</SelectItem>
                        <SelectItem value='false'>Inactivos</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="overflow-x-auto">
                <Table className="min-w-full">
                    <TableHead>
                        <TableRow>
                            <TableCell>Nombre del Servicio</TableCell>
                            {/* <TableCell>Precio del Servicio</TableCell> */}
                            <TableCell>Estado</TableCell>
                            <TableCell>Inicio del Servicio</TableCell>
                            <TableCell>Validez del Servicio</TableCell>
                            <TableCell>Cliente</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>

                        <TableBody>
                            {filteredServices.map((service: Service) => (
                                <TableRow key={service.id}>
                                    <Link href={`/dashboard/company/actualCompany/services/${service.id}`}>
                                        <TableCell>{service.service_name}</TableCell>
                                    </Link>
                                    {/* <TableCell>${service.service_price}</TableCell> */}
                                    <TableCell>
                                        <Badge variant={service.is_active ? 'success' : 'default'}>
                                            {service.is_active ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{service.service_start?.toString()}</TableCell>
                                    <TableCell>{service.service_validity}</TableCell>
                                    <TableCell>{customers.find(customer => customer.id.toString() === service.customer_id?.toString())?.name}</TableCell>
                                    <TableCell>
                                        <Button onClick={() => handleEditClick(service)}>Editar</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </TableHead>
                </Table>
            </div>

            {isModalOpen && editingService && (
                <EditModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <h2 className="text-lg font-semibold">Editar Servicio</h2>
                    <div className="p-4 bg-gray-100 dark:bg-gray-800 text-black dark:text-white">
                        <label htmlFor="service_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Servicio</label>
                        <Input

                            value={editingService.service_name}
                            onChange={(e: any) => setEditingService({ ...editingService, service_name: e.target.value })}
                            className="w-full p-2 mb-2 border border-gray-300 dark:border-gray-700 rounded"
                        />

                        <label htmlFor="service_start" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Fecha de inicio del Servicio
                        </label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[240px] pl-3 text-left font-normal",
                                        !selectedDate && "text-muted-foreground"
                                    )}
                                >
                                    {editingService.service_start ? editingService.service_start : "Elegir fecha"}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate || date}
                                    onSelect={(date) => {
                                        setSelectedDate(date || null);
                                        const formattedDate = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                                        setEditingService({ ...editingService, service_start: formattedDate });
                                        
                                    }}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        {errors.service_start && <span className='text-red-600 text-xs'>{errors.service_start}</span>}
                        <label htmlFor="service_validity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Validez del precio del Servicio</label>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[240px] pl-3 text-left font-normal",
                                        !selectedDate1 && "text-muted-foreground"
                                    )}
                                >
                                    {editingService.service_validity ? editingService.service_validity : "Elegir fecha"}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate1 || date1}
                                    onSelect={(date1) => {
                                        setSelectedDate1(date || null);
                                        const formattedDate1 = date1 ? date1.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                                        setEditingService({ ...editingService, service_validity: formattedDate1 });
                                       
                                    }}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        {errors.service_validity && <span className='text-red-600 text-xs'>{errors.service_validity}</span>}
                        <label htmlFor="customer" className="block mt-4">Cliente</label>
                        <Select onValueChange={(value) =>
                            setEditingService({
                                ...editingService,
                                customer_id: value,
                            })
                        } value={String(editingService.customer_id)} defaultValue=''>
                            <SelectTrigger className="">
                                <SelectValue placeholder="Elegir cliente" />
                            </SelectTrigger>
                            <SelectContent>
                                {customers.map((customer: any) => (
                                    <SelectItem value={customer.id} key={customer.id}>{customer.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="flex justify-end space-x-2 mt-4">
                            <Button onClick={handleSave}   >Guardar</Button>
                            <Button onClick={closeModal} >Cancelar</Button>
                            <Button onClick={handleDeactivate} variant={editingService.is_active ? 'destructive' : 'success'}>
                                {editingService.is_active ? 'Dar de Baja' : 'Dar de Alta'}
                            </Button>
                        </div>
                    </div>
                </EditModal>
            )}
        </div>
    );
};

export default ServiceTable;
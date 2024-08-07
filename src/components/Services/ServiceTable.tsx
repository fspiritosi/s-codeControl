'use client';
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableHead, TableRow, TableCell, TableBody } from '@/components/ui/table'; // Asegúrate de importar los componentes necesarios
import { Button } from '@/components/ui/button';
import EditModal from '@/components/EditModal';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabaseBrowser } from '@/lib/supabase/browser';
import Link from 'next/link';


type Service = {
    id: number;
    service_name: string;
    customer_id: number;
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

const ServiceTable = ({ services, customers }: ServiceTableProps) => {
    const supabase = supabaseBrowser();
    const [filteredServices, setFilteredServices] = useState<Service[]>(services);
    const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isActiveFilter, setIsActiveFilter] = useState(true);


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

    const handleSave = async () => {
        if (editingService) {
            try {
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
            } catch (error) {
                console.error('Error al actualizar el servicio:', error);
            }
        }
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
                    console.log('Change received!', payload);
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
                                    <TableCell>{service.service_start}</TableCell>
                                    <TableCell>{service.service_validity}</TableCell>
                                    <TableCell>{customers.find(customer => customer.id.toString() === service.customer_id.toString())?.name}</TableCell>
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
                        {/* <label htmlFor="service_price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Precio del Servicio</label>
                        <Input
                            type="text"
                            value={editingService.service_price}
                            onChange={(e: any) => setEditingService({ ...editingService, service_price: e.target.value })}
                            className="w-full p-2 mb-2 border border-gray-300 dark:border-gray-700 rounded"
                        /> */}
                        <label htmlFor="service_start" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de inicio del Servicio</label>
                        <Input
                            type="text"
                            value={editingService.service_start}
                            onChange={(e: any) => setEditingService({ ...editingService, service_start: e.target.value })}
                            className="w-full p-2 mb-2 border border-gray-300 dark:border-gray-700 rounded"
                        />
                        <label htmlFor="service_validity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Validez del precio del Servicio</label>
                        <Input
                            type="text"
                            value={editingService.service_validity}
                            onChange={(e: any) => setEditingService({ ...editingService, service_validity: e.target.value })}
                            className="w-full p-2 mb-2 border border-gray-300 dark:border-gray-700 rounded"
                        />
                        <label htmlFor="customer" className="block mt-4">Cliente</label>
                        <select
                            id="customer"
                            value={editingService.customer_id}
                            onChange={(e) =>
                                setEditingService({
                                    ...editingService,
                                    customer_id: Number(e.target.value),
                                })
                            }
                            className="block w-full mt-2 p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
                        >
                            {customers.map((customer) => (
                                <option key={customer.id} value={customer.id}>
                                    {customer.name}
                                </option>
                            ))}
                        </select>
                        <div className="flex justify-end space-x-2 mt-4">
                            <Button onClick={handleSave}   >Guardar</Button>
                            <Button onClick={() => setIsModalOpen(false)} >Cancelar</Button>
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
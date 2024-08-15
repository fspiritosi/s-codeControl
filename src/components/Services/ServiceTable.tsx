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
import { supabaseBrowser } from '@/lib/supabase/browser';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { z } from 'zod';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import ServicesForm from './ServicesForm'

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
    company_id: string;
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

const ServiceTable = ({ services, customers, company_id }: ServiceTableProps) => {
    
    const supabase = supabaseBrowser();
    const URL = process.env.NEXT_PUBLIC_BASE_URL;
    const [servicesData, setServicesData] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
    const [filteredServices, setFilteredServices] = useState<Service[]>([]);
    const [isActiveFilter, setIsActiveFilter] = useState(true);

    const modified_company_id = company_id?.replace(/"/g, '');

    useEffect(() => {
        filterServices();
    }, [selectedCustomer, isActiveFilter, servicesData]);

    const filterServices = (servicesToFilter = servicesData) => {
        let filtered = servicesToFilter;

        if (selectedCustomer !== 'all') {
            filtered = filtered.filter(service => service.customer_id.toString() === selectedCustomer);
        }

        filtered = filtered.filter(service => service.is_active === isActiveFilter);

        setFilteredServices(filtered);
    };

    useEffect(() => {
        const fetchServices = async () => {
            try {
              
                const servicesResponse = await fetch(`${URL}/api/services?actual=${modified_company_id}`);

                if (!servicesResponse.ok) {
                    throw new Error('Error al obtener los servicios');
                }
                const responseData = await servicesResponse.json();
                const services = Array.isArray(responseData) ? responseData : responseData.services;
                setServicesData(services);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchServices();

        const channel = supabase.channel('custom-all-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'customer_services' },
                async (payload) => {
                    
                    fetchServices(); 
                }
            )
            .subscribe();

        
        return () => {
            supabase.removeChannel(channel);
        };
    }, []);
    return (
        <ResizablePanelGroup direction="horizontal">
            <ResizablePanel>
                <ServicesForm customers={customers as any} editingService={editingService as any} company_id={company_id} />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel>
                <div>

                    <div className="flex space-x-4">
                        <Select onValueChange={(value) => setSelectedCustomer(value)} value={selectedCustomer} defaultValue='all'>
                            <SelectTrigger className="w-[400px]">
                                <SelectValue placeholder="Filtrar por cliente" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='all'>Todos los clientes</SelectItem>
                                {customers.map((customer: any) => (
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

                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                        <Table className="min-w-full ">
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
                                            <TableCell>{customers.find(customer => customer.id.toString() === service.customer_id?.toString() as any)?.name}</TableCell>
                                            <TableCell>
                                                {/* <Button onClick={() => handleEditClick(service)}>Editar</Button> */}
                                                <Button
                                                    size={'sm'}
                                                    variant={'link'}
                                                    className="hover:text-blue-400"
                                                    onClick={() => setEditingService(service)}
                                                >
                                                    Editar
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </TableHead>
                        </Table>
                    </div>

                    
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>

    );
};

export default ServiceTable;
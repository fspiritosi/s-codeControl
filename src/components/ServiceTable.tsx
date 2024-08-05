'use client';
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableHead, TableRow, TableCell, TableBody } from '@/components/ui/table'; // Asegúrate de importar los componentes necesarios


type Service = {
    id: number;
    service_name: string;
    customer_id: number;
    description: string;
    service_price: number;
    service_start: string;
    service_validity: string;
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
    const [filteredServices, setFilteredServices] = useState<Service[]>(services);
    const [selectedCustomer, setSelectedCustomer] = useState<string>('all');

    useEffect(() => {
        if (selectedCustomer === 'all') {
            setFilteredServices(services);
        } else {
            setFilteredServices(services.filter(service => service.customer_id.toString() === selectedCustomer));
        }
    }, [selectedCustomer, services]);
 console.log(filteredServices)
    return (
        <div>
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

            <div className="overflow-x-auto">
                <Table className="min-w-full">
                    <TableHead>
                        <TableRow>
                            <TableCell>Nombre del Servicio</TableCell>
                            <TableCell>Precio del Servicio</TableCell>
                            <TableCell>Inicio del Servicio</TableCell>
                            <TableCell>Validez del Servicio</TableCell>
                            <TableCell>Cliente</TableCell>
                        </TableRow>
                    
                    <TableBody>
                        {filteredServices.map((service: Service) => (
                            console.log(service),
                            <TableRow key={service.id}>
                                <TableCell>{service.service_name}</TableCell>
                                <TableCell>${service.service_price}</TableCell>
                                <TableCell>{service.service_start}</TableCell>
                                <TableCell>{service.service_validity}</TableCell>
                                <TableCell>{customers.find(customer => customer.id.toString() === service.customer_id.toString())?.name}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    </TableHead>
                </Table>
            </div>
        </div>
    );
};

export default ServiceTable;
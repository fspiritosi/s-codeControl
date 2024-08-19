"use client"
import React from 'react'
import { supabaseBrowser } from '@/lib/supabase/browser'; // Asegúrate de tener configurado tu cliente de Supabase
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHead, TableRow, TableCell, TableBody } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import ServiceItemsForm from './ServiceItemsForm';

interface Item {
    id: string;
    item_name: string;
    item_description: string;
    item_measure_units: { id: string, unit: string };
    item_price: number;
    is_active: boolean;
    customer_id: { id: string, name: string };
    customer_service_id: { customer_id: { id: string, name: string } };
    company_id: string;

}
interface UpdatedFields {
    item_name?: string;
    item_description?: string;
    item_price?: number;
    item_measure_units?: number;
    is_active?: boolean;
}
interface MeasureUnits {
    id: string;
    unit: string;
    simbol: string;
    tipo: string;
}

interface customer {
    id: string;
    name: string;
}

interface Service {
    id: string;
    customer_id: { id: string, name: string };
    customer_service_id: { id: string, name: string };
    service_name: string;
    service_description: string;
    service_price: number;
    is_active: boolean;
    company_id: string;
}
interface company_id {
    company_id: string;
}
interface measure_unit {
    id: number;
    unit: string;
    simbol: string;
    tipo: string;
}
export default function ServiceItemsTable({ measure_units, customers, services, company_id }: { measure_units: measure_unit[], customers: customer[], services: Service[], company_id: string }) {
    const supabase = supabaseBrowser();
    const URL = process.env.NEXT_PUBLIC_BASE_URL;
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingService, setEditingService] = useState<Item | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
   
    const modified_company_id = company_id?.replace(/"/g, '');
    
    const [filteredItems, setFilteredItems] = useState<Item[]>([]);
    const [isActiveFilter, setIsActiveFilter] = useState(true);
    const [measure_unit, setMeasureUnit] = useState<MeasureUnits[] | null>(null);
    
    useEffect(() => {
        filterItems();
    }, [selectedCustomer, isActiveFilter, items]);
    
    const filterItems = () => {
        let filtered = items;

        if (selectedCustomer !== 'all') {
            
            filtered = filtered.filter(item => item.customer_service_id.customer_id.id?.toString() === selectedCustomer);
        }

        filtered = filtered.filter(item => item.is_active === isActiveFilter);

        setFilteredItems(filtered as any );
    };
    
    useEffect(() => {
        const fetchItems = async () => {
            try {
               
                const itemsResponse = await fetch(`${URL}/api/services/items?actual=${modified_company_id}`);

                if (!itemsResponse.ok) {
                    throw new Error('Error al obtener los items');
                }
                const responseData = await itemsResponse.json();
                
                const items = Array.isArray(responseData) ? responseData : responseData.items;
                
                setItems(items);

            
                const measureUnitsResponse = await fetch(`${URL}/api/meassure`);
                if (!measureUnitsResponse.ok) {
                    throw new Error('Error al obtener las unidades de medida');
                }
                const responseMeasureUnits = await measureUnitsResponse.json();
                const measureUnits = Array.isArray(responseMeasureUnits) ? responseMeasureUnits : responseMeasureUnits.data;
                setMeasureUnit(measureUnits);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();

        const channel = supabase.channel('custom-all-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'service_items' },
                async (payload) => {
                   
                    fetchItems(); 
                }
            )
            .subscribe();

       
        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    if (loading) {
        return <div className='center-screen'>Cargando...</div>;
    }

    const modified_editing_item_service_id = editingService?.id.toString().replace(/"/g, '');
    

    return (
        <ResizablePanelGroup className="pl-3 flex flex-col gap-2" direction="horizontal">
            <ResizablePanel>
                <ServiceItemsForm measure_units={measure_units as any} customers={customers} services={services as any} company_id={modified_company_id} editingService={editingService as any} />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel className="pl-3 min-w-[500px] flex flex-col gap-2" defaultSize={70}>
                <div className="flex flex-col gap-6 py-4 px-6">
                    
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
                        <Table className="min-w-full divide-y divide-gray-200">
                            <TableHead className="bg-header-background">
                                <TableRow>
                                    <TableCell className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Nombre
                                    </TableCell>
                                    <TableCell className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Estado
                                    </TableCell>
                                    <TableCell className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Descripción
                                    </TableCell>
                                    <TableCell className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        UDM
                                    </TableCell>
                                    <TableCell className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Precio
                                    </TableCell>
                                    <TableCell className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Cliente
                                    </TableCell>
                                    <TableCell className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Acciones
                                    </TableCell>
                                </TableRow>

                                <TableBody className="bg-background divide-y ">
                                    {filteredItems?.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-muted-foreground">{item.item_name}</TableCell>
                                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground"><Badge variant={item.is_active ? 'success' : 'default'}>{item.is_active ? 'Activo' : 'Inactivo'}</Badge></TableCell>
                                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{item.item_description}</TableCell>
                                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{item.item_measure_units?.unit}</TableCell>
                                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">${item.item_price}</TableCell>
                                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{item.customer_service_id?.customer_id?.name}</TableCell>
                                            <TableCell>
                                                {/* <Button onClick={() => handleEditClick(item)}>Editar</Button> */}
                                                <Button
                                                    size={'sm'}
                                                    variant={'link'}
                                                    className="hover:text-blue-400"
                                                    onClick={() => setEditingService(item)}
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

    )
}

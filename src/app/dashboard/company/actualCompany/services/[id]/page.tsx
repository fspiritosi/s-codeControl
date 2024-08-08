"use client"
import { supabaseBrowser } from '@/lib/supabase/browser'; // Asegúrate de tener configurado tu cliente de Supabase
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHead, TableRow, TableCell, TableBody } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import EditModal from '@/components/EditModal';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import cookies from 'js-cookie';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import BackButton from '@/components/BackButton';
import { Badge } from '@/components/ui/badge';

interface Item {
    id: string;
    item_name: string;
    item_description: string;
    item_measure_units: { id: string, unit: string };
    item_price: number;
    is_active: boolean;
    customer_id: { id: string, name: string };
    customer_service_id: string;
    company_id: string;
}
interface UpdatedFields {
    item_name?: string;
    item_description?: string;
    item_price?: number;
    item_measure_units?: number;
    is_active?: boolean;
}

const ServiceItemsPage = ({ params }: { params: any }) => {

    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingService, setEditingService] = useState<Item | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [customers, setCustomers] = useState<any[]>([]);
    const [customers_services, setCustomerServices] = useState<any[]>([]);
    const [selectedClient, setSelectedClient] = useState('');
    const company_id = cookies.get('actualComp');
    const modified_company_id = company_id?.replace(/"/g, '');
    const modified_editing_service_id = params.id?.replace(/"/g, '');
    const [filteredItems, setFilteredItems] = useState<Item[]>([]);
    const [isActiveFilter, setIsActiveFilter] = useState(true);


    useEffect(() => {
        filterServices();
    }, [isActiveFilter, items]);

    const filterServices = () => {
        const filtered = items.filter(item => item.is_active === isActiveFilter);
        setFilteredItems(filtered);
    };
    useEffect(() => {
        const fetchItemsAndCustomers = async () => {
            const supabase = supabaseBrowser();

            // Obtener items
            const { data: items, error: itemsError } = await supabase
                .from('service_items')
                .select('*,item_measure_units(id, unit),customer_id(id,name)')
                .eq('customer_service_id', params.id);

            if (itemsError) {
                console.error(itemsError);
            } else {
                setItems(items);
            }

            // Obtener customers
            const { data: customers, error: customersError } = await supabase
                .from('customers')
                .select('*')
                .eq('company_id', modified_company_id);
            if (customersError) {
                console.error(customersError);
            } else {
                setCustomers(customers);
            }

            // Obtener servicios asociados a un cliente
            const { data: customerServices, error: customerServicesError } = await supabase
                .from('customer_services')
                .select('*')
                .eq('customer_id', selectedClient); // Asegúrate de usar el ID del cliente adecuado

            if (customerServicesError) {
                console.error(customerServicesError);
            } else {
                setCustomerServices(customerServices);
            }

            setLoading(false);
        };

        fetchItemsAndCustomers();
    }, [params.id]);

    if (loading) {
        return <div>Cargando...</div>;
    }
    const filteredServices = items.filter(service => service?.customer_id.id === selectedClient.toString());
    const modified_editing_item_service_id = editingService?.id.toString().replace(/"/g, '');
    const handleEditClick = (service_items: Item) => {
        setEditingService(service_items);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (editingService) {
            try {
                const updatedFields: UpdatedFields = {};

                if (editingService.item_name) updatedFields.item_name = editingService.item_name;
                if (editingService.item_description) updatedFields.item_description = editingService.item_description;
                if (editingService.item_price) updatedFields.item_price = editingService.item_price;
                if (editingService.item_measure_units) updatedFields.item_measure_units = Number(editingService.item_measure_units.id);
                if (editingService.is_active !== undefined) updatedFields.is_active = editingService.is_active;

                const response = await fetch(`/api/services/items?id=${editingService.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updatedFields),
                });

                if (response.ok) {
                    // Actualizar la lista de items con el item editado
                    const updatedItem = await response.json();
                    setItems((prevItems) =>
                        prevItems.map((item) =>
                            item.id === updatedItem.id ? updatedItem : item
                        )
                    );
                    toast.success('Item actualizado correctamente');
                    setIsModalOpen(false);
                } else {
                    const errorText = await response.text();
                    console.error('Error al actualizar el item:', errorText);
                    toast.error('Error al actualizar el item');
                }
            } catch (error) {
                console.error('Error al actualizar el item:', error);
                toast.error('Error al actualizar el item');
            }
        }
    };

    const handleDeactivateItem = async () => {
        if (editingService) {
            try {
                const newActiveState = !editingService.is_active;

                const response = await fetch(`/api/services/items/?id=${modified_editing_item_service_id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ is_active: newActiveState }),
                });

                if (response.ok) {
                    // Actualizar la lista de items con el item desactivado
                    const updatedItem = await response.json();
                    setFilteredItems((prevItems) =>
                        prevItems.map((item) =>
                            item.id === updatedItem.id ? updatedItem : item
                        )
                    );
                    toast.success(`Item ${newActiveState ? 'activado' : 'desactivado'} correctamente`);
                    setIsModalOpen(false);
                } else {
                    console.error('Error al desactivar el item');
                    toast.error('Error al desactivar el item');
                }
            } catch (error) {
                console.error('Error al desactivar el item:', error);
                toast.error('Error al desactivar el item');
            }
        }
    };

    return (
        <div>

            <Card className="overflow-hidden">
                <CardHeader className="w-full flex bg-muted dark:bg-muted/50 border-b-2 flex-row justify-between">
                    <div className="w-fit">
                        <CardTitle className="text-2xl font-bold tracking-tight w-fit">Items del Servicio </CardTitle>
                        <CardDescription className="text-muted-foreground w-fit">Detalle de todos los Items del servicio</CardDescription>
                    </div>
                    <div className="flex  justify-end">
                        <BackButton />
                    </div>
                </CardHeader>
                <CardContent className="py-4 px-4 ">
                    <div className="flex space-x-4 p-4">
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
                    <div className="flex space-x-4">
                        <Table className="min-w-full divide-y divide-gray-200">
                            <TableHead className="bg-header-background">
                                <TableRow>
                                    <TableCell className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Nombre
                                    </TableCell>
                                    <TableCell className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Descripción
                                    </TableCell>
                                    <TableCell className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Unidades
                                    </TableCell>
                                    <TableCell className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Precio
                                    </TableCell>
                                    <TableCell className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Estado
                                    </TableCell>
                                    <TableCell className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Cliente
                                    </TableCell>
                                    <TableCell className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Acciones
                                    </TableCell>
                                </TableRow>

                                <TableBody className="bg-background divide-y ">
                                    {filteredItems.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-muted-foreground">{item.item_name}</TableCell>
                                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{item.item_description}</TableCell>
                                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{item.item_measure_units?.unit}</TableCell>
                                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">${item.item_price}</TableCell>
                                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground"><Badge variant={item.is_active ? 'success' : 'default'}>{item.is_active ? 'Activo' : 'Inactivo'}</Badge></TableCell>
                                            <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{item.customer_id.name}</TableCell>
                                            <TableCell>
                                                <Button onClick={() => handleEditClick(item)}>Editar</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </TableHead>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-row items-center border-t bg-muted dark:bg-muted/50 px-6 py-3"></CardFooter>
            </Card>
            {isModalOpen && editingService && (
                <EditModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <h2 className="text-lg font-semibold">Editar Servicio</h2>
                    <div className="p-4 bg-gray-100 dark:bg-gray-800 text-black dark:text-white">
                        <label htmlFor="item_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Servicio</label>
                        <Input

                            value={editingService.item_name}
                            onChange={(e: any) => setEditingService({ ...editingService, item_name: e.target.value })}
                            className="w-full p-2 mb-2 border border-gray-300 dark:border-gray-700 rounded"
                        />
                        <label htmlFor="item_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción del Servicio</label>
                        <Input

                            value={editingService.item_description}
                            onChange={(e: any) => setEditingService({ ...editingService, item_description: e.target.value })}
                            className="w-full p-2 mb-2 border border-gray-300 dark:border-gray-700 rounded"
                        />
                        <label htmlFor="item_price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Precio del Servicio</label>
                        <Input
                            type="text"
                            value={editingService.item_price}
                            onChange={(e: any) => setEditingService({ ...editingService, item_price: e.target.value })}
                            className="w-full p-2 mb-2 border border-gray-300 dark:border-gray-700 rounded"
                        />


                        <label htmlFor="customer" className="block mt-4">Cliente</label>
                        <select
                            id="customer_id"
                            onChange={(e) => {
                                const value = e.target.value;
                                setSelectedClient(value);
                                setEditingService({
                                    ...editingService,
                                    customer_id: { id: value, name: '' },
                                });
                            }}
                            value={editingService.customer_id?.id || ''}
                            defaultValue=''
                            className="block w-full mt-2 p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
                        >
                            {customers?.map((customer) => (
                                <option key={customer.id} value={customer.id}>
                                    {customer.name}
                                </option>
                            ))}
                        </select>

                        <label htmlFor="customer_service_id" className="block mt-4">Servicio</label>
                        <select
                            id="customer_service_id"
                            onChange={(e) => {
                                const value = e.target.value;
                                setEditingService({
                                    ...editingService,
                                    customer_service_id: value,
                                });
                            }}
                            value={editingService.customer_service_id || ''}
                            defaultValue=''
                            className="block w-full mt-2 p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
                        >
                            {items
                                ?.filter((service) => service.customer_id.id === selectedClient)
                                .map((service) => (
                                    <option key={service.id} value={service.id}>
                                        {service.item_name}
                                    </option>
                                ))}
                        </select>
                        <div className="flex justify-end space-x-2 mt-4">
                            <Button onClick={handleSave}   >Guardar</Button>
                            <Button onClick={() => setIsModalOpen(false)} >Cancelar</Button>
                            <Button onClick={handleDeactivateItem} variant={editingService.is_active ? 'destructive' : 'success'}>
                                {editingService.is_active ? 'Dar de Baja' : 'Dar de Alta'}
                            </Button>
                        </div>
                    </div>
                </EditModal>
            )}
        </div>
    );
};

export default ServiceItemsPage;
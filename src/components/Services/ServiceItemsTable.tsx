'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';
import { useEffect, useState } from 'react';
import ServiceItemsForm from './ServiceItemsForm';

interface Item {
  id: string;
  item_name: string;
  item_description: string;
  item_measure_units: { id: string; unit: string };
  item_price: number;
  is_active: boolean;
  customer_id: { id: string; name: string };
  customer_service_id: { customer_id: { id: string; name: string } };
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
  customer_id: { id: string; name: string };
  customer_service_id: { id: string; name: string };
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
export default function ServiceItemsTable({
  measure_units,
  customers,
  services,
  company_id,
  items,
}: {
  measure_units: measure_unit[];
  customers: customer[];
  services: Service[];
  company_id: string;
  items: any[];
}) {
  const [editingService, setEditingService] = useState<Item | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');

  const modified_company_id = company_id?.replace(/"/g, '');

  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [isActiveFilter, setIsActiveFilter] = useState(true);

  useEffect(() => {
    filterItems();
  }, [selectedCustomer, isActiveFilter, items]);

  const filterItems = () => {
    let filtered = items;

    if (selectedCustomer !== 'all') {
      filtered = filtered.filter((item) => item.customer_service_id.customer_id.id?.toString() === selectedCustomer);
    }

    filtered = filtered.filter((item) => item.is_active === isActiveFilter);

    setFilteredItems(filtered as any);
  };

  return (
    <ResizablePanelGroup className="pl-3 flex flex-col gap-2" direction="horizontal">
      <ResizablePanel>
        <ServiceItemsForm
          measure_units={measure_units as any}
          customers={customers}
          services={services as any}
          company_id={modified_company_id}
          editingService={editingService as any}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel className="pl-3 min-w-[500px] flex flex-col gap-2" defaultSize={70}>
        <div className="flex flex-col gap-6 py-4 px-6">
          <div className="flex space-x-4">
            <Select onValueChange={(value) => setSelectedCustomer(value)} value={selectedCustomer} defaultValue="all">
              <SelectTrigger className="w-[400px]">
                <SelectValue placeholder="Filtrar por cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los clientes</SelectItem>
                {customers.map((customer: any) => (
                  <SelectItem value={String(customer.id)} key={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              onValueChange={(value) => setIsActiveFilter(value === 'true')}
              value={String(isActiveFilter)}
              defaultValue="true"
            >
              <SelectTrigger className="w-[400px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Activos</SelectItem>
                <SelectItem value="false">Inactivos</SelectItem>
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
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-muted-foreground">
                        {item.item_name}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        <Badge variant={item.is_active ? 'success' : 'default'}>
                          {item.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {item.item_description}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {item.item_measure_units?.unit}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        ${item.item_price}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {item.customer_service_id?.customer_id?.name}
                      </TableCell>
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
  );
}

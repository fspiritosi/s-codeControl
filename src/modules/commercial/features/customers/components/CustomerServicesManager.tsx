'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Ban, Check, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import {
  getCustomerServices,
  getMeasureUnits,
  createCustomerService,
  deactivateCustomerService,
  createServiceItem,
  updateServiceItem,
  deactivateServiceItem,
} from '@/modules/commercial/features/customers/services.server';

type Item = {
  id: string;
  item_name: string;
  item_description: string;
  item_price: number;
  item_measure_units: number;
  unit: string;
  is_active: boolean;
};
type Service = { id: string; service_name: string | null; is_active: boolean; items: Item[] };
type Unit = { id: number; unit: string; simbol: string; tipo: string };

const currency = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n || 0);

export default function CustomerServicesManager({ customerId }: { customerId: string }) {
  const [services, setServices] = useState<Service[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [newService, setNewService] = useState('');

  const reload = useCallback(async () => {
    const [svcs, us] = await Promise.all([getCustomerServices(customerId), getMeasureUnits()]);
    setServices(svcs as Service[]);
    setUnits(us as Unit[]);
    setLoading(false);
  }, [customerId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleAddService = async () => {
    if (!newService.trim()) return;
    const res = await createCustomerService(customerId, newService);
    if (res.error) return toast.error(res.error);
    toast.success('Servicio agregado');
    setNewService('');
    reload();
  };

  const handleDeactivateService = async (id: string) => {
    const res = await deactivateCustomerService(id);
    if (res.error) return toast.error(res.error);
    toast.success('Servicio desactivado');
    reload();
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando servicios…</p>;
  }

  const activeServices = services.filter((s) => s.is_active);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Servicios e ítems del cliente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-end gap-2">
          <div className="flex-1 max-w-sm">
            <label className="text-xs text-muted-foreground">Nuevo servicio</label>
            <Input
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              placeholder="Nombre del servicio"
              onKeyDown={(e) => e.key === 'Enter' && handleAddService()}
            />
          </div>
          <Button type="button" onClick={handleAddService}>
            <Plus className="h-4 w-4 mr-1" /> Agregar servicio
          </Button>
        </div>

        {activeServices.length === 0 && (
          <p className="text-sm text-muted-foreground">Este cliente todavía no tiene servicios cargados.</p>
        )}

        {activeServices.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            units={units}
            onChanged={reload}
            onDeactivate={() => handleDeactivateService(service.id)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function ServiceCard({
  service,
  units,
  onChanged,
  onDeactivate,
}: {
  service: Service;
  units: Unit[];
  onChanged: () => void;
  onDeactivate: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const activeItems = service.items.filter((i) => i.is_active);

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">{service.service_name || 'Servicio sin nombre'}</span>
          <Badge variant="secondary">{activeItems.length} ítems</Badge>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setAdding((v) => !v)}>
            <Plus className="h-4 w-4 mr-1" /> Ítem
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onDeactivate}>
            <Ban className="h-4 w-4 mr-1" /> Desactivar
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ítem</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="w-[140px] text-right">Precio</TableHead>
            <TableHead className="w-[90px]">Unidad</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {adding && (
            <ItemEditor
              units={units}
              onCancel={() => setAdding(false)}
              onSave={async (data) => {
                const res = await createServiceItem(service.id, data);
                if (res.error) return toast.error(res.error);
                toast.success('Ítem agregado');
                setAdding(false);
                onChanged();
              }}
            />
          )}
          {activeItems.map((item) =>
            editingId === item.id ? (
              <ItemEditor
                key={item.id}
                initial={item}
                units={units}
                onCancel={() => setEditingId(null)}
                onSave={async (data) => {
                  const res = await updateServiceItem(item.id, data);
                  if (res.error) return toast.error(res.error);
                  toast.success('Ítem actualizado');
                  setEditingId(null);
                  onChanged();
                }}
              />
            ) : (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.item_name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{item.item_description}</TableCell>
                <TableCell className="text-right">{currency(item.item_price)}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell className="text-right">
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(item.id)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={async () => {
                      const res = await deactivateServiceItem(item.id);
                      if (res.error) return toast.error(res.error);
                      toast.success('Ítem desactivado');
                      onChanged();
                    }}
                  >
                    <Ban className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          )}
          {activeItems.length === 0 && !adding && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                Sin ítems. Agregá el primero.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ItemEditor({
  initial,
  units,
  onSave,
  onCancel,
}: {
  initial?: Item;
  units: Unit[];
  onSave: (data: {
    item_name: string;
    item_description: string;
    item_price: number;
    item_measure_units: number;
  }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.item_name ?? '');
  const [description, setDescription] = useState(initial?.item_description ?? '');
  const [price, setPrice] = useState(String(initial?.item_price ?? ''));
  const [unitId, setUnitId] = useState(String(initial?.item_measure_units ?? units[0]?.id ?? ''));

  return (
    <TableRow>
      <TableCell>
        <Input className="h-8" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" />
      </TableCell>
      <TableCell>
        <Input
          className="h-8"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción"
        />
      </TableCell>
      <TableCell>
        <Input
          className="h-8 text-right"
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0.00"
        />
      </TableCell>
      <TableCell>
        <Select value={unitId} onValueChange={setUnitId}>
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Unidad" />
          </SelectTrigger>
          <SelectContent>
            {units.map((u) => (
              <SelectItem key={u.id} value={String(u.id)}>
                {u.simbol || u.unit}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-right">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() =>
            onSave({
              item_name: name,
              item_description: description,
              item_price: Number(price) || 0,
              item_measure_units: Number(unitId),
            })
          }
        >
          <Check className="h-4 w-4 text-green-600" />
        </Button>
        <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

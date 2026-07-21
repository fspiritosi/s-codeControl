'use client';

import { Fragment, useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Ban, Check, X, DollarSign, Star } from 'lucide-react';
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
  addServiceItemPrice,
  setEnabledServiceItemPrice,
  deleteServiceItemPrice,
} from '@/modules/commercial/features/customers/services.server';

type Price = { id: string; price: number; period_month: number | null; period_year: number | null; is_enabled: boolean };
type Item = {
  id: string;
  item_name: string;
  item_description: string;
  item_price: number;
  item_measure_units: number;
  unit: string;
  is_active: boolean;
  prices: Price[];
};
type Service = { id: string; service_name: string | null; is_active: boolean; items: Item[] };
type Unit = { id: number; unit: string; simbol: string; tipo: string };

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const currency = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n || 0);

const formatPeriod = (m: number | null, y: number | null) => {
  if (m && y) return `${String(m).padStart(2, '0')}/${y}`;
  if (y) return `${y}`;
  return 'Sin período';
};

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

  if (loading) return <p className="text-sm text-muted-foreground">Cargando servicios…</p>;

  const activeServices = services.filter((s) => s.is_active);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Servicios e ítems del cliente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-end gap-2">
          <div className="max-w-sm flex-1">
            <label className="text-xs text-muted-foreground">Nuevo servicio</label>
            <Input
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              placeholder="Nombre del servicio"
              onKeyDown={(e) => e.key === 'Enter' && handleAddService()}
            />
          </div>
          <Button type="button" onClick={handleAddService}>
            <Plus className="mr-1 h-4 w-4" /> Agregar servicio
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
            onDeactivate={async () => {
              const res = await deactivateCustomerService(service.id);
              if (res.error) return toast.error(res.error);
              toast.success('Servicio desactivado');
              reload();
            }}
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
  const [pricesFor, setPricesFor] = useState<string | null>(null);

  const activeItems = service.items.filter((i) => i.is_active);

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">{service.service_name || 'Servicio sin nombre'}</span>
          <Badge variant="secondary">{activeItems.length} ítems</Badge>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setAdding((v) => !v)}>
            <Plus className="mr-1 h-4 w-4" /> Ítem
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onDeactivate}>
            <Ban className="mr-1 h-4 w-4" /> Desactivar
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ítem</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="w-[150px] text-right">Precio habilitado</TableHead>
            <TableHead className="w-[110px]">Período</TableHead>
            <TableHead className="w-[80px]">Unidad</TableHead>
            <TableHead className="w-[120px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {adding && (
            <ItemCreateRow
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
          {activeItems.map((item) => {
            const enabled = item.prices.find((p) => p.is_enabled);
            return (
              <Fragment key={item.id}>
                {editingId === item.id ? (
                  <ItemMetaRow
                    key={item.id}
                    item={item}
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
                    <TableCell className="text-sm text-muted-foreground">{item.item_description}</TableCell>
                    <TableCell className="text-right">{enabled ? currency(enabled.price) : currency(item.item_price)}</TableCell>
                    <TableCell className="text-sm">{enabled ? formatPeriod(enabled.period_month, enabled.period_year) : '—'}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        size="icon"
                        variant={pricesFor === item.id ? 'secondary' : 'ghost'}
                        className="h-7 w-7"
                        title="Precios"
                        onClick={() => setPricesFor((v) => (v === item.id ? null : item.id))}
                      >
                        <DollarSign className="h-3.5 w-3.5" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" className="h-7 w-7" title="Editar" onClick={() => setEditingId(item.id)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        title="Desactivar"
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
                )}
                {pricesFor === item.id && (
                  <TableRow>
                    <TableCell colSpan={6} className="bg-muted/30">
                      <PricesPanel item={item} onChanged={onChanged} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
          {activeItems.length === 0 && !adding && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                Sin ítems. Agregá el primero.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ItemCreateRow({
  units,
  onSave,
  onCancel,
}: {
  units: Unit[];
  onSave: (data: {
    item_name: string;
    item_description: string;
    item_price: number;
    item_measure_units: number;
    period_month: number | null;
    period_year: number | null;
  }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [unitId, setUnitId] = useState(String(units[0]?.id ?? ''));
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  return (
    <TableRow>
      <TableCell>
        <Input className="h-8" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" />
      </TableCell>
      <TableCell>
        <Input className="h-8" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción" />
      </TableCell>
      <TableCell>
        <Input className="h-8 text-right" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Precio" />
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="h-8 w-16"><SelectValue placeholder="Mes" /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input className="h-8 w-16" type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="Año" />
        </div>
      </TableCell>
      <TableCell>
        <Select value={unitId} onValueChange={setUnitId}>
          <SelectTrigger className="h-8"><SelectValue placeholder="Unidad" /></SelectTrigger>
          <SelectContent>
            {units.map((u) => (
              <SelectItem key={u.id} value={String(u.id)}>{u.simbol || u.unit}</SelectItem>
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
              period_month: month ? Number(month) : null,
              period_year: year ? Number(year) : null,
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

function ItemMetaRow({
  item,
  units,
  onSave,
  onCancel,
}: {
  item: Item;
  units: Unit[];
  onSave: (data: { item_name: string; item_description: string; item_measure_units: number }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(item.item_name);
  const [description, setDescription] = useState(item.item_description);
  const [unitId, setUnitId] = useState(String(item.item_measure_units));

  return (
    <TableRow>
      <TableCell>
        <Input className="h-8" value={name} onChange={(e) => setName(e.target.value)} />
      </TableCell>
      <TableCell>
        <Input className="h-8" value={description} onChange={(e) => setDescription(e.target.value)} />
      </TableCell>
      <TableCell className="text-right text-sm text-muted-foreground">precio en “$”</TableCell>
      <TableCell className="text-sm text-muted-foreground">—</TableCell>
      <TableCell>
        <Select value={unitId} onValueChange={setUnitId}>
          <SelectTrigger className="h-8"><SelectValue placeholder="Unidad" /></SelectTrigger>
          <SelectContent>
            {units.map((u) => (
              <SelectItem key={u.id} value={String(u.id)}>{u.simbol || u.unit}</SelectItem>
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
          onClick={() => onSave({ item_name: name, item_description: description, item_measure_units: Number(unitId) })}
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

function PricesPanel({ item, onChanged }: { item: Item; onChanged: () => void }) {
  const [price, setPrice] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [enable, setEnable] = useState(false);

  const sortedPrices = [...item.prices].sort((a, b) => {
    const ay = a.period_year ?? 0, by = b.period_year ?? 0;
    if (ay !== by) return by - ay;
    return (b.period_month ?? 0) - (a.period_month ?? 0);
  });

  const handleAdd = async () => {
    if (!price) return toast.error('Ingresá un precio');
    const res = await addServiceItemPrice(item.id, {
      price: Number(price) || 0,
      period_month: month ? Number(month) : null,
      period_year: year ? Number(year) : null,
      enable,
    });
    if (res.error) return toast.error(res.error);
    toast.success('Precio agregado');
    setPrice(''); setMonth(''); setYear(''); setEnable(false);
    onChanged();
  };

  return (
    <div className="space-y-3 py-2">
      <p className="text-xs font-semibold text-muted-foreground">Historial de precios · el habilitado es el que toma la factura</p>
      <div className="space-y-1">
        {sortedPrices.map((p) => (
          <div key={p.id} className="flex items-center gap-3 text-sm">
            <span className="w-24 tabular-nums">{formatPeriod(p.period_month, p.period_year)}</span>
            <span className="w-28 text-right tabular-nums">{currency(p.price)}</span>
            {p.is_enabled ? (
              <Badge variant="success" className="gap-1">
                <Star className="h-3 w-3" /> Habilitado
              </Badge>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-6"
                onClick={async () => {
                  const res = await setEnabledServiceItemPrice(p.id);
                  if (res.error) return toast.error(res.error);
                  toast.success('Precio habilitado');
                  onChanged();
                }}
              >
                Usar este
              </Button>
            )}
            {!p.is_enabled && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={async () => {
                  const res = await deleteServiceItemPrice(p.id);
                  if (res.error) return toast.error(res.error);
                  toast.success('Precio eliminado');
                  onChanged();
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t pt-3">
        <Input className="h-8 w-28" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Nuevo precio" />
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="h-8 w-32"><SelectValue placeholder="Mes" /></SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input className="h-8 w-20" type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="Año" />
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" checked={enable} onChange={(e) => setEnable(e.target.checked)} />
          Habilitar
        </label>
        <Button type="button" size="sm" onClick={handleAdd}>
          <Plus className="mr-1 h-4 w-4" /> Agregar precio
        </Button>
      </div>
    </div>
  );
}

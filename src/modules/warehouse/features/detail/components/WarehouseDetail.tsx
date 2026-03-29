'use client';

import { useState } from 'react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { WAREHOUSE_TYPE_LABELS } from '@/modules/warehouse/shared/types';
import { adjustStock, transferStock } from '@/modules/warehouse/features/list/actions.server';
import { ArrowLeftRight, PackagePlus, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import BackButton from '@/shared/components/common/BackButton';

interface Props {
  warehouse: any;
  stocks: any[];
  products: { id: string; code: string; name: string; unit_of_measure: string }[];
  warehouses: { id: string; code: string; name: string }[];
}

export default function WarehouseDetail({ warehouse, stocks, products, warehouses }: Props) {
  const router = useRouter();
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [adjustData, setAdjustData] = useState({ product_id: '', quantity: 0, notes: '' });
  const [transferData, setTransferData] = useState({ destination_warehouse_id: '', product_id: '', quantity: 0, notes: '' });

  const handleAdjust = async () => {
    if (!adjustData.product_id || !adjustData.notes) {
      toast.error('Completar producto y notas');
      return;
    }
    toast.promise(
      async () => {
        const result = await adjustStock({ warehouse_id: warehouse.id, ...adjustData });
        if (result.error) throw new Error(result.error);
        setAdjustOpen(false);
        setAdjustData({ product_id: '', quantity: 0, notes: '' });
        router.refresh();
      },
      { loading: 'Ajustando stock...', success: 'Stock ajustado', error: (e) => e.message }
    );
  };

  const handleTransfer = async () => {
    if (!transferData.product_id || !transferData.destination_warehouse_id || transferData.quantity <= 0) {
      toast.error('Completar todos los campos');
      return;
    }
    toast.promise(
      async () => {
        const result = await transferStock({
          source_warehouse_id: warehouse.id,
          ...transferData,
        });
        if (result.error) throw new Error(result.error);
        setTransferOpen(false);
        setTransferData({ destination_warehouse_id: '', product_id: '', quantity: 0, notes: '' });
        router.refresh();
      },
      { loading: 'Transfiriendo...', success: 'Transferencia realizada', error: (e) => e.message }
    );
  };

  const otherWarehouses = warehouses.filter((w) => w.id !== warehouse.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{warehouse.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-mono text-sm text-muted-foreground">{warehouse.code}</span>
            <Badge variant="outline">{WAREHOUSE_TYPE_LABELS[warehouse.type] || warehouse.type}</Badge>
            <Badge variant={warehouse.is_active ? 'default' : 'secondary'}>
              {warehouse.is_active ? 'Activo' : 'Inactivo'}
            </Badge>
            {(warehouse.city || warehouse.province) && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="size-3" />
                {[warehouse.city, warehouse.province].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <PackagePlus className="size-4 mr-1" /> Ajustar stock
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajustar stock</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Producto</Label>
                  <Select onValueChange={(v) => setAdjustData({ ...adjustData, product_id: v })} value={adjustData.product_id}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nueva cantidad</Label>
                  <Input type="number" step="0.001" min="0" value={adjustData.quantity} onChange={(e) => setAdjustData({ ...adjustData, quantity: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Notas (requerido)</Label>
                  <Textarea placeholder="Motivo del ajuste" value={adjustData.notes} onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })} />
                </div>
                <Button onClick={handleAdjust} className="w-full">Confirmar ajuste</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <ArrowLeftRight className="size-4 mr-1" /> Transferir
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Transferir stock</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Producto</Label>
                  <Select onValueChange={(v) => setTransferData({ ...transferData, product_id: v })} value={transferData.product_id}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
                    <SelectContent>
                      {stocks.filter((s) => s.available_qty > 0).map((s) => (
                        <SelectItem key={s.product?.id} value={s.product?.id}>
                          {s.product?.name} (disponible: {s.available_qty} {s.product?.unit_of_measure})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Almacén destino</Label>
                  <Select onValueChange={(v) => setTransferData({ ...transferData, destination_warehouse_id: v })} value={transferData.destination_warehouse_id}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar destino" /></SelectTrigger>
                    <SelectContent>
                      {otherWarehouses.map((w) => (
                        <SelectItem key={w.id} value={w.id}>{w.name} ({w.code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cantidad</Label>
                  <Input type="number" step="0.001" min="0" value={transferData.quantity} onChange={(e) => setTransferData({ ...transferData, quantity: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Notas</Label>
                  <Textarea placeholder="Notas opcionales" value={transferData.notes} onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })} />
                </div>
                <Button onClick={handleTransfer} className="w-full">Confirmar transferencia</Button>
              </div>
            </DialogContent>
          </Dialog>

          <BackButton />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock en este almacén</CardTitle>
          <CardDescription>{stocks.length} productos</CardDescription>
        </CardHeader>
        <CardContent>
          {stocks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Reservado</TableHead>
                  <TableHead className="text-right">Disponible</TableHead>
                  <TableHead>Unidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks.map((stock) => (
                  <TableRow key={stock.id}>
                    <TableCell className="font-medium">{stock.product?.name}</TableCell>
                    <TableCell className="font-mono text-sm">{stock.product?.code}</TableCell>
                    <TableCell className="text-right">{stock.quantity}</TableCell>
                    <TableCell className="text-right">{stock.reserved_qty}</TableCell>
                    <TableCell className="text-right font-medium">{stock.available_qty}</TableCell>
                    <TableCell>{stock.product?.unit_of_measure}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">No hay stock registrado en este almacén</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

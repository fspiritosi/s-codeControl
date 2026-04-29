import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Pencil, ArrowLeft } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button, buttonVariants } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import {
  PRODUCT_TYPE_LABELS,
  PRODUCT_STATUS_LABELS,
  type Product,
} from '@/modules/products/shared/types';
import { STOCK_MOVEMENT_TYPE_LABELS, WAREHOUSE_TYPE_LABELS } from '@/modules/warehouse/shared/types';

interface StockRow {
  id: string;
  warehouse_id: string;
  warehouse_code: string;
  warehouse_name: string;
  warehouse_type: string;
  warehouse_company_id?: string;
  warehouse_company_name?: string;
  quantity: number;
  reserved_qty: number;
  available_qty: number;
  updated_at: string;
}

interface MovementRow {
  id: string;
  type: string;
  quantity: number;
  warehouse_code: string;
  warehouse_name: string;
  company_id?: string;
  company_name?: string;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  date: string;
}

interface Props {
  product: Product;
  stocks: StockRow[];
  movements: MovementRow[];
  showCompany?: boolean;
}

const INBOUND = new Set(['PURCHASE', 'TRANSFER_IN', 'RETURN', 'PRODUCTION']);

export default function ProductDetail({ product, stocks, movements, showCompany = false }: Props) {
  const totalStock = stocks.reduce((acc, s) => acc + s.quantity, 0);
  const totalAvailable = stocks.reduce((acc, s) => acc + s.available_qty, 0);
  const totalReserved = stocks.reduce((acc, s) => acc + s.reserved_qty, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/warehouse?tab=products"
            className={buttonVariants({ variant: 'ghost', size: 'icon' })}
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p className="text-sm text-muted-foreground font-mono">{product.code}</p>
          </div>
        </div>
        <Link
          href={`/dashboard/products/${product.id}/edit`}
          className={buttonVariants({ variant: 'default' })}
        >
          <Pencil className="size-4 mr-2" /> Editar
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Field label="Tipo" value={PRODUCT_TYPE_LABELS[product.type] || product.type} />
          <Field label="Unidad" value={product.unit_of_measure} />
          <Field label="Marca" value={product.brand || '-'} />
          <Field label="Código de barras" value={product.barcode || '-'} />
          <Field label="Costo" value={`$${product.cost_price.toFixed(2)}`} />
          <Field label="Precio de venta" value={`$${product.sale_price.toFixed(2)}`} />
          <Field label="IVA" value={`${product.vat_rate}%`} />
          <Field
            label="Estado"
            value={
              <Badge variant={product.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {PRODUCT_STATUS_LABELS[product.status] || product.status}
              </Badge>
            }
          />
          {product.description && (
            <div className="col-span-full">
              <p className="text-xs text-muted-foreground mb-1">Descripción</p>
              <p>{product.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Stock por almacén</CardTitle>
            <CardDescription>
              {product.track_stock
                ? `Total ${totalStock} ${product.unit_of_measure} (Disponible ${totalAvailable} · Reservado ${totalReserved})`
                : 'Este producto no controla stock'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {!product.track_stock ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No se realiza control de stock para este producto.
            </p>
          ) : stocks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No hay stock registrado en ningún almacén.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Almacén</TableHead>
                  <TableHead>Tipo</TableHead>
                  {showCompany && <TableHead>Empresa</TableHead>}
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Reservado</TableHead>
                  <TableHead className="text-right">Disponible</TableHead>
                  <TableHead>Actualizado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/warehouse/${s.warehouse_id}`}
                        className="hover:underline"
                      >
                        <p className="font-medium">{s.warehouse_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{s.warehouse_code}</p>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {WAREHOUSE_TYPE_LABELS[s.warehouse_type] || s.warehouse_type}
                      </Badge>
                    </TableCell>
                    {showCompany && (
                      <TableCell className="text-sm">{s.warehouse_company_name ?? '-'}</TableCell>
                    )}
                    <TableCell className="text-right tabular-nums">{s.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.reserved_qty}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {s.available_qty}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(s.updated_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Movimientos</CardTitle>
          <CardDescription>Últimos {movements.length} movimientos del producto</CardDescription>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Este producto aún no tiene movimientos registrados.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Almacén</TableHead>
                  {showCompany && <TableHead>Empresa</TableHead>}
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((m) => {
                  const isInbound = INBOUND.has(m.type);
                  const sign = isInbound ? '+' : '-';
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {format(new Date(m.date), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isInbound ? 'default' : 'secondary'}>
                          {STOCK_MOVEMENT_TYPE_LABELS[m.type] || m.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <p>{m.warehouse_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{m.warehouse_code}</p>
                      </TableCell>
                      {showCompany && (
                        <TableCell className="text-sm">{m.company_name ?? '-'}</TableCell>
                      )}
                      <TableCell
                        className={`text-right tabular-nums font-medium ${isInbound ? 'text-green-700' : 'text-red-700'}`}
                      >
                        {sign}
                        {Math.abs(m.quantity)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {m.reference_type || '-'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[280px] truncate">
                        {m.notes || '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

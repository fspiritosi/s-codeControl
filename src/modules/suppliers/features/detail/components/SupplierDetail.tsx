'use client';

import Link from 'next/link';
import { Badge } from '@/shared/components/ui/badge';
import { Button, buttonVariants } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Separator } from '@/shared/components/ui/separator';
import BackButton from '@/shared/components/common/BackButton';
import { Pencil } from 'lucide-react';
import {
  TAX_CONDITION_LABELS,
  SUPPLIER_STATUS_LABELS,
  type Supplier,
} from '@/modules/suppliers/shared/types';

function formatCuit(cuit: string) {
  const clean = cuit.replace(/-/g, '');
  if (clean.length === 11) {
    return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}`;
  }
  return cuit;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || '-'}</p>
    </div>
  );
}

interface Props {
  supplier: Supplier;
}

export default function SupplierDetail({ supplier }: Props) {
  const status = supplier.status;
  const statusVariant =
    status === 'ACTIVE' ? 'default' : status === 'BLOCKED' ? 'destructive' : 'secondary';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-muted-foreground">{supplier.code}</p>
          <h1 className="text-2xl font-bold">{supplier.business_name}</h1>
          {supplier.trade_name && (
            <p className="text-muted-foreground">{supplier.trade_name}</p>
          )}
          <div className="flex gap-2 mt-2">
            <Badge variant={statusVariant}>
              {SUPPLIER_STATUS_LABELS[status] || status}
            </Badge>
            <Badge variant="outline">
              {TAX_CONDITION_LABELS[supplier.tax_condition] || supplier.tax_condition}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/suppliers/${supplier.id}/edit`}
            className={buttonVariants({ variant: 'default', size: 'sm' })}
          >
            <Pencil className="size-4 mr-1" /> Editar
          </Link>
          <BackButton />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos fiscales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Razón social" value={supplier.business_name} />
          <Field label="Nombre de fantasía" value={supplier.trade_name} />
          <Field
            label="CUIT"
            value={<span className="font-mono">{formatCuit(supplier.tax_id)}</span>}
          />
          <Field
            label="Condición ante IVA"
            value={TAX_CONDITION_LABELS[supplier.tax_condition] || supplier.tax_condition}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contacto</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Email" value={supplier.email} />
          <Field label="Teléfono" value={supplier.phone} />
          <Field
            label="Sitio web"
            value={
              supplier.website ? (
                <a
                  href={supplier.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  {supplier.website}
                </a>
              ) : null
            }
          />
          <Separator className="md:col-span-2 lg:col-span-3" />
          <Field label="Nombre de contacto" value={supplier.contact_name} />
          <Field label="Teléfono de contacto" value={supplier.contact_phone} />
          <Field label="Email de contacto" value={supplier.contact_email} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dirección</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <Field label="Dirección" value={supplier.address} />
          </div>
          <Field label="Ciudad" value={supplier.city} />
          <Field label="Provincia" value={supplier.province} />
          <Field label="Código postal" value={supplier.zip_code} />
          <Field label="País" value={supplier.country} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datos comerciales</CardTitle>
          <CardDescription>Condiciones operativas del proveedor</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field
            label="Plazo de pago"
            value={
              supplier.payment_term_days === 0
                ? 'Contado'
                : `${supplier.payment_term_days} días`
            }
          />
          <Field
            label="Límite de crédito"
            value={
              supplier.credit_limit != null
                ? `$${Number(supplier.credit_limit).toFixed(2)}`
                : 'Sin límite'
            }
          />
          <div className="md:col-span-2 lg:col-span-3">
            <Field label="Notas" value={supplier.notes} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Pencil, IdCard } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { buttonVariants } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import BackButton from '@/shared/components/common/BackButton';
import CustomerServicesManager from './CustomerServicesManager';
import CustomerContactsManager from './CustomerContactsManager';
import CustomerAccountSummary from './CustomerAccountSummary';

const TAX_CONDITION_LABELS: Record<string, string> = {
  RESPONSABLE_INSCRIPTO: 'Responsable Inscripto',
  MONOTRIBUTO: 'Monotributo',
  EXENTO: 'Exento',
  CONSUMIDOR_FINAL: 'Consumidor Final',
  NO_RESPONSABLE: 'No Responsable',
};

export type CustomerDetail = {
  id: string;
  name: string;
  cuit: string | number | null;
  tax_id: string | null;
  document_type: string | null;
  tax_condition: string | null;
  client_email: string | null;
  client_phone: string | number | null;
  address: string | null;
  fiscal_address: string | null;
  fiscal_city: string | null;
  fiscal_province: string | null;
  fiscal_zip_code: string | null;
  is_active: boolean | null;
};

function formatCuit(value: string | number | null): string {
  if (value === null || value === undefined || value === '') return '—';
  const digits = String(value).replace(/\D/g, '');
  if (digits.length === 11) return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
  return String(value);
}

function composeFiscalAddress(c: CustomerDetail): string {
  const parts = [c.fiscal_address, c.fiscal_city, c.fiscal_province, c.fiscal_zip_code].filter(Boolean);
  if (parts.length > 0) return parts.join(', ');
  return c.address || '—';
}

function DataRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value || '—'}</p>
      </div>
    </div>
  );
}

export default function CustomerDetailView({ customer }: { customer: CustomerDetail }) {
  const docType = customer.document_type || 'CUIT';
  const taxId = customer.tax_id || formatCuit(customer.cuit);
  const taxCondition = customer.tax_condition ? TAX_CONDITION_LABELS[customer.tax_condition] : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
                <Badge variant={customer.is_active === false ? 'destructive' : 'success'}>
                  {customer.is_active === false ? 'Inactivo' : 'Activo'}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {docType} {taxId}
                {taxCondition ? ` · ${taxCondition}` : ''}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <BackButton />
              <Link
                href={`/dashboard/commercial/customers/action?action=edit&id=${customer.id}`}
                className={buttonVariants({ variant: 'default', size: 'sm' })}
              >
                <Pencil className="mr-1 h-4 w-4" /> Editar datos
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DataRow icon={<IdCard className="h-4 w-4" />} label={docType} value={taxId} />
            <DataRow icon={<Mail className="h-4 w-4" />} label="Email" value={customer.client_email || '—'} />
            <DataRow
              icon={<Phone className="h-4 w-4" />}
              label="Teléfono"
              value={customer.client_phone ? String(customer.client_phone) : '—'}
            />
            <DataRow icon={<MapPin className="h-4 w-4" />} label="Dirección fiscal" value={composeFiscalAddress(customer)} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="servicios">
        <TabsList>
          <TabsTrigger value="servicios">Servicios e Ítems</TabsTrigger>
          <TabsTrigger value="contactos">Contactos</TabsTrigger>
          <TabsTrigger value="cuenta">Cuenta corriente</TabsTrigger>
        </TabsList>

        <TabsContent value="servicios" className="mt-4">
          <CustomerServicesManager customerId={customer.id} />
        </TabsContent>

        <TabsContent value="contactos" className="mt-4">
          <CustomerContactsManager customerId={customer.id} />
        </TabsContent>

        <TabsContent value="cuenta" className="mt-4">
          <CustomerAccountSummary customerId={customer.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

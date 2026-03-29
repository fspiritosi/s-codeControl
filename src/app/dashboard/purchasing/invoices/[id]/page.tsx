import { prisma } from '@/shared/lib/prisma';
import { notFound } from 'next/navigation';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Separator } from '@/shared/components/ui/separator';
import { INVOICE_STATUS_LABELS, VOUCHER_TYPE_LABELS } from '@/modules/purchasing/shared/types';
import BackButton from '@/shared/components/common/BackButton';
import { format } from 'date-fns';

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const invoice = await prisma.purchase_invoices.findUnique({
    where: { id },
    include: {
      supplier: { select: { business_name: true, tax_id: true } },
      lines: { include: { product: { select: { code: true, name: true } } } },
      purchase_order: { select: { full_number: true } },
    },
  });

  if (!invoice) return notFound();

  const statusVariant = invoice.status === 'CONFIRMED' ? 'default' : invoice.status === 'PAID' ? 'success' : invoice.status === 'CANCELLED' ? 'destructive' : 'secondary';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{invoice.full_number}</h1>
          <p className="text-muted-foreground">{invoice.supplier?.business_name} — {invoice.supplier?.tax_id}</p>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">{VOUCHER_TYPE_LABELS[invoice.voucher_type] || invoice.voucher_type}</Badge>
            <Badge variant={statusVariant as any}>{INVOICE_STATUS_LABELS[invoice.status] || invoice.status}</Badge>
            {invoice.purchase_order && <Badge variant="outline">OC: {invoice.purchase_order.full_number}</Badge>}
          </div>
        </div>
        <BackButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fecha emisión</CardDescription>
            <CardTitle className="text-lg">{format(new Date(invoice.issue_date), 'dd/MM/yyyy')}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vencimiento</CardDescription>
            <CardTitle className="text-lg">{invoice.due_date ? format(new Date(invoice.due_date), 'dd/MM/yyyy') : '-'}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>CAE</CardDescription>
            <CardTitle className="text-lg font-mono">{invoice.cae || '-'}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-lg">${Number(invoice.total).toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Líneas</CardTitle>
          <CardDescription>{invoice.lines.length} items</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Costo unit.</TableHead>
                <TableHead className="text-right">IVA</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="font-mono text-xs">{line.product?.code || '-'}</TableCell>
                  <TableCell>{line.description}</TableCell>
                  <TableCell className="text-right">{Number(line.quantity)}</TableCell>
                  <TableCell className="text-right">${Number(line.unit_cost).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{Number(line.vat_rate)}%</TableCell>
                  <TableCell className="text-right">${Number(line.subtotal).toFixed(2)}</TableCell>
                  <TableCell className="text-right">${Number(line.total).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Separator className="my-4" />
          <div className="flex justify-end text-sm space-x-8">
            <div>Subtotal: <span className="font-mono font-medium">${Number(invoice.subtotal).toFixed(2)}</span></div>
            <div>IVA: <span className="font-mono font-medium">${Number(invoice.vat_amount).toFixed(2)}</span></div>
            <div className="text-lg font-bold">Total: <span className="font-mono">${Number(invoice.total).toFixed(2)}</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { prisma } from '@/shared/lib/prisma';
import { notFound } from 'next/navigation';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { RECEIVING_NOTE_STATUS_LABELS } from '@/modules/purchasing/shared/types';
import BackButton from '@/shared/components/common/BackButton';
import { format } from 'date-fns';

export default async function ReceivingNoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const note = await prisma.receiving_notes.findUnique({
    where: { id },
    include: {
      supplier: { select: { business_name: true, tax_id: true } },
      warehouse: { select: { name: true, code: true } },
      purchase_order: { select: { full_number: true } },
      purchase_invoice: { select: { full_number: true } },
      lines: { include: { product: { select: { code: true, name: true, unit_of_measure: true } } } },
    },
  });

  if (!note) return notFound();

  const statusVariant = note.status === 'CONFIRMED' ? 'default' : note.status === 'CANCELLED' ? 'destructive' : 'secondary';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{note.full_number}</h1>
          <p className="text-muted-foreground">{note.supplier?.business_name} — {note.supplier?.tax_id}</p>
          <div className="flex gap-2 mt-2">
            <Badge variant={statusVariant as any}>{RECEIVING_NOTE_STATUS_LABELS[note.status] || note.status}</Badge>
            <Badge variant="outline">Almacén: {note.warehouse?.name}</Badge>
            {note.purchase_order && <Badge variant="outline">OC: {note.purchase_order.full_number}</Badge>}
            {note.purchase_invoice && <Badge variant="outline">FC: {note.purchase_invoice.full_number}</Badge>}
          </div>
        </div>
        <BackButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fecha de recepción</CardDescription>
            <CardTitle className="text-lg">{format(new Date(note.reception_date), 'dd/MM/yyyy')}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Almacén destino</CardDescription>
            <CardTitle className="text-lg">{note.warehouse?.name} ({note.warehouse?.code})</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Líneas</CardDescription>
            <CardTitle className="text-lg">{note.lines.length} productos</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {note.notes && (
        <Card>
          <CardContent className="pt-4 text-sm">
            <span className="font-medium">Notas:</span> {note.notes}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Productos recibidos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {note.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="font-mono text-xs">{line.product?.code}</TableCell>
                  <TableCell>{line.product?.name || line.description}</TableCell>
                  <TableCell className="text-right font-medium">{Number(line.quantity)}</TableCell>
                  <TableCell>{line.product?.unit_of_measure}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{line.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

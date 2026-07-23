/**
 * Backfill del estado de pago de las facturas de compra.
 *
 * Hasta ahora el estado solo se derivaba al marcar una OP como pagada, comparando
 * `pagos >= total`. Una factura cubierta por una nota de crédito quedaba
 * "Confirmada" para siempre porque nunca existía una OP que la marcara.
 * Este script reprocesa las facturas ya existentes con el criterio correcto:
 * cobertura = pagos imputados + NC aplicadas.
 *
 * Uso (toma DATABASE_URL de .env, o de la variable de entorno si se pasa):
 *   npx tsx scripts/backfill-purchase-invoice-status.ts           # simulación
 *   npx tsx scripts/backfill-purchase-invoice-status.ts --apply   # escribe
 *
 * Solo cambia la columna `status` de purchase_invoices. No borra ni crea nada.
 */
import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const EPS = 0.01;
const CREDIT_NOTE_VOUCHER_TYPES = ['NOTA_CREDITO_A', 'NOTA_CREDITO_B', 'NOTA_CREDITO_C'];
const ACTIVE_CREDIT_NOTE_STATUSES = ['CONFIRMED', 'PARTIAL_PAID', 'PAID'];

async function main() {
  const apply = process.argv.includes('--apply');

  const invoices = await prisma.purchase_invoices.findMany({
    where: {
      status: { in: ['CONFIRMED', 'PARTIAL_PAID', 'PAID'] },
      voucher_type: { notIn: CREDIT_NOTE_VOUCHER_TYPES as any },
    },
    select: {
      id: true,
      full_number: true,
      total: true,
      status: true,
      company_id: true,
      supplier: { select: { business_name: true } },
    },
  });

  if (invoices.length === 0) {
    console.log('No hay facturas de compra para reprocesar.');
    return;
  }

  const ids = invoices.map((i: { id: string }) => i.id);

  const [paidGroups, creditGroups] = await Promise.all([
    prisma.payment_order_items.groupBy({
      by: ['invoice_id'],
      where: { invoice_id: { in: ids }, payment_order: { status: 'PAID' } },
      _sum: { amount: true },
    }),
    prisma.purchase_invoices.groupBy({
      by: ['original_invoice_id'],
      where: {
        voucher_type: { in: CREDIT_NOTE_VOUCHER_TYPES as any },
        status: { in: ACTIVE_CREDIT_NOTE_STATUSES as any },
        original_invoice_id: { in: ids },
      },
      _sum: { total: true },
    }),
  ]);

  const paidByInvoice = new Map<string, number>();
  for (const g of paidGroups) {
    if (g.invoice_id) paidByInvoice.set(g.invoice_id, Number(g._sum.amount ?? 0));
  }
  const creditByInvoice = new Map<string, number>();
  for (const g of creditGroups) {
    if (g.original_invoice_id) {
      creditByInvoice.set(g.original_invoice_id, Number(g._sum.total ?? 0));
    }
  }

  const changes: { id: string; label: string; from: string; to: string; detail: string }[] = [];

  for (const inv of invoices) {
    const charged = Number(inv.total);
    const paid = paidByInvoice.get(inv.id) ?? 0;
    const credit = creditByInvoice.get(inv.id) ?? 0;
    const covered = paid + credit;

    const next =
      charged > 0 && covered >= charged - EPS ? 'PAID' : covered > 0 ? 'PARTIAL_PAID' : 'CONFIRMED';

    if (next !== inv.status) {
      changes.push({
        id: inv.id,
        label: `${inv.full_number} (${inv.supplier?.business_name ?? '?'})`,
        from: inv.status,
        to: next,
        detail: `total ${charged} | pagado ${paid} | NC ${credit}`,
      });
    }
  }

  console.log(`Facturas analizadas: ${invoices.length}`);
  console.log(`Facturas con estado a corregir: ${changes.length}\n`);

  for (const c of changes) {
    console.log(`  ${c.label}: ${c.from} -> ${c.to}   [${c.detail}]`);
  }

  if (!apply) {
    console.log('\nSimulación. Volvé a correr con --apply para escribir los cambios.');
    return;
  }

  for (const c of changes) {
    await prisma.purchase_invoices.update({ where: { id: c.id }, data: { status: c.to as any } });
  }
  console.log(`\nListo: ${changes.length} facturas actualizadas.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

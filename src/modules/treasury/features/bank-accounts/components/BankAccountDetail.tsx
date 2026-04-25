import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { getBankAccountById } from '../actions.server';
import { getMovementsByBankAccount } from '../../bank-movements/actions.server';
import { BankMovementsPanel } from '../../bank-movements/components/BankMovementsPanel';
import {
  BANK_ACCOUNT_STATUS_LABELS,
  BANK_ACCOUNT_TYPE_LABELS,
} from '../../../shared/validators';

export async function BankAccountDetail({ id }: { id: string }) {
  const account = await getBankAccountById(id);
  if (!account) notFound();

  const movements = await getMovementsByBankAccount(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/treasury?tab=bank-accounts">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{account.bank_name}</h1>
          <p className="text-sm text-muted-foreground font-mono">{account.account_number}</p>
        </div>
        <Badge variant={account.status === 'ACTIVE' ? 'default' : 'secondary'}>
          {BANK_ACCOUNT_STATUS_LABELS[account.status]}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Saldo</CardDescription>
            <CardTitle className="text-2xl font-mono">
              {account.currency} {account.balance.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tipo</CardDescription>
            <CardTitle className="text-base">
              {BANK_ACCOUNT_TYPE_LABELS[account.account_type]}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>CBU</CardDescription>
            <CardTitle className="text-sm font-mono break-all">
              {account.cbu ?? '-'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Alias</CardDescription>
            <CardTitle className="text-base">{account.alias ?? '-'}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movimientos</CardTitle>
          <CardDescription>
            Historial de movimientos bancarios. Podés marcarlos como conciliados cuando se cruzan con el extracto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BankMovementsPanel
            bankAccountId={account.id}
            accountStatus={account.status}
            currency={account.currency}
            movements={movements.map((m) => ({
              ...m,
              date: m.date.toISOString(),
              reconciled_at: m.reconciled_at ? m.reconciled_at.toISOString() : null,
              created_at: m.created_at.toISOString(),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}

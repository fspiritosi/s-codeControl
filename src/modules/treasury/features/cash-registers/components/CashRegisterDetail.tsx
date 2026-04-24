import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { getCashRegisterById } from '../actions.server';
import { getActiveSession, getSessionsByCashRegister } from '../../sessions/actions.server';
import { getMovementsBySession } from '../../cash-movements/actions.server';
import { ActiveSessionPanel } from '../../sessions/components/ActiveSessionPanel';
import { SessionHistoryTable } from '../../sessions/components/SessionHistoryTable';
import {
  CASH_REGISTER_STATUS_LABELS,
} from '../../../shared/validators';

export async function CashRegisterDetail({ id }: { id: string }) {
  const register = await getCashRegisterById(id);
  if (!register) notFound();

  const activeSession = await getActiveSession(id);
  const [history, activeMovements] = await Promise.all([
    getSessionsByCashRegister(id),
    activeSession ? getMovementsBySession(activeSession.id) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/treasury?tab=cash-registers">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <span className="font-mono">{register.code}</span>
            <span className="text-muted-foreground">—</span>
            <span>{register.name}</span>
          </h1>
          {register.location && (
            <p className="text-sm text-muted-foreground">{register.location}</p>
          )}
        </div>
        <Badge variant={register.status === 'ACTIVE' ? 'default' : 'destructive'}>
          {CASH_REGISTER_STATUS_LABELS[register.status]}
        </Badge>
        {register.is_default && <Badge variant="outline">Predeterminada</Badge>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sesión actual</CardTitle>
          <CardDescription>
            {activeSession
              ? 'Hay una sesión abierta. Podés registrar movimientos o cerrarla.'
              : 'No hay sesión abierta. Abrí una nueva para empezar a operar.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActiveSessionPanel
            cashRegisterId={register.id}
            cashRegisterStatus={register.status}
            activeSession={
              activeSession
                ? {
                    ...activeSession,
                    opened_at: activeSession.opened_at.toISOString(),
                  }
                : null
            }
            movements={activeMovements.map((m) => ({
              ...m,
              date: m.date.toISOString(),
              created_at: m.created_at.toISOString(),
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de sesiones</CardTitle>
          <CardDescription>Sesiones anteriores de esta caja.</CardDescription>
        </CardHeader>
        <CardContent>
          <SessionHistoryTable
            sessions={history.map((s) => ({
              ...s,
              opened_at: s.opened_at.toISOString(),
              closed_at: s.closed_at ? s.closed_at.toISOString() : null,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}

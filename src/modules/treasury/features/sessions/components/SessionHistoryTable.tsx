'use client';

import { format } from 'date-fns';
import { Badge } from '@/shared/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { SESSION_STATUS_LABELS } from '../../../shared/validators';

interface SessionRow {
  id: string;
  session_number: number;
  status: 'OPEN' | 'CLOSED';
  opening_balance: number;
  expected_balance: number;
  actual_balance: number | null;
  difference: number | null;
  opened_at: string;
  closed_at: string | null;
}

export function SessionHistoryTable({ sessions }: { sessions: SessionRow[] }) {
  const closed = sessions.filter((s) => s.status === 'CLOSED');

  if (closed.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin sesiones cerradas.</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[70px]">#</TableHead>
            <TableHead className="w-[140px]">Abierta</TableHead>
            <TableHead className="w-[140px]">Cerrada</TableHead>
            <TableHead className="text-right">Apertura</TableHead>
            <TableHead className="text-right">Esperado</TableHead>
            <TableHead className="text-right">Real</TableHead>
            <TableHead className="text-right">Diferencia</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {closed.map((s) => {
            const diff = s.difference ?? 0;
            const diffColor =
              diff === 0 ? 'text-muted-foreground' : diff < 0 ? 'text-red-600' : 'text-green-600';
            return (
              <TableRow key={s.id}>
                <TableCell className="font-mono">{s.session_number}</TableCell>
                <TableCell className="text-sm">
                  {format(new Date(s.opened_at), 'dd/MM/yyyy HH:mm')}
                </TableCell>
                <TableCell className="text-sm">
                  {s.closed_at ? format(new Date(s.closed_at), 'dd/MM/yyyy HH:mm') : '-'}
                </TableCell>
                <TableCell className="text-right font-mono">
                  ${s.opening_balance.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  ${s.expected_balance.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {s.actual_balance !== null ? `$${s.actual_balance.toFixed(2)}` : '-'}
                </TableCell>
                <TableCell className={`text-right font-mono ${diffColor}`}>
                  {s.difference !== null ? `$${s.difference.toFixed(2)}` : '-'}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{SESSION_STATUS_LABELS[s.status]}</Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

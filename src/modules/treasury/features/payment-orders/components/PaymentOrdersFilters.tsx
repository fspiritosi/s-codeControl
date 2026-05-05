'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { X } from 'lucide-react';

interface SupplierOpt {
  id: string;
  label: string;
}
interface StatusOpt {
  value: string;
  label: string;
}

interface Props {
  suppliers: SupplierOpt[];
  statuses: StatusOpt[];
  initial: { status: string; supplier: string; from: string; to: string };
}

const ALL = '__all__';

export function PaymentOrdersFilters({ suppliers, statuses, initial }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const update = (patch: Partial<typeof initial>) => {
    const params = new URLSearchParams(searchParams.toString());
    const next = { ...initial, ...patch };
    const map: Record<keyof typeof initial, string> = {
      status: 'status',
      supplier: 'supplier',
      from: 'from',
      to: 'to',
    };
    (Object.keys(map) as Array<keyof typeof initial>).forEach((k) => {
      const v = next[k];
      if (v) params.set(map[k], v);
      else params.delete(map[k]);
    });
    if (!params.get('tab')) params.set('tab', 'payment-orders');
    startTransition(() => {
      router.push(`/dashboard/treasury?${params.toString()}`);
    });
  };

  const hasFilters = !!(initial.status || initial.supplier || initial.from || initial.to);

  const clear = () => {
    const params = new URLSearchParams();
    params.set('tab', 'payment-orders');
    startTransition(() => {
      router.push(`/dashboard/treasury?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-md border p-3 bg-muted/30">
      <div className="space-y-1.5 min-w-[160px]">
        <Label className="text-xs">Estado</Label>
        <Select
          value={initial.status || ALL}
          onValueChange={(v) => update({ status: v === ALL ? '' : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5 min-w-[260px]">
        <Label className="text-xs">Proveedor</Label>
        <Select
          value={initial.supplier || ALL}
          onValueChange={(v) => update({ supplier: v === ALL ? '' : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos</SelectItem>
            {suppliers.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Desde</Label>
        <Input
          type="date"
          value={initial.from}
          onChange={(e) => update({ from: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Hasta</Label>
        <Input
          type="date"
          value={initial.to}
          onChange={(e) => update({ to: e.target.value })}
        />
      </div>
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clear}
          disabled={isPending}
          className="h-9"
        >
          <X className="size-4 mr-1" />
          Limpiar
        </Button>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import type { ComponenteFormulaClient, PeriodoConValores } from '@/modules/costos/shared/types/formula-polinomica.types';

interface Props {
  componentes: ComponenteFormulaClient[];
  periodoExistente?: PeriodoConValores;
  onSubmit: (periodo: string, valores: Record<string, number>, importe_certificado?: number) => Promise<void>;
  onCancel: () => void;
}

export function FormPeriodoIndices({ componentes, periodoExistente, onSubmit, onCancel }: Props) {
  const [periodo, setPeriodo] = useState(periodoExistente?.periodo ?? '');
  const [valores, setValores] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const c of componentes) {
      const existente = periodoExistente?.valores.find((v) => v.componente_id === c.id);
      init[c.id] = existente ? String(existente.valor_indice) : String(c.valor_indice_base);
    }
    return init;
  });
  const [certificado, setCertificado] = useState(
    periodoExistente?.importe_certificado != null ? String(periodoExistente.importe_certificado) : ''
  );
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const valoresNum: Record<string, number> = {};
      for (const [id, v] of Object.entries(valores)) valoresNum[id] = Number(v);
      await onSubmit(periodo, valoresNum, certificado ? Number(certificado) : undefined);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label htmlFor="periodo">Período</Label>
        <Input id="periodo" type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} required disabled={!!periodoExistente} />
      </div>
      <div className="space-y-2">
        <Label>Valor de cada índice en el período</Label>
        {componentes.map((c) => (
          <div key={c.id} className="flex items-center gap-2">
            <span className="w-28 text-sm text-muted-foreground">
              <span className="font-mono text-xs">{c.codigo}</span> {c.nombre}
            </span>
            <Input
              type="number"
              step="any"
              value={valores[c.id] ?? ''}
              onChange={(e) => setValores((v) => ({ ...v, [c.id]: e.target.value }))}
              required
            />
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="certificado">Importe certificado (opcional)</Label>
        <Input id="certificado" type="number" step="any" placeholder="Para calcular retroactivo" value={certificado} onChange={(e) => setCertificado(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Calculando...' : 'Guardar período'}
        </Button>
      </div>
    </form>
  );
}

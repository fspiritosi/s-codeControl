'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { upsertValorCategoria } from '../actions.server';
import type { ConfigCCTClient } from '../../../shared/types/cct.types';
import { formatCurrencyARS } from '@/shared/lib/utils/formatters';
import { Save } from 'lucide-react';

interface Props {
  cct: ConfigCCTClient;
}

type CeldaKey = `${string}__${string}`;

export function TabValoresPorCategoria({ cct }: Props) {
  const router = useRouter();
  const categorias = cct.categorias ?? [];
  const conceptosFijos = (cct.conceptos ?? []).filter(
    (c) => c.clase_calculo === 'FIJO_POR_CATEGORIA' && c.is_active
  );

  // Mapa inicial de valores: clave = "concepto_id__categoria_id"
  const initialValues: Record<CeldaKey, string> = {};
  for (const concepto of conceptosFijos) {
    for (const cat of categorias) {
      const val = concepto.valores?.find((v) => v.categoria_cct_id === cat.id);
      const key: CeldaKey = `${concepto.id}__${cat.id}`;
      initialValues[key] = val ? String(val.valor) : '';
    }
  }

  const [valores, setValores] = useState<Record<CeldaKey, string>>(initialValues);
  const [saving, setSaving] = useState<CeldaKey | null>(null);

  function handleChange(key: CeldaKey, value: string) {
    setValores((prev) => ({ ...prev, [key]: value }));
  }

  async function handleBlur(key: CeldaKey) {
    const rawValue = valores[key];
    const num = parseFloat(rawValue);
    if (!rawValue || isNaN(num) || num <= 0) return;

    const [concepto_cct_id, categoria_cct_id] = key.split('__') as [string, string];
    setSaving(key);
    try {
      await upsertValorCategoria({ concepto_cct_id, categoria_cct_id, valor: num });
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  }

  if (conceptosFijos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No hay conceptos con clase "Fijo por categoría". Creá uno en la pestaña Conceptos.
      </p>
    );
  }

  if (categorias.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No hay categorías. Creá las categorías primero.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-40">Concepto</TableHead>
            {categorias.map((cat) => (
              <TableHead key={cat.id} className="text-center min-w-32">
                {cat.codigo}
                <span className="block text-xs text-muted-foreground font-normal">{cat.nombre}</span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {conceptosFijos.map((concepto) => (
            <TableRow key={concepto.id}>
              <TableCell className="font-medium text-sm">
                <div>{concepto.nombre}</div>
                <div className="text-xs text-muted-foreground font-mono">{concepto.codigo}</div>
              </TableCell>
              {categorias.map((cat) => {
                const key: CeldaKey = `${concepto.id}__${cat.id}`;
                const isSaving = saving === key;
                return (
                  <TableCell key={cat.id} className="text-center">
                    <div className="relative flex items-center justify-center gap-1">
                      <Input
                        type="number"
                        step="0.01"
                        className="w-28 text-right text-sm h-8"
                        value={valores[key] ?? ''}
                        onChange={(e) => handleChange(key, e.target.value)}
                        onBlur={() => handleBlur(key)}
                        disabled={isSaving}
                        placeholder="0.00"
                      />
                      {isSaving && <Save className="h-3 w-3 animate-pulse text-muted-foreground absolute -right-5" />}
                    </div>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-xs text-muted-foreground mt-2">
        Los valores se guardan automáticamente al salir del campo.
      </p>
    </div>
  );
}

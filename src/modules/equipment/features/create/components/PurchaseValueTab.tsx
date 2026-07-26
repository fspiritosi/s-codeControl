'use client';

import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { getPurchaseValue, savePurchaseValue } from '../actions.server';

type Moneda = 'ARS' | 'USD';

const currency = (value: number, code: Moneda) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: code === 'USD' ? 'USD' : 'ARS' }).format(value);

export function PurchaseValueTab({ vehicleId, readOnly = false }: { vehicleId: string; readOnly?: boolean }) {
  const [moneda, setMoneda] = useState<Moneda>('ARS');
  const [valor, setValor] = useState('');
  const [tipoCambio, setTipoCambio] = useState('');
  const [rateInfo, setRateInfo] = useState<{ fecha: string | Date; fuente: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await getPurchaseValue(vehicleId);
      if (!active) return;
      if (res.data) {
        setMoneda((res.data.moneda_compra as Moneda) ?? 'ARS');
        // Muestra el valor en la moneda que cargó el usuario
        const cargado = res.data.moneda_compra === 'USD' ? res.data.valor_compra_usd : res.data.valor_compra;
        setValor(cargado != null ? String(cargado) : '');
        setTipoCambio(res.data.tipo_cambio_compra != null ? String(res.data.tipo_cambio_compra) : '');
      }
      // Si no hay tipo de cambio guardado, usa la última cotización de la empresa
      if ((!res.data || res.data.tipo_cambio_compra == null) && res.latestRate) {
        setTipoCambio(String(res.latestRate.valor));
      }
      if (res.latestRate) setRateInfo({ fecha: res.latestRate.fecha, fuente: res.latestRate.fuente });
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [vehicleId]);

  const equivalente = useMemo(() => {
    const v = Number(valor);
    const tc = Number(tipoCambio);
    if (!Number.isFinite(v) || v <= 0 || !Number.isFinite(tc) || tc <= 0) return null;
    return moneda === 'ARS'
      ? { code: 'USD' as Moneda, value: v / tc }
      : { code: 'ARS' as Moneda, value: v * tc };
  }, [valor, tipoCambio, moneda]);

  const handleSave = async () => {
    const v = Number(valor);
    const tc = Number(tipoCambio);
    if (!Number.isFinite(v) || v <= 0) return toast.error('Ingresá un valor de compra válido');
    if (!Number.isFinite(tc) || tc <= 0) return toast.error('Ingresá un tipo de cambio válido');
    setSaving(true);
    const res = await savePurchaseValue(vehicleId, { moneda_compra: moneda, valor: v, tipo_cambio: tc });
    setSaving(false);
    if (res.error) return toast.error(res.error);
    toast.success('Valor de compra guardado');
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground px-1 py-4">Cargando valor de compra…</p>;
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Valor de compra</CardTitle>
        <CardDescription>
          Cargá el valor en pesos o en dólares; el sistema calcula el equivalente con el tipo de cambio.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1.5 min-w-[140px]">
            <Label>Moneda de carga</Label>
            <Select value={moneda} onValueChange={(v) => setMoneda(v as Moneda)} disabled={readOnly}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ARS">Pesos (ARS)</SelectItem>
                <SelectItem value="USD">Dólares (USD)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[180px] flex-1">
            <Label>Valor de compra ({moneda})</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              disabled={readOnly}
              placeholder="0.00"
            />
          </div>
          <div className="flex flex-col gap-1.5 min-w-[160px]">
            <Label>Tipo de cambio (USD→ARS)</Label>
            <Input
              type="number"
              min={0}
              step="0.0001"
              value={tipoCambio}
              onChange={(e) => setTipoCambio(e.target.value)}
              disabled={readOnly}
              placeholder="0.0000"
            />
          </div>
        </div>

        {rateInfo && (
          <p className="text-xs text-muted-foreground">
            Última cotización de la empresa: {new Date(rateInfo.fecha).toLocaleDateString('es-AR')}
            {rateInfo.fuente ? ` · ${rateInfo.fuente}` : ''}
          </p>
        )}

        {equivalente && (
          <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
            Equivalente en {equivalente.code}: <strong>{currency(equivalente.value, equivalente.code)}</strong>
          </div>
        )}

        {!readOnly && (
          <div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar valor de compra'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { crearConcepto, actualizarConcepto } from '../actions.server';
import type { ConfigCCTClient, ConceptoCCTClient } from '../../../shared/types/cct.types';

interface Props {
  cct: ConfigCCTClient;
  concepto?: ConceptoCCTClient;
  open: boolean;
  onClose: () => void;
}

type ClaseCalculo = ConceptoCCTClient['clase_calculo'];
type Tipo = ConceptoCCTClient['tipo'];
type Ambito = 'mod_servicio' | 'liquidacion';

export function FormConcepto({ cct, concepto, open, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<Tipo>('remunerativo');
  const [aplica_en, setAplicaEn] = useState<Ambito[]>(['mod_servicio', 'liquidacion']);
  const [clase_calculo, setClaseCalculo] = useState<ClaseCalculo>('FIJO_GLOBAL');
  const [orden, setOrden] = useState('0');
  // Parámetros específicos por clase
  const [paramValor, setParamValor] = useState('');
  const [paramCodConcepto, setParamCodConcepto] = useState('');
  const [paramPorcentaje, setParamPorcentaje] = useState('');
  const [paramConceptosCodigos, setParamConceptosCodigos] = useState('');
  const [paramTopeCodigo, setParamTopeCodigo] = useState('');
  const [paramValorPorAnio, setParamValorPorAnio] = useState('');
  const [paramPctPorAnio, setParamPctPorAnio] = useState('');
  const [paramConceptoBase, setParamConceptoBase] = useState('');
  const [paramUnidad, setParamUnidad] = useState<'horas' | 'dias'>('horas');
  const [paramRecargo, setParamRecargo] = useState('');
  const [paramDerivBase, setParamDerivBase] = useState('');
  const [paramDerivDivisor, setParamDerivDivisor] = useState('');

  useEffect(() => {
    if (concepto) {
      setCodigo(concepto.codigo);
      setNombre(concepto.nombre);
      setTipo(concepto.tipo);
      setAplicaEn(concepto.aplica_en as Ambito[]);
      setClaseCalculo(concepto.clase_calculo);
      setOrden(String(concepto.orden));
      const p = concepto.parametros as Record<string, unknown>;
      setParamValor(String(p.valor ?? ''));
      setParamCodConcepto(String(p.concepto_codigo ?? ''));
      setParamPorcentaje(String(p.porcentaje ?? ''));
      setParamConceptosCodigos(Array.isArray(p.conceptos_codigos) ? p.conceptos_codigos.join(', ') : '');
      setParamTopeCodigo(String(p.tope_codigo ?? ''));
      setParamValorPorAnio(String(p.valor_por_anio ?? ''));
      setParamPctPorAnio(String(p.porcentaje_por_anio ?? ''));
      setParamConceptoBase(String(p.concepto_base_codigo ?? ''));
      setParamUnidad((p.unidad as 'horas' | 'dias') ?? 'horas');
      setParamRecargo(String(p.recargo ?? ''));
      const deriv = p.derivacion as { base?: string; divisor?: string } | undefined;
      setParamDerivBase(deriv?.base ?? '');
      setParamDerivDivisor(deriv?.divisor ?? '');
    } else {
      setCodigo(''); setNombre(''); setTipo('remunerativo');
      setAplicaEn(['mod_servicio', 'liquidacion']); setClaseCalculo('FIJO_GLOBAL'); setOrden('0');
      setParamValor(''); setParamCodConcepto(''); setParamPorcentaje('');
      setParamConceptosCodigos(''); setParamTopeCodigo(''); setParamValorPorAnio('');
      setParamPctPorAnio(''); setParamConceptoBase(''); setParamUnidad('horas');
      setParamRecargo(''); setParamDerivBase(''); setParamDerivDivisor('');
    }
    setError('');
  }, [concepto, open]);

  function buildParametros(): Record<string, unknown> {
    switch (clase_calculo) {
      case 'FIJO_GLOBAL': return { valor: parseFloat(paramValor) };
      case 'FIJO_POR_CATEGORIA': return {};
      case 'PCT_CONCEPTO': return { concepto_codigo: paramCodConcepto, porcentaje: parseFloat(paramPorcentaje) };
      case 'PCT_SUMA_CONCEPTOS': {
        const base: Record<string, unknown> = {
          conceptos_codigos: paramConceptosCodigos.split(',').map((s) => s.trim()).filter(Boolean),
          porcentaje: parseFloat(paramPorcentaje),
        };
        if (paramTopeCodigo) base.tope_codigo = paramTopeCodigo;
        return base;
      }
      case 'POR_ANTIGUEDAD_VALOR': return { valor_por_anio: parseFloat(paramValorPorAnio) };
      case 'POR_ANTIGUEDAD_PCT': return { porcentaje_por_anio: parseFloat(paramPctPorAnio), concepto_base_codigo: paramConceptoBase };
      case 'POR_UNIDAD': {
        const base: Record<string, unknown> = { unidad: paramUnidad };
        if (paramRecargo) base.recargo = parseFloat(paramRecargo);
        if (paramDerivBase && paramDerivDivisor) base.derivacion = { base: paramDerivBase, divisor: paramDerivDivisor };
        return base;
      }
      default: return {};
    }
  }

  function toggleAmbito(a: Ambito) {
    setAplicaEn((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (aplica_en.length === 0) { setError('Seleccioná al menos un ámbito'); return; }
    setLoading(true);
    setError('');
    try {
      const data = {
        config_cct_id: cct.id,
        codigo,
        nombre,
        tipo,
        aplica_en,
        clase_calculo,
        parametros: buildParametros(),
        orden: parseInt(orden),
      };
      if (concepto) {
        await actualizarConcepto(concepto.id, data);
      } else {
        await crearConcepto(data);
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{concepto ? 'Editar concepto' : 'Nuevo concepto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Código</Label>
              <Input placeholder="BASICO" value={codigo} onChange={(e) => setCodigo(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Orden</Label>
              <Input type="number" value={orden} onChange={(e) => setOrden(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input placeholder="Sueldo Básico" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as Tipo)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="remunerativo">Remunerativo</SelectItem>
                  <SelectItem value="no_remunerativo">No remunerativo</SelectItem>
                  <SelectItem value="descuento">Descuento</SelectItem>
                  <SelectItem value="aporte_patronal">Aporte patronal</SelectItem>
                  <SelectItem value="provision">Provisión</SelectItem>
                  <SelectItem value="prevision">Previsión</SelectItem>
                  <SelectItem value="ausentismo">Ausentismo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Clase de cálculo</Label>
              <Select value={clase_calculo} onValueChange={(v) => setClaseCalculo(v as ClaseCalculo)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIJO_GLOBAL">Fijo global</SelectItem>
                  <SelectItem value="FIJO_POR_CATEGORIA">Fijo por categoría</SelectItem>
                  <SelectItem value="PCT_CONCEPTO">% de concepto</SelectItem>
                  <SelectItem value="PCT_SUMA_CONCEPTOS">% de suma de conceptos</SelectItem>
                  <SelectItem value="POR_ANTIGUEDAD_VALOR">Antigüedad × valor</SelectItem>
                  <SelectItem value="POR_ANTIGUEDAD_PCT">Antigüedad × %</SelectItem>
                  <SelectItem value="POR_UNIDAD">Por unidad (hs/días)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ámbito */}
          <div className="space-y-1.5">
            <Label>Aplica en</Label>
            <div className="flex gap-4">
              {(['mod_servicio', 'liquidacion'] as Ambito[]).map((a) => (
                <label key={a} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={aplica_en.includes(a)}
                    onCheckedChange={() => toggleAmbito(a)}
                  />
                  {a === 'mod_servicio' ? 'MOD servicio' : 'Liquidación'}
                </label>
              ))}
            </div>
          </div>

          {/* Parámetros dinámicos */}
          {clase_calculo === 'FIJO_GLOBAL' && (
            <div className="space-y-1.5">
              <Label>Valor fijo</Label>
              <Input type="number" step="0.01" placeholder="227559.00" value={paramValor} onChange={(e) => setParamValor(e.target.value)} required />
            </div>
          )}
          {clase_calculo === 'FIJO_POR_CATEGORIA' && (
            <p className="text-sm text-muted-foreground bg-muted/40 rounded px-3 py-2">
              Los valores se cargan en la pestaña "Valores × Categoría" después de crear el concepto.
            </p>
          )}
          {clase_calculo === 'PCT_CONCEPTO' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Concepto base (código)</Label>
                <Input placeholder="BASICO" value={paramCodConcepto} onChange={(e) => setParamCodConcepto(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Porcentaje (ej: 0.85)</Label>
                <Input type="number" step="0.0001" placeholder="0.85" value={paramPorcentaje} onChange={(e) => setParamPorcentaje(e.target.value)} required />
              </div>
            </div>
          )}
          {clase_calculo === 'PCT_SUMA_CONCEPTOS' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Conceptos (códigos separados por coma)</Label>
                <Input placeholder="BASICO, ZONA_85, ANTIG" value={paramConceptosCodigos} onChange={(e) => setParamConceptosCodigos(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Porcentaje (ej: 0.11)</Label>
                  <Input type="number" step="0.0001" placeholder="0.11" value={paramPorcentaje} onChange={(e) => setParamPorcentaje(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Tope (código, opcional)</Label>
                  <Input placeholder="jubilatorio_max" value={paramTopeCodigo} onChange={(e) => setParamTopeCodigo(e.target.value)} />
                </div>
              </div>
            </div>
          )}
          {clase_calculo === 'POR_ANTIGUEDAD_VALOR' && (
            <div className="space-y-1.5">
              <Label>Valor por año de antigüedad</Label>
              <Input type="number" step="0.01" placeholder="5429.00" value={paramValorPorAnio} onChange={(e) => setParamValorPorAnio(e.target.value)} required />
            </div>
          )}
          {clase_calculo === 'POR_ANTIGUEDAD_PCT' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>% por año (ej: 0.01)</Label>
                <Input type="number" step="0.0001" value={paramPctPorAnio} onChange={(e) => setParamPctPorAnio(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Concepto base</Label>
                <Input placeholder="BASICO" value={paramConceptoBase} onChange={(e) => setParamConceptoBase(e.target.value)} required />
              </div>
            </div>
          )}
          {clase_calculo === 'POR_UNIDAD' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Unidad</Label>
                  <Select value={paramUnidad} onValueChange={(v) => setParamUnidad(v as 'horas' | 'dias')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="horas">Horas</SelectItem>
                      <SelectItem value="dias">Días</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Recargo (ej: 0.30 = 30%)</Label>
                  <Input type="number" step="0.01" placeholder="0.30" value={paramRecargo} onChange={(e) => setParamRecargo(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Derivación: concepto base</Label>
                  <Input placeholder="BASICO" value={paramDerivBase} onChange={(e) => setParamDerivBase(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Derivación: divisor</Label>
                  <Input placeholder="200" value={paramDerivDivisor} onChange={(e) => setParamDerivDivisor(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : concepto ? 'Guardar cambios' : 'Crear concepto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

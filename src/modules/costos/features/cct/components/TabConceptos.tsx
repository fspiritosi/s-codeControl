'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { toggleConcepto } from '../actions.server';
import { FormConcepto } from './FormConcepto';
import type { ConfigCCTClient, ConceptoCCTClient } from '../../../shared/types/cct.types';
import { Plus, Pencil, Eye, EyeOff } from 'lucide-react';

interface Props {
  cct: ConfigCCTClient;
}

const TIPO_LABELS: Record<string, string> = {
  remunerativo: 'Remunerativo',
  no_remunerativo: 'No remun.',
  descuento: 'Descuento',
  aporte_patronal: 'A. Patronal',
  provision: 'Provisión',
  prevision: 'Previsión',
  ausentismo: 'Ausentismo',
};

const TIPO_COLORS: Record<string, string> = {
  remunerativo: 'default',
  no_remunerativo: 'secondary',
  descuento: 'destructive',
  aporte_patronal: 'outline',
  provision: 'outline',
  prevision: 'outline',
  ausentismo: 'outline',
};

const CLASE_LABELS: Record<string, string> = {
  FIJO_GLOBAL: 'Fijo global',
  FIJO_POR_CATEGORIA: 'Por categoría',
  PCT_CONCEPTO: '% de concepto',
  PCT_SUMA_CONCEPTOS: '% de suma',
  POR_ANTIGUEDAD_VALOR: 'Antigüedad $',
  POR_ANTIGUEDAD_PCT: 'Antigüedad %',
  POR_UNIDAD: 'Por unidad',
};

export function TabConceptos({ cct }: Props) {
  const router = useRouter();
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroAmbito, setFiltroAmbito] = useState<string>('todos');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [editando, setEditando] = useState<ConceptoCCTClient | undefined>();

  const conceptos = cct.conceptos ?? [];
  const filtrados = conceptos.filter((c) => {
    if (!mostrarInactivos && !c.is_active) return false;
    if (filtroTipo !== 'todos' && c.tipo !== filtroTipo) return false;
    if (filtroAmbito !== 'todos' && !c.aplica_en.includes(filtroAmbito as never)) return false;
    return true;
  });

  async function handleToggle(id: string, actual: boolean) {
    await toggleConcepto(id, !actual);
    router.refresh();
  }

  function handleEditar(c: ConceptoCCTClient) {
    setEditando(c);
    setOpenForm(true);
  }

  function handleNuevo() {
    setEditando(undefined);
    setOpenForm(true);
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {Object.entries(TIPO_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroAmbito} onValueChange={setFiltroAmbito}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Ámbito" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="mod_servicio">MOD servicio</SelectItem>
            <SelectItem value="liquidacion">Liquidación</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant={mostrarInactivos ? 'secondary' : 'ghost'}
          className="h-8 text-xs gap-1.5"
          onClick={() => setMostrarInactivos((v) => !v)}
        >
          {mostrarInactivos ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          Inactivos
        </Button>
        <div className="flex-1" />
        <Button size="sm" variant="outline" className="gap-1.5" onClick={handleNuevo}>
          <Plus className="h-3.5 w-3.5" /> Agregar concepto
        </Button>
      </div>

      <FormConcepto
        cct={cct}
        concepto={editando}
        open={openForm}
        onClose={() => { setOpenForm(false); setEditando(undefined); router.refresh(); }}
      />

      {filtrados.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Sin resultados con los filtros seleccionados.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8 text-right">#</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Clase</TableHead>
              <TableHead>Ámbito</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.map((c) => (
              <TableRow key={c.id} className={c.is_active ? '' : 'opacity-50'}>
                <TableCell className="text-right text-muted-foreground text-xs">{c.orden}</TableCell>
                <TableCell className="font-mono text-sm">{c.codigo}</TableCell>
                <TableCell className="text-sm">{c.nombre}</TableCell>
                <TableCell>
                  <Badge variant={TIPO_COLORS[c.tipo] as never} className="text-xs">
                    {TIPO_LABELS[c.tipo] ?? c.tipo}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{CLASE_LABELS[c.clase_calculo] ?? c.clase_calculo}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {c.aplica_en.map((a) => (
                      <Badge key={a} variant="outline" className="text-xs">
                        {a === 'mod_servicio' ? 'MOD' : 'LIQ'}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEditar(c)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      title={c.is_active ? 'Desactivar' : 'Activar'}
                      onClick={() => handleToggle(c.id, c.is_active)}
                    >
                      {c.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/shared/components/ui/dialog';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { crearCostoTipoEquipo } from '../actions.server';
import type { ConceptoEquipoClient } from '@/modules/costos/shared/types/concepto.types';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  /** Tipos de la empresa que todavía no tienen costo creado. */
  tiposDisponibles: { id: string; nombre: string; equipos: number }[];
  conceptos: ConceptoEquipoClient[];
}

const GRUPOS = [
  { clase: 'ACCESORIO' as const, titulo: 'Accesorios' },
  { clase: 'MANTENIMIENTO' as const, titulo: 'Mantenimiento' },
];

export function DialogCrearCostoTipo({ tiposDisponibles, conceptos }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typeId, setTypeId] = useState('');
  const [elegidos, setElegidos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const sinTipos = tiposDisponibles.length === 0;

  const opciones = tiposDisponibles.map((t) => ({
    value: t.id,
    label: `${t.nombre} · ${t.equipos} ${t.equipos === 1 ? 'equipo' : 'equipos'}`,
  }));

  function toggle(id: string) {
    setElegidos((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function cerrar() {
    setOpen(false);
    setTypeId('');
    setElegidos([]);
  }

  async function handleConfirmar() {
    if (!typeId) return;
    setLoading(true);
    try {
      await crearCostoTipoEquipo(typeId, elegidos);
      toast.success('Costo del tipo creado');
      cerrar();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear el costo del tipo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        className="gap-1.5"
        disabled={sinTipos}
        title={sinTipos ? 'Ya creaste el costo de todos los tipos' : undefined}
        onClick={() => setOpen(true)}
      >
        <Plus className="h-3.5 w-3.5" /> Crear costo de equipo
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) cerrar(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear costo de equipo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Tipo de equipo</Label>
              <SearchableSelect
                options={opciones}
                value={typeId}
                onValueChange={setTypeId}
                placeholder="Elegí un tipo"
                searchPlaceholder="Buscar tipo..."
              />
            </div>

            <div className="space-y-1.5">
              <Label>Conceptos a incluir</Label>
              {conceptos.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Todavía no hay conceptos en el catálogo. Podés crear el costo del tipo ahora y
                  asociarlos después.
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto rounded border">
                  {GRUPOS.map(({ clase, titulo }) => {
                    const delGrupo = conceptos.filter((c) => c.clase === clase);
                    if (delGrupo.length === 0) return null;
                    return (
                      <div key={clase}>
                        <p className="px-3 py-1.5 text-xs font-medium bg-muted/60 sticky top-0">
                          {titulo}
                        </p>
                        {delGrupo.map((c) => (
                          <label
                            key={c.id}
                            className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer border-t"
                          >
                            <Checkbox
                              checked={elegidos.includes(c.id)}
                              onCheckedChange={() => toggle(c.id)}
                            />
                            <span className="truncate">{c.nombre}</span>
                            <span className="ml-auto text-xs text-muted-foreground shrink-0">
                              {c.descripcion_calculo}
                            </span>
                          </label>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {elegidos.length} {elegidos.length === 1 ? 'concepto elegido' : 'conceptos elegidos'}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={cerrar}>Cancelar</Button>
              <Button onClick={handleConfirmar} disabled={!typeId || loading}>
                {loading ? 'Creando...' : 'Crear'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { listRegistrosCombustible, deleteRegistroCombustible } from '../actions.server';
import { TablaRegistrosCombustible } from './TablaRegistrosCombustible';
import { FormRegistroCombustible, type VehiculoOpt } from './FormRegistroCombustible';
import type { RegistroCombustibleClient } from '@/modules/costos/shared/types/combustible.types';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface ServicioOpt {
  id: string;
  nombre: string;
  cliente: string | null;
}

interface Props {
  servicios: ServicioOpt[];
  vehiculos: VehiculoOpt[];
}

export function CombustiblePanel({ servicios, vehiculos }: Props) {
  const [servicioId, setServicioId] = useState<string>(servicios[0]?.id ?? '');
  const [registros, setRegistros] = useState<RegistroCombustibleClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<RegistroCombustibleClient | null>(null);

  const cargar = useCallback(async (id: string) => {
    if (!id) {
      setRegistros([]);
      return;
    }
    setLoading(true);
    try {
      setRegistros(await listRegistrosCombustible(id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cargar registros');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar(servicioId);
  }, [servicioId, cargar]);

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este registro de combustible?')) return;
    try {
      await deleteRegistroCombustible(id);
      cargar(servicioId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  if (servicios.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        No hay servicios activos. Creá un servicio/contrato para cargar combustible.
      </p>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-end justify-between gap-4">
        <div className="space-y-1.5 w-full max-w-sm">
          <Label>Servicio</Label>
          <Select value={servicioId} onValueChange={setServicioId}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar servicio..." />
            </SelectTrigger>
            <SelectContent>
              {servicios.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.nombre}
                  {s.cliente ? ` · ${s.cliente}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          disabled={!servicioId}
          onClick={() => {
            setEditando(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-3.5 w-3.5" /> Cargar registro
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-12">Cargando...</p>
        ) : (
          <TablaRegistrosCombustible
            registros={registros}
            onEdit={(r) => {
              setEditando(r);
              setFormOpen(true);
            }}
            onDelete={handleDelete}
          />
        )}
      </CardContent>

      {servicioId && (
        <FormRegistroCombustible
          key={editando?.id ?? 'nuevo'}
          open={formOpen}
          onOpenChange={setFormOpen}
          servicioId={servicioId}
          vehiculos={vehiculos}
          registro={editando}
          onSaved={() => cargar(servicioId)}
        />
      )}
    </Card>
  );
}

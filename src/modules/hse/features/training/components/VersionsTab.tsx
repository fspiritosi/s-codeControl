'use client';

import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchTrainingVersions, type TrainingVersionRow } from '../version-actions.server';

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString('es-AR') : '—');

const statusLabel = (version: TrainingVersionRow) =>
  version.superseded ? 'Cerrada por cambio de versión' : (version.status ?? '—');

/**
 * Historial de versiones de la capacitación (TKT-827). El listado muestra solo
 * la vigente; las anteriores se consultan acá, y el registro de cada una se
 * descarga desde su propio resumen.
 */
export default function VersionsTab({ trainingId }: { trainingId: string }) {
  const [versions, setVersions] = useState<TrainingVersionRow[] | null>(null);

  useEffect(() => {
    let active = true;
    fetchTrainingVersions(trainingId).then((rows) => {
      if (active) setVersions(rows);
    });
    return () => {
      active = false;
    };
  }, [trainingId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Versiones</CardTitle>
        <CardDescription>
          Cada versión conserva sus intentos y su registro. Al publicar una versión nueva, la anterior se cierra por
          cambio de versión.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {versions === null ? (
          <p className="text-sm text-muted-foreground">Cargando versiones...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Versión</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creada</TableHead>
                <TableHead>Publicada</TableHead>
                <TableHead>Aprobados</TableHead>
                <TableHead>Registro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.map((version) => (
                <TableRow key={version.id}>
                  <TableCell>
                    <span className="font-medium">v{version.version_number}</span>
                    {version.id === trainingId && (
                      <Badge variant="secondary" className="ml-2">
                        Actual
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{statusLabel(version)}</TableCell>
                  <TableCell>{formatDate(version.created_at)}</TableCell>
                  <TableCell>{formatDate(version.published_at)}</TableCell>
                  <TableCell>
                    {version.approved}/{version.total}
                  </TableCell>
                  <TableCell>
                    {version.id === trainingId ? (
                      <span className="text-sm text-muted-foreground">
                        {version.status === 'Cerrada' ? 'Definitivo' : 'Provisorio'}
                      </span>
                    ) : (
                      <Link href={`/dashboard/hse/detail/${version.id}`} className="text-sm underline">
                        {version.status === 'Cerrada' ? 'Ver definitivo' : 'Ver versión'}
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

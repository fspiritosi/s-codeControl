'use client';

import { ShieldAlert } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useRouter } from 'next/navigation';

interface NoAccessViewProps {
  permission?: string;
  module?: string;
  description?: string;
}

export function NoAccessView({ permission, module, description }: NoAccessViewProps) {
  const router = useRouter();

  const defaultDescription =
    'No tiene permisos para acceder a esta sección. Si cree que necesita ingresar a estos datos, solicite permisos a su administrador.';

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="rounded-full bg-destructive/10 p-4 text-destructive">
        <ShieldAlert className="size-10" />
      </div>
      <h2 className="text-xl font-semibold">Acceso restringido</h2>
      <p className="max-w-md text-sm text-muted-foreground">{description ?? defaultDescription}</p>
      {(permission || module) && (
        <p className="text-xs text-muted-foreground/70">
          {module && <span>Módulo: <code className="rounded bg-muted px-1">{module}</code></span>}
          {permission && (
            <>
              {module && ' · '}
              <span>Permiso requerido: <code className="rounded bg-muted px-1">{permission}</code></span>
            </>
          )}
        </p>
      )}
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          Volver
        </Button>
        <Button onClick={() => router.push('/dashboard')}>Ir al dashboard</Button>
      </div>
    </div>
  );
}

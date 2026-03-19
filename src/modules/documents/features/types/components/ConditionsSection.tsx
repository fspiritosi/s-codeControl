'use client';

import { Card } from '@/shared/components/ui/card';

interface ConditionsSectionProps {
  applies: string;
}

export function ConditionsSection({ applies }: ConditionsSectionProps) {
  return (
    <Card className="p-4">
      <p className="text-sm text-muted-foreground">
        Las condiciones especiales permiten que este documento aplique solo a recursos que cumplan
        ciertos criterios.
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        {applies === 'Persona'
          ? 'Condiciones disponibles: género, posición jerárquica, tipo de contrato, gremio, convenio, categoría.'
          : 'Condiciones disponibles: marca, tipo de vehículo.'}
      </p>
    </Card>
  );
}

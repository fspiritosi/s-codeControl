'use client';

import { AlertTriangle, Filter } from 'lucide-react';

import { Card, CardContent, CardDescription } from '@/shared/components/ui/card';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import type { DocumentCondition } from '@/shared/lib/documentConditions';

import { EmployeeConditions } from './EmployeeConditions';
import { EquipmentConditions } from './EquipmentConditions';

// ============================================
// TIPOS
// ============================================

interface ConditionsSectionProps {
  applies: string; // 'Persona' | 'Equipos'
  isConditional: boolean;
  onConditionalChange: (value: boolean) => void;
  conditions: DocumentCondition[];
  onConditionsChange: (conditions: DocumentCondition[]) => void;
}

// ============================================
// HELPERS
// ============================================

function countActiveConditions(conditions: DocumentCondition[]): number {
  return conditions.reduce((acc, c) => acc + c.values.length, 0);
}

// ============================================
// COMPONENTE
// ============================================

export function ConditionsSection({
  applies,
  isConditional,
  onConditionalChange,
  conditions,
  onConditionsChange,
}: ConditionsSectionProps) {
  const activeCount = isConditional ? countActiveConditions(conditions) : 0;
  const hasNoConditions = isConditional && activeCount === 0;

  return (
    <div className="space-y-3">
      {/* Switch de activacion */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="is-conditional" className="font-medium">
            Documento condicional
          </Label>
          {activeCount > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {activeCount} condicion{activeCount !== 1 ? 'es' : ''}
            </span>
          )}
        </div>
        <Switch
          id="is-conditional"
          checked={isConditional}
          onCheckedChange={onConditionalChange}
        />
      </div>

      {/* Contenido colapsable */}
      {isConditional && (
        <Card className="mt-2 border-dashed">
          <CardContent className="pt-4">
            <CardDescription className="mb-4">
              Este documento solo aplicara a{' '}
              {applies === 'Persona' ? 'empleados' : 'equipos'} que cumplan al
              menos una condicion de cada grupo configurado. Los grupos vacios no
              restringen.
            </CardDescription>

            {/* Aviso si no hay condiciones configuradas */}
            {hasNoConditions && (
              <div className="mb-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Condicional activo sin condiciones configuradas. Este documento
                  aplicara a todos los {applies === 'Persona' ? 'empleados' : 'equipos'}.
                </p>
              </div>
            )}

            {applies === 'Persona' && (
              <EmployeeConditions
                conditions={conditions}
                onChange={onConditionsChange}
              />
            )}

            {applies === 'Equipos' && (
              <EquipmentConditions
                conditions={conditions}
                onChange={onConditionsChange}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

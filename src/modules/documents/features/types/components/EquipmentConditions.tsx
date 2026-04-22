'use client';

import { useEffect, useState } from 'react';

import { Label } from '@/shared/components/ui/label';
import { MultiSelect, type OptionType } from '@/shared/components/ui/multi-select-combobox-condition';
import type { DocumentCondition } from '@/shared/lib/documentConditions';
import {
  fetchAllBrandVehicles,
  fetchAllTypesOfVehicles,
} from '@/shared/actions/catalogs';

// ============================================
// TIPOS
// ============================================

interface EquipmentConditionsProps {
  conditions: DocumentCondition[];
  onChange: (conditions: DocumentCondition[]) => void;
  disabled?: boolean;
}

// ============================================
// HELPERS
// ============================================

function getValues(conditions: DocumentCondition[], field: string): string[] {
  return conditions.find((c) => c.field === field)?.values ?? [];
}

function setConditionValues(
  conditions: DocumentCondition[],
  field: string,
  values: string[],
  type: 'enum' | 'relation'
): DocumentCondition[] {
  const existing = conditions.find((c) => c.field === field);
  if (existing) {
    return conditions.map((c) => (c.field === field ? { ...c, values } : c));
  }
  if (values.length === 0) return conditions;
  return [...conditions, { field, values, type }];
}

// ============================================
// COMPONENTE
// ============================================

export function EquipmentConditions({ conditions, onChange, disabled }: EquipmentConditionsProps) {
  const [brands, setBrands] = useState<OptionType[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<OptionType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([fetchAllBrandVehicles(), fetchAllTypesOfVehicles()]).then(
      ([b, t]) => {
        if (cancelled) return;
        // brand_vehicles ya retorna id como string desde el catalog
        setBrands(b.map((x) => ({ value: String(x.id), label: x.name ?? '' })));
        // types_of_vehicles tiene id BigInt
        setVehicleTypes(t.map((x: any) => ({ value: String(x.id), label: x.name ?? '' })));
        setLoading(false);
      }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (field: string) => (values: string[]) => {
    onChange(setConditionValues(conditions, field, values, 'relation'));
  };

  if (loading) {
    return <p className="text-xs text-muted-foreground">Cargando catalogos...</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label className="text-sm">Marca</Label>
        <MultiSelect
          options={brands}
          selectedValues={getValues(conditions, 'brand')}
          setSelectedValues={handleChange('brand')}
          placeholder="Seleccionar marcas..."
          emptyMessage="Sin resultados"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm">Tipo de vehiculo</Label>
        <MultiSelect
          options={vehicleTypes}
          selectedValues={getValues(conditions, 'type_of_vehicle')}
          setSelectedValues={handleChange('type_of_vehicle')}
          placeholder="Seleccionar tipos..."
          emptyMessage="Sin resultados"
        />
      </div>
    </div>
  );
}

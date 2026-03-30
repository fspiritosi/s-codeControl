'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/shared/components/ui/badge';
import { Label } from '@/shared/components/ui/label';
import { MultiSelect, type OptionType } from '@/shared/components/ui/multi-select-combobox-condition';
import { cn } from '@/shared/lib/utils';
import type { DocumentCondition } from '@/shared/lib/documentConditions';
import {
  GENDER_OPTIONS,
  CONTRACT_TYPE_OPTIONS,
} from '@/shared/config/documentConditions';
import {
  fetchAllHierarchies,
  fetchAllCategories,
  fetchAllCovenants,
  fetchAllGuilds,
} from '@/shared/actions/catalogs';

// ============================================
// TIPOS
// ============================================

interface EmployeeConditionsProps {
  conditions: DocumentCondition[];
  onChange: (conditions: DocumentCondition[]) => void;
  disabled?: boolean;
}

// ============================================
// HELPERS
// ============================================

/** Obtiene los values de una condición por field, o [] si no existe */
function getValues(conditions: DocumentCondition[], field: string): string[] {
  return conditions.find((c) => c.field === field)?.values ?? [];
}

/** Actualiza o agrega una condición en el array */
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
  // Solo agregar si tiene valores
  if (values.length === 0) return conditions;
  return [...conditions, { field, values, type }];
}

// ============================================
// ENUM CHIP SELECT
// ============================================

function EnumChipSelect({
  label,
  options,
  selected,
  onChange,
  disabled,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}) {
  const handleToggle = (value: string) => {
    if (disabled) return;
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm">
        {label}
        {selected.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {selected.length}
          </Badge>
        )}
      </Label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => handleToggle(option.value)}
              className={cn(
                'inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background hover:bg-accent hover:text-accent-foreground',
                disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function EmployeeConditions({ conditions, onChange, disabled }: EmployeeConditionsProps) {
  // Catálogos cargados desde server
  const [hierarchies, setHierarchies] = useState<OptionType[]>([]);
  const [categories, setCategories] = useState<OptionType[]>([]);
  const [covenants, setCovenants] = useState<OptionType[]>([]);
  const [guilds, setGuilds] = useState<OptionType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetchAllHierarchies(),
      fetchAllCategories(),
      fetchAllCovenants(),
      fetchAllGuilds(),
    ]).then(([h, cat, cov, g]) => {
      if (cancelled) return;
      setHierarchies(h.map((x) => ({ value: x.id, label: x.name })));
      setCategories(cat.map((x: any) => ({ value: x.id, label: x.name ?? '' })));
      setCovenants(cov.map((x) => ({ value: x.id, label: x.name })));
      setGuilds(g.map((x) => ({ value: x.id, label: x.name })));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Handlers que actualizan el array de conditions
  const handleEnumChange = (field: string) => (values: string[]) => {
    onChange(setConditionValues(conditions, field, values, 'enum'));
  };

  const handleRelationChange = (field: string) => (values: string[]) => {
    onChange(setConditionValues(conditions, field, values, 'relation'));
  };

  return (
    <div className="space-y-4">
      {/* Enums: chips toggleables */}
      <div className="grid gap-4 sm:grid-cols-2">
        <EnumChipSelect
          label="Genero"
          options={GENDER_OPTIONS}
          selected={getValues(conditions, 'gender')}
          onChange={handleEnumChange('gender')}
          disabled={disabled}
        />
        <EnumChipSelect
          label="Tipo de contrato"
          options={CONTRACT_TYPE_OPTIONS}
          selected={getValues(conditions, 'type_of_contract')}
          onChange={handleEnumChange('type_of_contract')}
          disabled={disabled}
        />
      </div>

      {/* Relaciones: multi-select */}
      {loading ? (
        <p className="text-xs text-muted-foreground">Cargando catalogos...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm">Posicion jerarquica</Label>
            <MultiSelect
              options={hierarchies}
              selectedValues={getValues(conditions, 'hierarchical_position')}
              setSelectedValues={handleRelationChange('hierarchical_position')}
              placeholder="Seleccionar posiciones..."
              emptyMessage="Sin resultados"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Categoria</Label>
            <MultiSelect
              options={categories}
              selectedValues={getValues(conditions, 'category_id')}
              setSelectedValues={handleRelationChange('category_id')}
              placeholder="Seleccionar categorias..."
              emptyMessage="Sin resultados"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Convenio</Label>
            <MultiSelect
              options={covenants}
              selectedValues={getValues(conditions, 'covenants_id')}
              setSelectedValues={handleRelationChange('covenants_id')}
              placeholder="Seleccionar convenios..."
              emptyMessage="Sin resultados"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Gremio</Label>
            <MultiSelect
              options={guilds}
              selectedValues={getValues(conditions, 'guild_id')}
              setSelectedValues={handleRelationChange('guild_id')}
              placeholder="Seleccionar gremios..."
              emptyMessage="Sin resultados"
            />
          </div>
        </div>
      )}
    </div>
  );
}

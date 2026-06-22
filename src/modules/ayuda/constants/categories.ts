import {
  Building2,
  Calculator,
  Calendar,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MoreHorizontal,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  Warehouse,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

// Las categorías reflejan los módulos del sidebar de CodeControl
// (ver src/shared/components/layout/SideBarContainer.tsx), para que el usuario
// reporte el ticket sobre el módulo correcto. "Otro" es el catch-all.
export type CategorySlug =
  | 'dashboard'
  | 'empresa'
  | 'empleados'
  | 'equipos'
  | 'documentacion'
  | 'almacenes'
  | 'compras'
  | 'tesoreria'
  | 'mantenimiento'
  | 'formularios'
  | 'operaciones'
  | 'hse'
  | 'costos'
  | 'configuracion'
  | 'otro';

export interface CategoryDef {
  slug: CategorySlug;
  label: string;
  icon: LucideIcon;
}

export const CATEGORIES: CategoryDef[] = [
  { slug: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { slug: 'empresa', label: 'Empresa', icon: Building2 },
  { slug: 'empleados', label: 'Empleados', icon: Users },
  { slug: 'equipos', label: 'Equipos', icon: Truck },
  { slug: 'documentacion', label: 'Documentación', icon: FileText },
  { slug: 'almacenes', label: 'Almacenes', icon: Warehouse },
  { slug: 'compras', label: 'Compras', icon: ShoppingCart },
  { slug: 'tesoreria', label: 'Tesorería', icon: Wallet },
  { slug: 'mantenimiento', label: 'Mantenimiento', icon: Wrench },
  { slug: 'formularios', label: 'Formularios', icon: ClipboardList },
  { slug: 'operaciones', label: 'Operaciones', icon: Calendar },
  { slug: 'hse', label: 'HSE', icon: GraduationCap },
  { slug: 'costos', label: 'Gestión de Costos', icon: Calculator },
  { slug: 'configuracion', label: 'Configuración', icon: Settings },
  { slug: 'otro', label: 'Otro', icon: MoreHorizontal },
];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as [CategorySlug, ...CategorySlug[]];

export const CATEGORY_BY_SLUG: Record<CategorySlug, CategoryDef> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c])
) as Record<CategorySlug, CategoryDef>;

const CATEGORY_BY_LABEL: Record<string, CategoryDef> = Object.fromEntries(
  CATEGORIES.map((c) => [c.label, c])
);

const CATEGORY_PREFIX_RE = /^\[([^\]]+)\]\s*(.*)$/;

export function parseCategoryFromTitle(title: string): {
  categoryLabel: string | null;
  categoryDef: CategoryDef | null;
  cleanTitle: string;
} {
  const match = title.match(CATEGORY_PREFIX_RE);
  if (!match) return { categoryLabel: null, categoryDef: null, cleanTitle: title };
  const label = match[1];
  return {
    categoryLabel: label,
    categoryDef: CATEGORY_BY_LABEL[label] ?? null,
    cleanTitle: match[2] || title,
  };
}

export function buildTitleWithCategory(category: CategorySlug, rawTitle: string): string {
  const label = CATEGORY_BY_SLUG[category]?.label ?? 'Otro';
  return `[${label}] ${rawTitle.trim()}`;
}

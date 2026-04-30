import Link from 'next/link';
import { cn } from '@/shared/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { ParameterCrudTable } from './ParameterCrudTable';
import {
  createHierarchyParameter,
  createTypeOfContractParameter,
  createWorkDiagramParameter,
  getHierarchyParameters,
  getTypesOfContractsParameters,
  getWorkDiagramParameters,
  toggleHierarchyParameterActive,
  toggleTypeOfContractParameterActive,
  toggleWorkDiagramParameterActive,
  updateHierarchyParameter,
  updateTypeOfContractParameter,
  updateWorkDiagramParameter,
} from '../actions.server';
import { getPdfSettings } from '@/modules/settings/features/pdf/actions.server';
import { PdfSettingsForm } from '@/modules/settings/features/pdf/components/PdfSettingsForm';

const NAV_SECTIONS = [
  {
    label: 'Empleados',
    items: [
      { tab: 'hierarchy', label: 'Puestos jerárquicos' },
      { tab: 'work-diagram', label: 'Diagramas de trabajo' },
      { tab: 'contract-type', label: 'Tipos de contrato' },
    ],
  },
  {
    label: 'PDF',
    items: [{ tab: 'pdf', label: 'Encabezado, pie y firma' }],
  },
] as const;

const VALID_TABS = NAV_SECTIONS.flatMap((s) => s.items.map((i) => i.tab));
type SettingsTab = (typeof VALID_TABS)[number];

interface Props {
  currentTab?: string;
}

export default async function SettingsView({ currentTab }: Props) {
  const tab: SettingsTab = (VALID_TABS as readonly string[]).includes(currentTab ?? '')
    ? (currentTab as SettingsTab)
    : 'hierarchy';

  return (
    <section className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
      {/* Sidebar nav */}
      <aside className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold">Configuración</h2>
          <p className="text-sm text-muted-foreground">Parámetros del sistema</p>
        </div>
        <nav className="space-y-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-1.5">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = tab === item.tab;
                  return (
                    <li key={item.tab}>
                      <Link
                        href={`/dashboard/settings?tab=${item.tab}`}
                        className={cn(
                          'block rounded-md px-2 py-1.5 text-sm transition-colors',
                          active
                            ? 'bg-accent text-accent-foreground font-medium'
                            : 'hover:bg-muted text-muted-foreground'
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div className="min-w-0">
        {tab === 'hierarchy' && <HierarchySection />}
        {tab === 'work-diagram' && <WorkDiagramSection />}
        {tab === 'contract-type' && <ContractTypeSection />}
        {tab === 'pdf' && <PdfSection />}
      </div>
    </section>
  );
}

async function HierarchySection() {
  const items = await getHierarchyParameters();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Puestos jerárquicos</CardTitle>
        <CardDescription>
          Categorías de puestos que se asignan a los empleados. Los marcados como
          &quot;Sistema&quot; son del catálogo base y no se pueden modificar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ParameterCrudTable
          title="Listado"
          entityLabel="Puesto"
          items={items.map((h) => ({
            id: h.id,
            name: h.name,
            is_active: h.is_active,
            company_id: h.company_id,
          }))}
          createAction={createHierarchyParameter}
          updateAction={updateHierarchyParameter}
          toggleActiveAction={toggleHierarchyParameterActive}
        />
      </CardContent>
    </Card>
  );
}

async function WorkDiagramSection() {
  const items = await getWorkDiagramParameters();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagramas de trabajo</CardTitle>
        <CardDescription>
          Turnos o esquemas laborales (por ej. 6x1, 5x2, 14x7). Se asignan a los empleados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ParameterCrudTable
          title="Listado"
          entityLabel="Diagrama"
          items={items.map((w) => ({
            id: w.id,
            name: w.name,
            is_active: w.is_active,
            company_id: w.company_id,
          }))}
          createAction={createWorkDiagramParameter}
          updateAction={updateWorkDiagramParameter}
          toggleActiveAction={toggleWorkDiagramParameterActive}
        />
      </CardContent>
    </Card>
  );
}

async function ContractTypeSection() {
  const items = await getTypesOfContractsParameters();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tipos de contrato</CardTitle>
        <CardDescription>
          Modalidades contractuales que se pueden asignar a los empleados. Los marcados como
          &quot;Sistema&quot; son del catálogo base y no se pueden modificar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ParameterCrudTable
          title="Listado"
          entityLabel="Tipo de contrato"
          items={items.map((c) => ({
            id: c.id,
            name: c.name,
            is_active: c.is_active,
            company_id: c.company_id,
          }))}
          createAction={createTypeOfContractParameter}
          updateAction={updateTypeOfContractParameter}
          toggleActiveAction={toggleTypeOfContractParameterActive}
        />
      </CardContent>
    </Card>
  );
}

async function PdfSection() {
  const settings = await getPdfSettings();
  if (!settings) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No hay empresa activa.
        </CardContent>
      </Card>
    );
  }
  return <PdfSettingsForm initial={settings} />;
}

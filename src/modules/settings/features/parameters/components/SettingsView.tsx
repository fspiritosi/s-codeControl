import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import {
  UrlTabs,
  UrlTabsContent,
  UrlTabsList,
  UrlTabsTrigger,
} from '@/shared/components/ui/url-tabs';
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
import { getPdfEmailSettings, getPdfSettings } from '@/modules/settings/features/pdf/actions.server';
import { PdfSettingsForm } from '@/modules/settings/features/pdf/components/PdfSettingsForm';
import { PdfEmailSettingsForm } from '@/modules/settings/features/pdf/components/PdfEmailSettingsForm';
import RolesAndPermissionsSection from '@/modules/settings/features/roles/components/RolesAndPermissionsSection';
import { can } from '@/shared/lib/permissions';
import { getSession } from '@/shared/lib/session';
import { prisma } from '@/shared/lib/prisma';

const VALID_SECTIONS = ['employees', 'pdf', 'roles'] as const;
type Section = (typeof VALID_SECTIONS)[number];

interface Props {
  currentSection?: string;
}

export default async function SettingsView({ currentSection }: Props) {
  const section: Section = (VALID_SECTIONS as readonly string[]).includes(currentSection ?? '')
    ? (currentSection as Section)
    : 'employees';

  const canViewRoles = await can('roles.view');

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Configuración</h2>
        <p className="text-sm text-muted-foreground">Parámetros del sistema</p>
      </div>

      <UrlTabs value={section} paramName="section" baseUrl="/dashboard/settings">
        <UrlTabsList>
          <UrlTabsTrigger value="employees">Empleados</UrlTabsTrigger>
          <UrlTabsTrigger value="pdf">PDF</UrlTabsTrigger>
          {canViewRoles && <UrlTabsTrigger value="roles">Roles y permisos</UrlTabsTrigger>}
        </UrlTabsList>

        <UrlTabsContent value="employees">
          {section === 'employees' && <EmployeesSection />}
        </UrlTabsContent>

        <UrlTabsContent value="pdf">
          {section === 'pdf' && <PdfSection />}
        </UrlTabsContent>

        {canViewRoles && (
          <UrlTabsContent value="roles">
            {section === 'roles' && <RolesAndPermissionsSection />}
          </UrlTabsContent>
        )}
      </UrlTabs>
    </section>
  );
}

async function EmployeesSection() {
  const [hierarchy, workDiagrams, contractTypes] = await Promise.all([
    getHierarchyParameters(),
    getWorkDiagramParameters(),
    getTypesOfContractsParameters(),
  ]);

  return (
    <Tabs defaultValue="hierarchy" className="space-y-4">
      <TabsList>
        <TabsTrigger value="hierarchy">Puestos jerárquicos</TabsTrigger>
        <TabsTrigger value="work-diagram">Diagramas de trabajo</TabsTrigger>
        <TabsTrigger value="contract-type">Tipos de contrato</TabsTrigger>
      </TabsList>

      <TabsContent value="hierarchy">
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
              items={hierarchy.map((h) => ({
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
      </TabsContent>

      <TabsContent value="work-diagram">
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
              items={workDiagrams.map((w) => ({
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
      </TabsContent>

      <TabsContent value="contract-type">
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
              items={contractTypes.map((c) => ({
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
      </TabsContent>
    </Tabs>
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

  const [emailSettings, session] = await Promise.all([
    getPdfEmailSettings(),
    getSession(),
  ]);

  let companyContactEmail: string | null = null;
  if (session.company?.id) {
    const c = await prisma.company.findUnique({
      where: { id: session.company.id },
      select: { contact_email: true },
    });
    companyContactEmail = c?.contact_email ?? null;
  }

  return (
    <div className="space-y-4">
      <PdfSettingsForm initial={settings} />
      <PdfEmailSettingsForm initial={emailSettings} companyContactEmail={companyContactEmail} />
    </div>
  );
}

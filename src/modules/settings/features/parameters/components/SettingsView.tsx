import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
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

const VALID_TABS = ['hierarchy', 'work-diagram', 'contract-type'] as const;
type SettingsTab = (typeof VALID_TABS)[number];

interface Props {
  currentTab?: string;
}

export default async function SettingsView({ currentTab }: Props) {
  const tab: SettingsTab = VALID_TABS.includes(currentTab as SettingsTab)
    ? (currentTab as SettingsTab)
    : 'hierarchy';

  const [hierarchy, workDiagrams, contractTypes] = await Promise.all([
    getHierarchyParameters(),
    getWorkDiagramParameters(),
    getTypesOfContractsParameters(),
  ]);

  return (
    <UrlTabs value={tab} paramName="tab" baseUrl="/dashboard/settings">
      <UrlTabsList>
        <UrlTabsTrigger value="hierarchy">Puestos jerárquicos</UrlTabsTrigger>
        <UrlTabsTrigger value="work-diagram">Diagramas de trabajo</UrlTabsTrigger>
        <UrlTabsTrigger value="contract-type">Tipo de contrato</UrlTabsTrigger>
      </UrlTabsList>

      <UrlTabsContent value="hierarchy">
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
      </UrlTabsContent>

      <UrlTabsContent value="work-diagram">
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
      </UrlTabsContent>

      <UrlTabsContent value="contract-type">
        <Card>
          <CardHeader>
            <CardTitle>Tipo de contrato</CardTitle>
            <CardDescription>
              Modalidades contractuales que se pueden asignar a los empleados. Los marcados
              como &quot;Sistema&quot; son del catálogo base y no se pueden modificar.
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
      </UrlTabsContent>
    </UrlTabs>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  UrlTabs,
  UrlTabsContent,
  UrlTabsList,
  UrlTabsTrigger,
} from '@/shared/components/ui/url-tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { ParameterCrudTable } from './ParameterCrudTable';
import {
  createHierarchyParameter,
  createWorkDiagramParameter,
  getHierarchyParameters,
  getTypeOfContractValues,
  getWorkDiagramParameters,
  toggleHierarchyParameterActive,
  toggleWorkDiagramParameterActive,
  updateHierarchyParameter,
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
    getTypeOfContractValues(),
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
              Valores fijos del sistema. Próximamente serán editables por empresa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="w-[140px]">Origen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contractTypes.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">Sistema</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </UrlTabsContent>
    </UrlTabs>
  );
}

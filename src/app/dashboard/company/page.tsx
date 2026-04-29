import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { UrlTabs, UrlTabsContent, UrlTabsList, UrlTabsTrigger } from '@/shared/components/ui/url-tabs';
import { CompaniesListView } from '@/modules/company/features/detail/components/CompaniesListView';
import { CompanyGroupsView } from '@/modules/company/features/groups/components/CompanyGroupsView';
import {
  listCompanyGroups,
  listAllCompaniesForGrouping,
} from '@/modules/company/features/groups/actions.server';

const VALID_TABS = ['companies', 'groups'] as const;
type CompanyTab = (typeof VALID_TABS)[number];

export default async function CompanyPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const resolved = await searchParams;
  const currentTab: CompanyTab = VALID_TABS.includes(resolved.tab as CompanyTab)
    ? (resolved.tab as CompanyTab)
    : 'companies';

  const [groups, allCompanies] = await Promise.all([
    listCompanyGroups(),
    listAllCompaniesForGrouping(),
  ]);

  return (
    <Suspense fallback={<div className="p-10">Cargando...</div>}>
      <UrlTabs value={currentTab} paramName="tab" baseUrl="/dashboard/company">
        <UrlTabsList>
          <UrlTabsTrigger value="companies">Compañías</UrlTabsTrigger>
          <UrlTabsTrigger value="groups">Grupos compartidos</UrlTabsTrigger>
        </UrlTabsList>

        <UrlTabsContent value="companies">
          <Card>
            <CardHeader>
              <CardTitle>Todas las Compañías</CardTitle>
              <CardDescription>Aquí se verán todas las compañías</CardDescription>
            </CardHeader>
            <CardContent>
              <CompaniesListView />
            </CardContent>
          </Card>
        </UrlTabsContent>

        <UrlTabsContent value="groups">
          <CompanyGroupsView groups={groups} allCompanies={allCompanies} />
        </UrlTabsContent>
      </UrlTabs>
    </Suspense>
  );
}

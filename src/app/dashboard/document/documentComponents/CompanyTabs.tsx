import { CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompanyDocumentsType, useLoggedUserStore } from '@/store/loggedUser';
import { DataTable } from '../../company/actualCompany/components/data-table';
import { columnsDocuments } from '../../company/actualCompany/components/document-colums';

function CompanyTabs({ companyData }: { companyData: CompanyDocumentsType[] }) {
  const ownerUser = useLoggedUserStore.getState().profile;
  const sharedUsersAll = useLoggedUserStore.getState().sharedUsers;
  const sharedUsers =
    sharedUsersAll?.map((user) => {
      return {
        email: user.profile_id.email,
        fullname: user.profile_id.fullname,
        role: user?.role,
        alta: user.created_at,
        id: user.id,
        img: user.profile_id.avatar || '',
      };
    }) || [];
  const owner = ownerUser?.map((user) => {
    return {
      email: user.email,
      fullname: user.fullname as string,
      role: 'Propietario',
      alta: user.created_at ? new Date(user.created_at) : new Date(),
      id: user.id || '',
      img: user.avatar || '',
    };
  });

  const data = owner?.concat(
    sharedUsers?.map((user) => ({
      ...user,
      fullname: user.fullname || '',
    })) || []
  );

  const documentCompany = companyData
    ?.filter((e) => !e.id_document_types.private && !e.id_document_types.is_it_montlhy)
    .map((document) => {
      const sharedUserRole = data?.find((e) => e.email === document.user_id?.email)?.role;
      return {
        email: document.user_id?.email ?? 'Documento pendiente',
        fullname: document.id_document_types.name,
        role: sharedUserRole ?? 'Documento pendiente',
        alta: (document.user_id?.email && document.created_at) ?? 'Documento pendiente',
        id: document.id_document_types.id,
        img: document.user_id?.avatar,
        vencimiento: document.validity
          ? document.validity
          : document.id_document_types.explired
            ? 'Documento pendiente'
            : 'No expira',
        documentId: document.id,
        private: document.id_document_types.private,
      };
    });
  const documentCompanyMensual = companyData
    ?.filter((e) => !e.id_document_types.private && e.id_document_types.is_it_montlhy)
    .map((document) => {
      const sharedUserRole = data?.find((e) => e.email === document.user_id?.email)?.role;
      return {
        email: document.user_id?.email ?? 'Documento pendiente',
        fullname: document.id_document_types.name,
        role: sharedUserRole ?? 'Documento pendiente',
        alta: (document.user_id?.email && document.created_at) ?? 'Documento pendiente',
        id: document.id_document_types.id,
        img: document.user_id?.avatar,
        vencimiento: document.validity
          ? document.validity
          : document.id_document_types.explired
            ? 'Documento pendiente'
            : 'No expira',
        documentId: document.id,
        private: document.id_document_types.private,
      };
    });
  return (
    <Tabs defaultValue="permanentes">
      <CardContent>
        <TabsList>
          <TabsTrigger value="permanentes">Documentos permanentes</TabsTrigger>
          <TabsTrigger value="mensuales">Documentos mensuales</TabsTrigger>
        </TabsList>
      </CardContent>
      <TabsContent value="permanentes">
        <div className="p-4">
          <DataTable isDocuments data={documentCompany || []} columns={columnsDocuments} />
        </div>
      </TabsContent>
      <TabsContent value="mensuales">
        <div className="p-4">
          <DataTable isDocuments data={documentCompanyMensual || []} columns={columnsDocuments} />
        </div>
      </TabsContent>
    </Tabs>
  );
}

export default CompanyTabs;

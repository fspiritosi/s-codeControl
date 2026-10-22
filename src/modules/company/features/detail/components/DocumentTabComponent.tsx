import { DataTable } from '@/shared/components/data-table';
import type { DataTableFacetedFilterConfig } from '@/shared/components/data-table';
import { columnsDocuments } from '@/modules/company/features/detail/components/document-columns';

const DOCUMENT_COMPANY_FILTERS: DataTableFacetedFilterConfig[] = [
  { columnId: 'fullname', title: 'Nombre del documento', type: 'text' },
  { columnId: 'email', title: 'Subido por', type: 'text' },
  { columnId: 'role', title: 'Rol', type: 'text' },
  { columnId: 'alta', title: 'Subido el', type: 'text' },
  { columnId: 'private', title: 'Acceso', type: 'text' },
  { columnId: 'vencimiento', title: 'Vencimiento', type: 'text' },
];
import { prisma } from '@/shared/lib/prisma';
import { fetchCurrentUser } from '@/shared/actions/auth';
import { cookies } from 'next/headers';

export default async function DocumentTabComponent() {
  const cookiesStore = await cookies();
  const user = await fetchCurrentUser();
  const userId = user?.id || '';
  const actualCompany = cookiesStore.get('actualComp')?.value;

  const [ownerUser, userShared, documents_company] = await Promise.all([
    prisma.profile.findMany({ where: { id: userId } }),
    prisma.share_company_users.findMany({
      where: { profile_id: userId },
      include: { profile: true, customer: true },
    }),
    prisma.documents_company.findMany({
      where: { applies: actualCompany || '' },
      include: { document_type: true, user: true },
    }),
  ]);

  const ownerData = ownerUser.map((owner) => ({
    email: owner.email,
    fullname: owner.fullname as string,
    role: 'Propietario',
    alta: owner.created_at ? new Date(owner.created_at) : new Date(),
    id: owner.id || '',
    img: owner.avatar || '',
  }));
  const sharedUsers = userShared.map((shared) => ({
    email: shared.profile?.email,
    fullname: shared.profile?.fullname,
    role: shared.role,
    alta: shared.created_at,
    id: shared.id,
    img: shared.profile?.avatar || '',
    customerName: shared.customer?.name,
  }));
  const data = [
    ...ownerData,
    ...sharedUsers
      .filter((shared) => shared.role !== 'Invitado')
      .map((shared) => ({ ...shared, fullname: shared.fullname || '' })),
  ];

  const documentCompany = documents_company.map((document) => {
    const sharedUserRole = data?.find((e) => e.email === document.user?.email)?.role;
    return {
      email: document.user?.email ?? 'Documento pendiente',
      fullname: document.document_type?.name ?? '',
      role: sharedUserRole ?? 'Documento pendiente',
      alta: (document.user?.email && document.created_at) ?? 'Documento pendiente',
      id: document.document_type?.id ?? '',
      img: document.user?.avatar ?? '',
      vencimiento: document.validity
        ? document.validity
        : document.document_type?.explired
          ? 'Documento pendiente'
          : 'No expira',
      documentId: document.id,
      private: document.document_type?.private,
    };
  });
  return (
    <div>
      <div className="px-8 pb-8">
        <DataTable
          data={documentCompany || []}
          columns={columnsDocuments}
          facetedFilters={DOCUMENT_COMPANY_FILTERS}
          showFilterToggle
          tableId="company-documents"
        />
      </div>
    </div>
  );
}

import { DataTable } from '@/app/dashboard/company/actualCompany/components/data-table';
import { columnsDocuments } from '@/app/dashboard/company/actualCompany/components/document-colums';
import { supabaseServer } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export default async function DocumentTabComponent() {
  const supabase = supabaseServer();
  const cookiesStore = cookies();
  const user = await supabase.auth.getUser();

  const { data: owner } = await supabase
    .from('profile')
    .select('*')
    .eq('id', user?.data?.user?.id || '');
  const ownerUser = owner;

  const { data: userShared } = await supabase
    .from('share_company_users')
    .select('*')
    .eq('profile_id', user?.data?.user?.id || '');
  const sharedUsersAll = userShared;
  const role: string | null = userShared?.[0]?.role || null;
  const actualCompany = cookiesStore.get('actualComp')?.value;

  let { data: documents_company, error: documents_company_error } = await supabase
    .from('documents_company')
    .select('*,id_document_types(*),user_id(*)')
    .eq('applies', actualCompany || '');

  const AllCompanyDocuments = documents_company;
  const ownerData = ownerUser?.map((user) => {
    return {
      email: user.email,
      fullname: user.fullname as string,
      role: 'Propietario',
      alta: user.created_at ? new Date(user.created_at) : new Date(),
      id: user.id || '',
      img: user.avatar || '',
    };
  });
  const sharedUsers =
    sharedUsersAll?.map((user: any) => {
      return {
        email: user.profile_id.email,
        fullname: user.profile_id.fullname,
        role: user?.role,
        alta: user.created_at,
        id: user.id,
        img: user.profile_id.avatar || '',
        customerName: user.customer_id?.name,
      };
    }) || [];
  const guestsData =
    sharedUsers
      ?.filter((user) => user.role === 'Invitado') // Filtrar usuarios donde el rol no sea "Invitado"
      ?.map((user) => ({
        ...user,
        fullname: user.fullname || '',
      })) || [];
  const data = owner?.concat(
    (sharedUsers
      ?.filter((user) => user.role !== 'Invitado') // Filtrar usuarios donde el rol no sea "Invitado"
      ?.map((user) => ({
        ...user,
        fullname: user.fullname || '',
      })) as any) || []
  );

  const documentCompany = AllCompanyDocuments?.map((document: any) => {
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
    <div>
      <div className="px-8 pb-8">
        <DataTable isDocuments data={documentCompany || []} columns={columnsDocuments} />
      </div>
    </div>
  );
}

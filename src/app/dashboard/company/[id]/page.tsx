import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { prisma } from '@/shared/lib/prisma';
import { fetchCurrentUser } from '@/shared/actions/auth';
import { fetchCitiesByProvince } from '@/shared/actions/geography';
import { cn } from '@/shared/lib/utils';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { redirect } from 'next/navigation';
import { EditCompanyForm } from '@/modules/company/features/create/components/EditCompanyForm';

export default async function CompanyEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await fetchCurrentUser();
  if (!user?.id) redirect('/login');

  const Companies = await prisma.company.findMany({ where: { owner_id: user.id } });

  const companyData = await prisma.company.findFirst({
    where: { owner_id: user.id, id },
    include: { city_rel: true, province_rel: true },
  });

  if (!companyData) {
    return (
      <section className={cn('md:mx-7')}>
        <Alert variant={'info'} className="w-fit">
          <AlertTitle className="flex justify-center items-center">
            <InfoCircledIcon className="inline size-5 mr-2 text-blue-500" />
            No se encontró la compañía.
          </AlertTitle>
          <AlertDescription>Verificá que el ID corresponda a una compañía tuya.</AlertDescription>
        </Alert>
      </section>
    );
  }

  const share_company_users = await prisma.share_company_users.findMany({
    where: { profile_id: user.id },
  });

  const showAlert = !Companies?.[0] && !share_company_users?.[0];

  const [provinces, industries] = await Promise.all([
    prisma.provinces.findMany({ orderBy: { name: 'asc' } }),
    prisma.industry_type.findMany({ where: { is_active: true } }),
  ]);

  const provinceId = companyData.province_id ? String(companyData.province_id) : '';
  const cityId = companyData.city ? String(companyData.city) : '';

  const initialCities = companyData.province_id
    ? await fetchCitiesByProvince(Number(companyData.province_id))
    : [];

  return (
    <section className={cn('md:mx-7')}>
      {showAlert && (
        <Alert variant={'info'} className="w-fit mb-4">
          <AlertTitle className="flex justify-center items-center">
            <InfoCircledIcon className="inline size-5 mr-2 text-blue-500" />
            Editar Compañía registrada.
          </AlertTitle>
          <AlertDescription>Aquí podrás editar tu compañía</AlertDescription>
        </Alert>
      )}
      <EditCompanyForm
        companyId={companyData.id}
        initial={{
          company_name: companyData.company_name,
          company_cuit: companyData.company_cuit,
          website: companyData.website,
          contact_email: companyData.contact_email,
          contact_phone: companyData.contact_phone,
          address: companyData.address,
          country: companyData.country,
          description: companyData.description,
          industry: companyData.industry,
          province_id: provinceId,
          city: cityId,
          company_logo: companyData.company_logo,
          by_defect: !!companyData.by_defect,
        }}
        provinces={provinces.map((p) => ({ id: Number(p.id), name: p.name ?? '' }))}
        industries={industries.map((i) => ({ id: Number(i.id), name: i.name }))}
        initialCities={(initialCities ?? []).map((c: any) => ({ id: Number(c.id), name: c.name ?? '' }))}
      />
    </section>
  );
}

import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Card, CardDescription, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { prisma } from '@/shared/lib/prisma';
import { fetchCurrentUser } from '@/shared/actions/auth';

import { Checkbox } from '@/shared/components/ui/checkbox';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/lib/utils';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { redirect } from 'next/navigation';
import CityInput from '@/modules/company/features/create/components/CityInput';
import EditCompanyButton from '@/modules/company/features/create/components/EditCompanyButton';
export default async function companyRegister({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await fetchCurrentUser();
  if (!user?.id) redirect('/login');

  const Companies = await prisma.company.findMany({
    where: { owner_id: user.id },
  });

  const companyData = await prisma.company.findFirst({
    where: { owner_id: user.id, id },
    include: {
      city_rel: true,
      province_rel: true,
    },
  });

  // Reshape to match old Supabase shape
  const companyDataShaped = companyData ? {
    ...companyData,
    city: companyData.city_rel,
    province_id: companyData.province_rel,
  } : null;

  const share_company_users = await prisma.share_company_users.findMany({
    where: { profile_id: user.id },
  });

  const showAlert = !Companies?.[0] && !share_company_users?.[0];

  const provinces = await prisma.provinces.findMany();

  const industry_type = await prisma.industry_type.findMany();

  return (
    <section className={cn('md:mx-7')}>
      {showAlert && (
        <Alert variant={'info'} className="w-fit">
          <AlertTitle className="flex justify-center items-center">
            <InfoCircledIcon className="inline size-5 mr-2 text-blue-500" />
            Editar Compañía registrada.
          </AlertTitle>
          <AlertDescription>Aquí podras editar tu compañía</AlertDescription>
        </Alert>
      )}

      <Card className="mt-6 p-8">
        <CardTitle className="text-4xl mb-3">Editar Compañía</CardTitle>
        <CardDescription>Edita este formulario con los datos que desees modificar</CardDescription>
        <div className="mt-6 rounded-xl flex w-full">
          <form>
            <div className=" flex flex-wrap gap-8 items-center w-full">
              <div>
                <Label htmlFor="company_name">Nombre de la compañía</Label>
                <Input
                  defaultValue={companyDataShaped?.company_name}
                  value={companyDataShaped?.company_name}
                  id="company_name"
                  name="company_name"
                  className="max-w-[350px] w-[300px]"
                  placeholder="nombre de la compañía"
                />
                <CardDescription id="company_name_error" className="max-w-[300px]" />
              </div>
              <div>
                <Label htmlFor="company_cuit">CUIT de la compañía</Label>
                <Input
                  defaultValue={companyDataShaped?.company_cuit}
                  name="company_cuit"
                  id="company_cuit"
                  className="max-w-[350px] w-[300px]"
                  placeholder="nombre de la compañía"
                />
                <CardDescription id="company_cuit_error" className="max-w-[300px]" />
              </div>
              <div>
                <Label htmlFor="website">Sitio Web</Label>
                <Input
                  defaultValue={companyDataShaped?.website || ''}
                  id="website"
                  name="website"
                  className="max-w-[350px] w-[300px]"
                  placeholder="nombre de la compañía"
                />

                <CardDescription id="website_error" className="max-w-[300px]" />
              </div>

              <div>
                <Label htmlFor="contact_email">Email</Label>
                <Input
                  defaultValue={companyDataShaped?.contact_email}
                  id="contact_email"
                  name="contact_email"
                  className="max-w-[350px] w-[300px]"
                  placeholder="nombre de la compañía"
                />
                <CardDescription id="contact_email_error" className="max-w-[300px]" />
              </div>
              <div>
                <Label htmlFor="contact_phone">Número de teléfono</Label>
                <Input
                  defaultValue={companyDataShaped?.contact_phone}
                  id="contact_phone"
                  name="contact_phone"
                  className="max-w-[350px] w-[300px]"
                  placeholder="nombre de la compañía"
                />
                <CardDescription id="contact_phone_error" className="max-w-[300px]" />
              </div>
              <div>
                <Label htmlFor="address">Dirección</Label>
                <Input
                  defaultValue={companyDataShaped?.address}
                  id="address"
                  name="address"
                  className="max-w-[350px] w-[300px]"
                  placeholder="nombre de la compañía"
                />
                <CardDescription id="address_error" className="max-w-[300px]" />
              </div>
              <div>
                <Label htmlFor="country">Seleccione un país</Label>
                <Select defaultValue={companyDataShaped?.country} name="country">
                  <SelectTrigger id="country" name="country" className="max-w-[350px]  w-[300px]">
                    <SelectValue placeholder="Seleccionar país" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="argentina">Argentina</SelectItem>
                  </SelectContent>
                </Select>

                <CardDescription id="country_error" className="max-w-[300px]" />
              </div>
              <CityInput
                provinces={provinces}
                defaultProvince={companyDataShaped?.province_id}
                defaultCity={companyDataShaped?.city}
              />
              <div>
                <Label htmlFor="industry">Seleccione una Industria</Label>
                <Select defaultValue={companyDataShaped?.industry} name="industry">
                  <SelectTrigger id="industry" name="industry" className="max-w-[350px] w-[300px]">
                    <SelectValue id="industry" placeholder="Seleccionar Industria" />
                  </SelectTrigger>
                  <SelectContent>
                    {industry_type?.map((ind) => (
                      <SelectItem key={ind?.id} value={ind?.name || ''}>
                        {ind?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <CardDescription id="industry_error" className="max-w-[300px]" />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  // disabled={!formEnabledProp}
                  defaultValue={companyDataShaped?.description}
                  id="description"
                  name="description"
                  className="max-w-[350px] w-[300px]"
                  placeholder="Descripción de la compañía"
                />

                <CardDescription id="description_error" className="max-w-[300px]" />
              </div>
              <div className="flex flex-row-reverse gap-2 justify-center items-center max-w-[300px] w-[300px]">
                <Label htmlFor="by_defect max-w-[300px] w-[300px]">Marcar para seleccionar Compañia por defecto</Label>
                <Checkbox id="by_defect" name="by_defect" />
              </div>
            </div>
            <EditCompanyButton defaultImage={companyDataShaped?.company_logo} />
          </form>
        </div>
      </Card>
    </section>
  );
}

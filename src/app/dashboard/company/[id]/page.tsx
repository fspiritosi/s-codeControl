import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabaseServer } from '@/lib/supabase/server';

import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { revalidatePath } from 'next/cache';
import CityInput from '../new/components/CityInput';
import EditCompanyButton from '../new/components/EditCompanyButton';
export default async function companyRegister({ params }: { params: { id: string } }) {
  const supabase = supabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data } = await supabase
    .from('profile')
    .select('*')
    .eq('email', session?.user.email || '');

  const { data: Companies, error } = await supabase
    .from('company')
    .select(`*`)
    .eq('owner_id', data?.[0]?.id || '');

  const { data: companyData, error: companyError } = await supabase
    .from('company')
    .select('*,city(*),province_id(*)')
    .eq('owner_id', data?.[0]?.id || '')
    .eq('id', params.id)
    .single();

  let { data: share_company_users, error: sharedError } = await supabase
    .from('share_company_users')
    .select(`*`)
    .eq('profile_id', data?.[0]?.id || '');

  revalidatePath('/dashboard/company/new');

  const showAlert = !Companies?.[0] && !share_company_users?.[0];

  let { data: provinces, error: provincesError } = await supabase.from('provinces').select('*');

  let { data: industry_type, error: industryError } = await supabase.from('industry_type').select('*');

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
                  defaultValue={companyData?.company_name}
                  value={companyData?.company_name}
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
                  defaultValue={companyData?.company_cuit}
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
                  defaultValue={companyData?.website || ''}
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
                  defaultValue={companyData?.contact_email}
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
                  defaultValue={companyData?.contact_phone}
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
                  defaultValue={companyData?.address}
                  id="address"
                  name="address"
                  className="max-w-[350px] w-[300px]"
                  placeholder="nombre de la compañía"
                />
                <CardDescription id="address_error" className="max-w-[300px]" />
              </div>
              <div>
                <Label htmlFor="country">Seleccione un país</Label>
                <Select defaultValue={companyData?.country} name="country">
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
                defaultProvince={companyData?.province_id}
                defaultCity={companyData?.city}
              />
              <div>
                <Label htmlFor="industry">Seleccione una Industria</Label>
                <Select defaultValue={companyData?.industry} name="industry">
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
                  defaultValue={companyData?.description}
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
            <EditCompanyButton defaultImage={companyData?.company_logo} />
          </form>
        </div>
      </Card>
    </section>
  );
}

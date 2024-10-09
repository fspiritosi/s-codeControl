import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabaseServer } from '@/lib/supabase/server';

import { cn } from '@/lib/utils';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { revalidatePath } from 'next/cache';
import CityInput from './components/CityInput';
import CreateCompanyButton from './components/CreateCompanyButton';
export default async function companyRegister() {
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
            Parece que no tienes ninguna Compañía registrada.
          </AlertTitle>
          <AlertDescription>Para utilizar la aplicación debes registrar tu compañía</AlertDescription>
        </Alert>
      )}

      <Card className="mt-6 p-8">
        <CardTitle className="text-4xl mb-3">Registrar Compañía</CardTitle>
        <CardDescription>Completa este formulario con los datos de tu nueva compañia</CardDescription>
        <div className="mt-6 rounded-xl flex w-full">
          <form>
            <div className=" flex flex-wrap gap-8 items-center w-full">
              <div>
                <Label htmlFor="company_name">Nombre de la compañía</Label>
                <Input
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
                  id="address"
                  name="address"
                  className="max-w-[350px] w-[300px]"
                  placeholder="nombre de la compañía"
                />
                <CardDescription id="address_error" className="max-w-[300px]" />
              </div>
              <div>
                <Label htmlFor="country">Seleccione un país</Label>
                <Select name="country">
                  <SelectTrigger id="country" name="country" className="max-w-[350px]  w-[300px]">
                    <SelectValue placeholder="Seleccionar país" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="argentina">Argentina</SelectItem>
                  </SelectContent>
                </Select>

                <CardDescription id="country_error" className="max-w-[300px]" />
              </div>
              <CityInput provinces={provinces} />
              <div>
                <Label htmlFor="industry">Seleccione una Industria</Label>
                <Select
                  // disabled={!formEnabledProp}
                  // onValueChange={handleIndustryChange}
                  name="industry"
                >
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
            <CreateCompanyButton />
          </form>
        </div>
      </Card>
    </section>
  );
}

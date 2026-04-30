'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';
import { Textarea } from '@/shared/components/ui/textarea';

import { editCompanySchema } from '@/shared/zodSchemas/schemas';
import { fetchCitiesByProvince } from '@/shared/actions/geography';
import { storage } from '@/shared/lib/storage';
import { EditCompany } from '@/modules/company/features/create/actions.server';
import { handleSupabaseError } from '@/shared/lib/errorHandler';

type FormValues = z.infer<typeof editCompanySchema>;

interface ProvinceOpt {
  id: number | bigint;
  name: string;
}
interface IndustryOpt {
  id: number | bigint;
  name: string | null;
}
interface InitialCity {
  id: number | bigint;
  name?: string;
}

interface Props {
  companyId: string;
  initial: {
    company_name: string;
    company_cuit: string;
    website: string | null;
    contact_email: string;
    contact_phone: string;
    address: string;
    country: string;
    description: string;
    industry: string;
    province_id: string;
    city: string;
    company_logo: string | null;
    by_defect: boolean;
  };
  provinces: ProvinceOpt[];
  industries: IndustryOpt[];
  initialCities: InitialCity[];
}

export function EditCompanyForm({ companyId, initial, provinces, industries, initialCities }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [base64Preview, setBase64Preview] = useState<string>('');
  const [cities, setCities] = useState<InitialCity[]>(initialCities);

  const form = useForm<FormValues>({
    resolver: zodResolver(editCompanySchema),
    defaultValues: {
      company_name: initial.company_name,
      company_cuit: initial.company_cuit,
      website: initial.website ?? '',
      contact_email: initial.contact_email,
      contact_phone: initial.contact_phone,
      address: initial.address,
      country: initial.country,
      description: initial.description,
      industry: initial.industry,
      province_id: initial.province_id,
      city: initial.city,
      company_logo: initial.company_logo ?? '',
      by_defect: initial.by_defect,
    },
  });

  const watchedProvince = form.watch('province_id');

  useEffect(() => {
    let cancelled = false;
    if (!watchedProvince) {
      setCities([]);
      return;
    }
    fetchCitiesByProvince(parseInt(watchedProvince, 10))
      .then((res) => {
        if (!cancelled) setCities((res ?? []) as InitialCity[]);
      })
      .catch((err) => {
        console.error('Error fetching cities:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [watchedProvince]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') setBase64Preview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (values: FormValues) => {
    toast.promise(
      async () => {
        let logoUrl = initial.company_logo ?? '';

        if (imageFile) {
          const cuit = values.company_cuit;
          const existing = await storage.list('logo', '', { search: cuit });
          if (existing?.length) {
            for (const f of existing) {
              const ext = f.name.split('.').pop();
              if (ext) await storage.remove('logo', [`${cuit}.${ext}`]);
            }
          }
          const fileExtension = imageFile.name.split('.').pop();
          const renamed = new File([imageFile], `${cuit}.${fileExtension}`, {
            type: `image/${fileExtension?.replace(/\s/g, '')}`,
          });
          const uploaded = await storage.upload('logo', `${cuit}.${fileExtension}`, renamed);
          logoUrl = storage.getPublicUrl('logo', uploaded?.path || '');
        }

        const formData = new FormData();
        formData.set('company_name', values.company_name);
        formData.set('company_cuit', values.company_cuit);
        formData.set('website', values.website ?? '');
        formData.set('contact_email', values.contact_email);
        formData.set('contact_phone', values.contact_phone);
        formData.set('address', values.address);
        formData.set('country', values.country);
        formData.set('industry', values.industry);
        formData.set('description', values.description);
        formData.set('province_id', values.province_id);
        formData.set('city', values.city);
        formData.set('by_defect', values.by_defect ? 'true' : 'false');

        const { error } = await EditCompany(formData, logoUrl, companyId);
        if (error) {
          console.error('[EditCompanyForm] EditCompany error:', error);
          const friendly = handleSupabaseError(error.message);
          throw new Error(
            friendly === 'Ha ocurrido un error al procesar la solicitud' ? error.message : friendly
          );
        }

        router.refresh();
        router.push('/dashboard/company/actualCompany');
      },
      {
        loading: 'Guardando cambios...',
        success: 'Cambios guardados',
        error: (err) => (err instanceof Error ? err.message : String(err)),
      }
    );
  };

  return (
    <Card className="p-8">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-3xl">Editar Compañía</CardTitle>
        <CardDescription>Edita los datos de la compañía y guardá los cambios</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-wrap gap-6">
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem className="w-[300px]">
                    <FormLabel>Nombre de la compañía</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company_cuit"
                render={({ field }) => (
                  <FormItem className="w-[300px]">
                    <FormLabel>CUIT</FormLabel>
                    <FormControl>
                      <Input placeholder="11 dígitos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem className="w-[300px]">
                    <FormLabel>Sitio web</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact_email"
                render={({ field }) => (
                  <FormItem className="w-[300px]">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact_phone"
                render={({ field }) => (
                  <FormItem className="w-[300px]">
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="w-[300px]">
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem className="w-[300px]">
                    <FormLabel>País</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar país" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="argentina">Argentina</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="province_id"
                render={({ field }) => (
                  <FormItem className="w-[300px]">
                    <FormLabel>Provincia</FormLabel>
                    <Select
                      onValueChange={(v) => {
                        field.onChange(v);
                        // resetear ciudad cuando cambia la provincia
                        form.setValue('city', '');
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar provincia" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {provinces.map((p) => (
                          <SelectItem key={String(p.id)} value={String(p.id)}>
                            {p.name?.trim()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem className="w-[300px]">
                    <FormLabel>Ciudad</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar ciudad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cities.map((c) => (
                          <SelectItem key={String(c.id)} value={String(c.id)}>
                            {c.name?.trim()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem className="w-[300px]">
                    <FormLabel>Industria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar industria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {industries.map((ind) => (
                          <SelectItem key={String(ind.id)} value={ind.name || ''}>
                            {ind.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="w-[300px]">
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="by_defect"
                render={({ field }) => (
                  <FormItem className="w-[300px] flex items-center gap-3">
                    <FormControl>
                      <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Compañía por defecto</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo-input">Logo (10MB máx.)</Label>
              <Input
                id="logo-input"
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.bmp,.tif,.tiff"
                onChange={handleImageChange}
                className="max-w-[300px]"
              />
              {(base64Preview || initial.company_logo) && (
                <img
                  src={base64Preview || initial.company_logo || ''}
                  alt="Logo"
                  className="rounded-xl mt-2 max-w-[150px] max-h-[120px] p-2 bg-slate-200"
                />
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

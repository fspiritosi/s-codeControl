'use client';
import { Button } from '@/components/ui/button';
import { CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useImageUpload } from '@/hooks/useUploadImage';
import { handleSupabaseError } from '@/lib/errorHandler';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { useLoggedUserStore } from '@/store/loggedUser';
import { companySchema } from '@/zodSchemas/schemas';
import { useRouter } from 'next/navigation';
import { ChangeEvent, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AddCompany } from '../accions';

export default function CreateCompanyButton() {
  const url = process.env.NEXT_PUBLIC_PROJECT_URL;
  const router = useRouter();
  const supabase = supabaseBrowser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | undefined>();
  const [required, setRequired] = useState(false);
  const { uploadImage, loading } = useImageUpload();
  const disabled = false;
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [base64Image, setBase64Image] = useState<string>('');
  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      setImageFile(file);
      // Convertir la imagen a base64
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          setBase64Image(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const clientAccion = async (formData: FormData) => {
    const values = Object.fromEntries(formData.entries());
    const result = await companySchema.safeParseAsync(values);

    Object.keys(values).forEach((key) => {
      const element = document.getElementById(`${key}_error`);
      if (element) {
        element.innerText = '';
      }
    });

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const element = document.getElementById(`${issue.path}_error`);
        if (element) {
          element.innerText = issue.message; //->mensaje de error
          element.style.color = 'red';
        }
      });

      Object.keys(values).forEach((key) => {
        if (!result.error.issues.some((issue) => issue.path.includes(key))) {
          const element = document.getElementById(`${key}_error`);
          if (element) {
            element.innerText = '';
          }
        }
      });
      return;
    }

    toast.promise(
      async () => {
        const cuit = formData.get('company_cuit') as string;
        const fileExtension = imageFile?.name.split('.').pop();
        const logoUrl = `${url}/logo/${cuit}.${fileExtension}`;

        const { data, error } = await AddCompany(formData, logoUrl);

        if (error) {
          throw new Error(handleSupabaseError(error.message));
        }

        if (data && data?.length > 0) {
          if (imageFile) {
            const fileExtension = imageFile?.name.split('.').pop();
            const renamedFile = new File([imageFile], `${cuit}.${fileExtension}`, {
              type: `image/${fileExtension?.replace(/\s/g, '')}`,
            });
            await uploadImage(renamedFile, 'logo');
          }

          const { data: company, error: companyError } = await supabase
            .from('company')
            .select(
              `
            *,
            owner_id(*),
            share_company_users(*,
              profile(*)
            ),
            city (
              name,
              id
            ),
            province_id (
              name,
              id
            ),
            companies_employees (
              employees(
                *,
                city (
                  name
                ),
                province(
                  name
                ),
                workflow_diagram(
                  name
                ),
                hierarchical_position(
                  name
                ),
                birthplace(
                  name
                ),
                contractor_employee(
                  customers(
                    *
                  )
                )
              )
            )
          `
            )
            .eq('owner_id', data?.[0]?.owner_id || '');

          if (companyError) {
            throw new Error(handleSupabaseError(companyError.message));
          }

          const actualCompany = company?.filter((company) => company.id === data?.[0]?.id);

          useLoggedUserStore.setState({
            actualCompany: actualCompany?.[0] as any[0],
          });
          useLoggedUserStore.setState({ allCompanies: company as any });

          router.push('/dashboard');
        }
      },
      {
        loading: 'Registrando Compañía',
        success: 'Compañía Registrada',
        error: (error) => {
          return error;
        },
      }
    );
  };

  return (
    <>
      <div className="max-w-[300px] mt-8">
        <div className="flex flex-col  space-y-2">
          <Label htmlFor="fileInput">
            Subir Logo <span className="opacity-70">(10MB máximo)</span>
            {required ? <span style={{ color: 'red' }}> *</span> : ''}
          </Label>
          <Input
            disabled={disabled}
            readOnly
            type="text"
            accept=".jpg, .jpeg, .png, .gif, .bmp, .tif, .tiff"
            onClick={() => fileInputRef?.current?.click()} // Abre el diálogo de selección de archivos
            className="self-center cursor-pointer"
            placeholder={'Seleccionar foto o subir foto'}
          />
          <Input
            ref={fileInputRef}
            disabled={disabled}
            type="file"
            accept=".jpg, .jpeg, .png, .gif, .bmp, .tif, .tiff"
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              handleImageChange && handleImageChange(event); // Accede al archivo file del input
              setFile(event.target.files?.[0]); // Guarda el archivo en el estado
            }}
            className="self-center hidden"
            id="fileInput"
            placeholder="Seleccionar foto o subir foto"
          />
          <CardDescription className="max-w-[300px] p-0 m-0"></CardDescription>
        </div>

        <div className="flex items-center gap-2 justify-around  rounded-xl">
          {base64Image && (
            <img
              src={base64Image}
              className="rounded-xl my-1 max-w-[150px] max-h-[120px] p-2 bg-slate-200"
              alt="Vista previa de la imagen"
            />
          )}
        </div>
      </div>
      <Button type="submit" formAction={(formData) => clientAccion(formData)} className="mt-5">
        Registrar Compañía
      </Button>
    </>
  );
}

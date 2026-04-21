'use client';

import { useImageUpload } from '@/shared/hooks/useUploadImage';
import { handleSupabaseError } from '@/shared/lib/errorHandler';
import { useCountriesStore } from '@/shared/store/countries';
import { useLoggedUserStore } from '@/shared/store/loggedUser';
import { zodResolver } from '@hookform/resolvers/zod';
import { toPng } from 'html-to-image';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { insertDocumentsEquipment, fetchExistingDocumentTypes } from '@/modules/documents/features/upload/actions.server';
import {
  insertVehicle,
  updateVehicleByIdAndCompany,
  checkVehicleDomainExists,
  deleteContractorEquipment,
  insertContractorEquipment,
  fetchVehicleModelsByBrand,
} from '@/modules/equipment/features/create/actions.server';
import { fetchTypesOfVehicles } from '@/modules/equipment/shared/utils';
import { dataType, generic, VehicleType } from '@/modules/equipment/shared/types';

export function useVehicleForm(
  vehicle: any | null,
  vehicleType: generic[],
  brand_vehicles: any[] | null,
) {
  const searchParams = useSearchParams();
  const [accion, setAccion] = useState(searchParams.get('action'));
  const actualCompany = useLoggedUserStore((state) => state.actualCompany);
  const [type, setType] = useState('');
  const [data, setData] = useState<dataType>({ tipe_of_vehicles: [], models: [] });
  const [hideInput, setHideInput] = useState(false);
  const [readOnly, setReadOnly] = useState(accion === 'view' ? true : false);
  const router = useRouter();
  const { uploadImage } = useImageUpload();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [base64Image, setBase64Image] = useState<string>('');
  const url = process.env.NEXT_PUBLIC_PROJECT_URL;
  const URLQR = process.env.NEXT_PUBLIC_BASE_URL;
  const mandatoryDocuments = useCountriesStore((state) => state.mandatoryDocuments);
  const loggedUser = useLoggedUserStore((state) => state.credentialUser?.id);

  useEffect(() => {
    useCountriesStore.getState().initCatalogs();
    if (vehicle && vehicle.type_of_vehicle === 'Vehículos') setHideInput(true);
    if (vehicle && vehicle.type_of_vehicle === 'Otros') setHideInput(false);
    if (!vehicle) setHideInput(false);
  }, [vehicle]);

  const vehicleSchema = z.object({
    brand: z.string({ required_error: 'La marca es requerida' }).optional(),
    model: z.string({ required_error: 'El modelo es requerido' }).optional(),
    year: z.string({ required_error: 'El año es requerido' }).refine(
      (e) => {
        const year = Number(e);
        const actualYear = new Date().getFullYear();
        if (year !== undefined) {
          return !(year < 1900 || year > actualYear);
        }
        return 0;
      },
      { message: 'El año debe ser mayor a 1900 y menor al año actual.' }
    ),
    engine: z.string({ required_error: 'El motor es requerido' }).min(2, { message: 'El motor debe tener al menos 2 caracteres.' }).max(30, { message: 'El motor debe tener menos de 30 caracteres.' }).optional(),
    type_of_vehicle: z.string({ required_error: 'El tipo es requerido' }),
    chassis: hideInput
      ? z.string({ required_error: 'El chasis es requerido' }).min(2, { message: 'El chasis debe tener al menos 2 caracteres.' }).max(30, { message: 'El chasis debe tener menos de 30 caracteres.' })
      : z.string().optional(),
    kilometer: z.string().optional(),
    domain: hideInput
      ? z.string({ required_error: 'El dominio es requerido' })
          .min(6, { message: 'El dominio debe tener al menos 6 caracteres.' })
          .max(7, { message: 'El dominio debe tener menos de 7 caracteres.' })
          .refine((e) => { const year = Number(form.getValues('year')); const oldRegex = /^[A-Za-z]{3}[0-9]{3}$/; if (year !== undefined) { if (year <= 2015) return oldRegex.test(e); return true; } return 0; }, { message: 'El dominio debe tener el formato AAA000. (verificar año)' })
          .refine((e) => { const year = Number(form.getValues('year')); const newRegex = /^[A-Za-z]{2}[0-9]{3}[A-Za-z]{2}$/; if (year !== undefined) { if (year >= 2017) return newRegex.test(e); return true; } return 0; }, { message: 'El dominio debe tener el formato AA000AA. (verificar año)' })
          .refine((e) => { const year = Number(form.getValues('year')); const newRegex = /^[A-Za-z]{2}[0-9]{3}[A-Za-z]{2}$/; const oldRegex = /^[A-Za-z]{3}[0-9]{3}$/; if (year !== undefined) { if (year === 2016 || year === 2015) return newRegex.test(e) || oldRegex.test(e); return true; } return 0; }, { message: 'El dominio debe tener uno de los siguientes formatos AA000AA o AAA000' })
          .refine(async (domain: string) => { const vehicles = await checkVehicleDomainExists(domain.toUpperCase()); if (vehicles?.[0] && window.location.href.includes('/dashboard/equipment/action?action=new')) return false; return true; }, { message: 'El dominio ya existe' })
      : z.string().optional().nullable(),
    serie: hideInput
      ? z.string().optional()
      : z.string({ required_error: 'La serie es requerida' }).min(2, { message: 'La serie debe tener al menos 2 caracteres.' }).max(30, { message: 'La serie debe tener menos de 3- caracteres.' }),
    intern_number: z.string({ required_error: 'El número interno es requerido' }).min(2, { message: 'El número interno debe tener al menos 2 caracteres.' }).max(30, { message: 'El número interno debe tener menos de 30 caracteres.' }),
    picture: z.string().optional(),
    type: hideInput ? z.string().optional() : z.string({ required_error: 'El tipo es requerido' }),
    allocated_to: z.array(z.string()).optional(),
  });

  const form = useForm<z.infer<typeof vehicleSchema>>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      year: vehicle?.year || undefined,
      engine: vehicle?.engine || '',
      chassis: vehicle?.chassis || '',
      serie: vehicle?.serie || '',
      domain: vehicle?.domain || '',
      intern_number: vehicle?.intern_number || '',
      picture: vehicle?.picture || '',
      allocated_to: vehicle?.allocated_to || [],
      brand: vehicle?.brand || '',
      model: vehicle?.model || '',
      type_of_vehicle: vehicle?.type_of_vehicle || '',
      type: vehicle?.type || '',
      kilometer: vehicle?.kilometer || '',
    },
  });

  const fetchData = async () => {
    const types_of_vehicles = await fetchTypesOfVehicles();
    setData({ ...data, tipe_of_vehicles: types_of_vehicles as unknown as generic[] });
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Contractors loaded via initCatalogs() above

  const allCustomers = useCountriesStore((state) => state.customers);
  const contractorCompanies = useMemo(
    () => allCustomers?.filter((company: any) => company.company_id.toString() === actualCompany?.id && company.is_active),
    [allCustomers, actualCompany?.id]
  );

  const types = data.tipe_of_vehicles?.map((e) => e.name);
  const vehicleModels = data.models;

  const fetchModels = async (brand_id: string) => {
    const model_vehicles = await fetchVehicleModelsByBrand(brand_id);
    setData({ ...data, models: model_vehicles as unknown as generic[] });
  };

  async function onCreate(values: z.infer<typeof vehicleSchema>) {
    toast.promise(
      async () => {
        const { type_of_vehicle, brand, model, domain } = values;
        try {
          const { data: vehicleData, error } = await insertVehicle({
              ...values,
              domain: domain?.toUpperCase() || null,
              type_of_vehicle: data.tipe_of_vehicles.find((e) => e.name === type_of_vehicle)?.id,
              brand: brand_vehicles?.find((e) => e.name === brand)?.id,
              model: data.models.find((e) => e.name === model)?.id,
              type: vehicleType.find((e) => e.name === values.type)?.id,
              company_id: actualCompany?.id,
              condition: 'operativo',
              kilometer: values.kilometer || 0,
            });
          if (error) throw new Error(handleSupabaseError(error));
          const vehicleId = vehicleData?.id || '';

          const { data: existingTypes } = await fetchExistingDocumentTypes(
            'documents_equipment',
            vehicleId
          );
          const existingTypesSet = new Set(existingTypes);

          const documentsMissing: { applies: string; id_document_types: string; validity: string | null; user_id: string | undefined }[] = [];
          mandatoryDocuments?.Equipos?.forEach((document: any) => {
            if (!existingTypesSet.has(document.id)) {
              documentsMissing.push({ applies: vehicleId, id_document_types: document.id, validity: null, user_id: loggedUser });
            }
          });
          if (documentsMissing.length > 0) {
            const { error: documentError } = await insertDocumentsEquipment(documentsMissing);
            if (documentError) throw new Error(handleSupabaseError(documentError));
          }
          const id = vehicleData?.id;
          const fileExtension = imageFile?.name.split('.').pop();
          if (imageFile && id) {
            try {
              const renamedFile = new File([imageFile], `${id.replace(/\s/g, '')}.${fileExtension}`, { type: `image/${fileExtension}` });
              await uploadImage(renamedFile, 'vehicle_photos');
              try {
                const vehicleImage = `${url}/vehicle_photos/${id}.${fileExtension}`.trim().replace(/\s/g, '');
                await updateVehicleByIdAndCompany(id, actualCompany?.id || '', { picture: vehicleImage });
              } catch (error) {}
            } catch (error: any) {
              throw new Error(handleSupabaseError(error.message));
            }
          }
          router.push('/dashboard/equipment');
        } catch (error) {
          console.error(error);
        }
      },
      { loading: 'Guardando...', success: 'equipo registrado', error: (error) => error }
    );
  }

  async function onUpdate(values: z.infer<typeof vehicleSchema>) {
    function compareContractorEmployees(originalObj: VehicleType | null, modifiedObj: z.infer<typeof vehicleSchema>) {
      const originalSet = new Set(originalObj?.allocated_to);
      const modifiedSet = new Set(modifiedObj?.allocated_to);
      const valuesToRemove = [...originalSet].filter((value) => !modifiedSet.has(value));
      const valuesToAdd = [...modifiedSet].filter((value) => !originalSet.has(value));
      const valuesToKeep = [...originalSet].filter((value) => modifiedSet.has(value));
      return { valuesToRemove, valuesToAdd, valuesToKeep };
    }
    function getUpdatedFields(originalObj: any, modifiedObj: any) {
      const updatedFields: any = {};
      for (const key in modifiedObj) { if (modifiedObj[key] !== originalObj[key]) updatedFields[key] = modifiedObj[key]; }
      return updatedFields;
    }
    toast.promise(
      async () => {
        const { brand_vehicles: brandd, model_vehicles, types_of_vehicles, ...rest } = vehicle;
        const result = compareContractorEmployees(rest, values);
        result.valuesToRemove.forEach(async (e) => {
          const { error } = await deleteContractorEquipment(vehicle?.id, e);
          if (error) return handleSupabaseError(error);
        });
        const error2 = await Promise.all(
          result.valuesToAdd.map(async (e) => {
            if (!result.valuesToKeep.includes(e)) {
              const { error } = await insertContractorEquipment(vehicle?.id, e);
              if (error) return handleSupabaseError(error);
            }
          })
        );
        const updatedFields = getUpdatedFields(rest, {
          type_of_vehicle: data.tipe_of_vehicles.find((e) => e.name === values.type_of_vehicle)?.id,
          brand: brand_vehicles?.find((e: any) => e.name === values.brand)?.id,
          model: data.models.find((e) => e.name === values.model)?.id,
          year: values.year, engine: values.engine, chassis: values.chassis,
          serie: values.serie, domain: values.domain?.toUpperCase(), intern_number: values.intern_number,
          picture: values.picture, allocated_to: values.allocated_to, kilometer: values.kilometer,
          type: vehicleType.find((e) => e.name === values.type)?.id,
        });
        try {
          const { error: updatedERROR } = await updateVehicleByIdAndCompany(vehicle?.id, actualCompany?.id || '', updatedFields);
          if (updatedERROR) console.error(updatedERROR);
          const id = vehicle?.id;
          const fileExtension = imageFile?.name.split('.').pop();
          if (imageFile) {
            try {
              const renamedFile = new File([imageFile], `${id?.replace(/\s/g, '')}.${fileExtension}`, { type: `image/${fileExtension}` });
              await uploadImage(renamedFile, 'vehicle_photos');
              try {
                const vehicleImage = `${url}/vehicle_photos/${id}.${fileExtension}?timestamp=${Date.now()}`.trim().replace(/\s/g, '');
                await updateVehicleByIdAndCompany(id, actualCompany?.id || '', { picture: vehicleImage });
              } catch (error) {}
            } catch (error: any) {
              throw new Error('Error al subir la imagen');
            }
          }
          setReadOnly(true);
          router.refresh();
        } catch (error) {
          console.error(error);
          throw new Error('Error al editar el equipo');
        }
      },
      { loading: 'Guardando...', success: 'equipo editado', error: (error) => error }
    );
  }

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') setBase64Image(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const qrUrl = `${URLQR}maintenance?equipment=${vehicle?.id}`;
  const qrCodeRef = useRef<HTMLDivElement>(null);

  const downloadQR = async () => {
    if (!qrCodeRef.current) return;
    try {
      const dataUrl = await toPng(qrCodeRef.current);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `qr-code${vehicle.domain || vehicle.serie}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  const printQR = () => {
    if (!qrCodeRef.current) return;
    const qrCodeElement = qrCodeRef.current;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.write('<html><head><title>Print QR Code</title></head><body>');
      iframeDoc.write(qrCodeElement.innerHTML);
      iframeDoc.write('</body></html>');
      iframeDoc.close();
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }
    document.body.removeChild(iframe);
  };

  return {
    form, accion, readOnly, setReadOnly, hideInput, setHideInput,
    type, setType, types, vehicleModels, contractorCompanies,
    fetchModels, fetchData, onCreate, onUpdate, handleImageChange, base64Image,
    qrUrl, qrCodeRef, downloadQR, printQR, actualCompanyId: actualCompany?.id,
  };
}

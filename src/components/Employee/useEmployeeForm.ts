'use client';

import { useEmployeesData } from '@/hooks/useEmployeesData';
import { useImageUpload } from '@/hooks/useUploadImage';
import { handleSupabaseError } from '@/lib/errorHandler';
import { useCountriesStore } from '@/store/countries';
import { useLoggedUserStore } from '@/store/loggedUser';
import {
  accordionSchema,
  accordionSchemaUpdate,
  validateDuplicatedCuil,
  validateDuplicatedCuilForUpdate,
  getAllFiles,
  getAllFilesForUpdate,
} from '@/zodSchemas/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { PostgrestError } from '@supabase/supabase-js';
import { addMonths, format } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChangeEvent, useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  insertDocumentsEmployees,
  updateEmployeeByDocNumber,
  deactivateEmployee,
  deleteContractorEmployee,
  insertContractorEmployee,
} from '@/app/server/UPDATE/actions';
import { Province } from './types';
import { getPersonalDataFields, getContactDataFields, getLaboralDataFields } from './fieldDefinitions';

export function useEmployeeFormLogic(user: any, guild: any, covenants: any, categories: any) {
  const profile = useLoggedUserStore((state) => state);
  const searchParams = useSearchParams();
  const accion = searchParams.get('action');
  const employees = useLoggedUserStore((state) => state.active_and_inactive_employees);
  const loggedUser = useLoggedUserStore((state) => state.credentialUser?.id);
  const { uploadImage } = useImageUpload();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [base64Image, setBase64Image] = useState<string>('');
  const fetchCityValues = useCountriesStore((state) => state.fetchCities);
  const provincesOptions = useCountriesStore((state) => state.provinces);
  const citysOptions = useCountriesStore((state) => state.cities);
  const countryOptions = useCountriesStore((state) => state.countries);
  const hierarchyOptions = useCountriesStore((state) => state.hierarchy);
  const workDiagramOptions = useCountriesStore((state) => state.workDiagram);
  const contractorCompanies = useCountriesStore((state) =>
    state.customers?.filter(
      (company: any) => company.company_id.toString() === profile?.actualCompany?.id && company.is_active
    )
  );
  const setActivesEmployees = useLoggedUserStore((state) => state.setActivesEmployees);
  const { updateEmployee, createEmployee } = useEmployeesData();
  const getEmployees = useLoggedUserStore((state: any) => state.getEmployees);
  const router = useRouter();
  const url = process.env.NEXT_PUBLIC_PROJECT_URL;
  const mandatoryDocuments = useCountriesStore((state) => state.mandatoryDocuments);

  const form = useForm<z.infer<typeof accordionSchema>>({
    resolver: zodResolver(accion === 'new' ? accordionSchema : accordionSchemaUpdate),
    defaultValues: user || {
      lastname: '',
      firstname: '',
      nationality: undefined,
      born_date: undefined,
      cuil: '',
      document_type: undefined,
      document_number: '',
      birthplace: undefined,
      gender: undefined,
      marital_status: undefined,
      level_of_education: undefined,
      picture: '',
      street: '',
      street_number: '',
      province: undefined,
      city: undefined,
      postal_code: '',
      phone: '',
      email: '',
      file: '',
      hierarchical_position: undefined,
      company_position: '',
      workflow_diagram: undefined,
      type_of_contract: undefined,
      allocated_to: [],
      date_of_admission: undefined,
      guild_id: undefined,
      covenants_id: undefined,
      category_id: undefined,
    },
  });

  const [accordion1Errors, setAccordion1Errors] = useState(false);
  const [accordion2Errors, setAccordion2Errors] = useState(false);
  const [accordion3Errors, setAccordion3Errors] = useState(false);
  const [readOnly, setReadOnly] = useState(accion === 'view' ? true : false);

  const guildId = useWatch({ control: form.control, name: 'guild_id' });
  const covenantsId = useWatch({ control: form.control, name: 'covenants_id' });

  const PERSONALDATA = getPersonalDataFields(countryOptions);
  const CONTACTDATA = getContactDataFields(provincesOptions, citysOptions);
  const LABORALDATA = getLaboralDataFields(
    hierarchyOptions,
    workDiagramOptions,
    contractorCompanies,
    guild,
    covenants,
    categories,
    guildId,
    covenantsId,
  );

  const provinceId = provincesOptions?.find((province: Province) => province.name.trim() === user?.province)?.id;

  useEffect(() => {
    if (provinceId) {
      fetchCityValues(provinceId);
    }

    const { errors } = form.formState;
    const acordeon1: string[] = [];
    const acordeon2: string[] = [];
    const acordeon3: string[] = [];

    for (const error of Object.keys(errors)) {
      if (PERSONALDATA.find((e) => e.name === error)) {
        acordeon1.push(error);
      }
      if (CONTACTDATA.find((e) => e.name === error)) {
        acordeon2.push(error);
      }
      if (LABORALDATA.find((e) => e.name === error)) {
        acordeon3.push(error);
      }
    }
    setAccordion1Errors(acordeon1.length > 0);
    setAccordion2Errors(acordeon2.length > 0);
    setAccordion3Errors(acordeon3.length > 0);
  }, [form.formState.errors, provinceId, employees, user]);

  const handleProvinceChange = (name: any) => {
    const provId = provincesOptions.find((province: Province) => province.name.trim() === name)?.id;
    fetchCityValues(provId);
  };

  async function onCreate(values: z.infer<typeof accordionSchema>) {
    const isDuplicatedCuil = await validateDuplicatedCuil(values.cuil, profile?.actualCompany?.id);
    if (!isDuplicatedCuil) {
      toast.error('Ya existe un empleado con este CUIL en la empresa');
      return;
    }

    const isDuplicatedFile = await getAllFiles(values.file, profile?.actualCompany?.id);
    if (!isDuplicatedFile) {
      toast.error('Ya existe un empleado con este legajo en la empresa');
      return;
    }

    toast.promise(
      async () => {
        const { full_name, ...rest } = values;
        const fileExtension = imageFile?.name.split('.').pop();
        const finalValues = {
          ...rest,
          date_of_admission:
            values.date_of_admission instanceof Date
              ? values.date_of_admission.toISOString()
              : values.date_of_admission,
          born_date:
            values.born_date instanceof Date
              ? values.born_date.toISOString()
              : values.born_date,
          province: String(provincesOptions.find((e: any) => e.name.trim() === values.province)?.id),
          birthplace: String(countryOptions.find((e: any) => e.name === values.birthplace)?.id),
          city: String(citysOptions.find((e: any) => e.name.trim() === values.city)?.id),
          hierarchical_position: String(hierarchyOptions.find((e: any) => e.name === values.hierarchical_position)?.id),
          workflow_diagram: String(workDiagramOptions.find((e: any) => e.name === values.workflow_diagram)?.id),
          guild_id: values.guild_id || null,
          covenants_id: values.covenants_id || null,
          category_id: values.category_id || null,
          picture: fileExtension
            ? `${url}/${values.document_number}.${fileExtension}`.trim()
            : values.gender === 'Masculino'
              ? 'https://ui.shadcn.com/avatars/02.png'
              : 'https://ui.shadcn.com/avatars/05.png',
        };

        try {
          const applies = await createEmployee(finalValues);
          const documentsMissing: {
            applies: number;
            id_document_types: string;
            validity: string | null;
            user_id: string | undefined;
          }[] = [];

          mandatoryDocuments?.Persona?.forEach(async (document: any) => {
            documentsMissing.push({
              applies: applies[0].id,
              id_document_types: document.id,
              validity: null,
              user_id: loggedUser,
            });
          });

          const { error } = await insertDocumentsEmployees(documentsMissing);

          if (error) {
            throw new Error(handleSupabaseError(error));
          }

          try {
            await handleUpload();
          } catch (error: PostgrestError | any) {
            throw new Error(handleSupabaseError(error.message));
          }
          getEmployees(true);
          router.refresh();
          router.push('/dashboard/employee');
        } catch (error: PostgrestError | any) {
          throw new Error(handleSupabaseError(error.message));
        }
      },
      {
        loading: 'Agregando empleado...',
        success: 'Empleado agregado correctamente',
        error: (error) => {
          return error;
        },
      }
    );
  }

  async function onUpdate(values: z.infer<typeof accordionSchema>) {
    const isDuplicatedCuil = await validateDuplicatedCuilForUpdate(values.cuil, user?.id, profile?.actualCompany?.id);
    if (!isDuplicatedCuil) {
      toast.error('Ya existe otro empleado con este CUIL en la empresa');
      return;
    }

    const isDuplicatedFile = await getAllFilesForUpdate(values.file, user?.id, profile?.actualCompany?.id);
    if (!isDuplicatedFile) {
      toast.error('Ya existe otro empleado con este legajo en la empresa');
      return;
    }

    function compareContractorEmployees(
      originalObj: z.infer<typeof accordionSchema>,
      modifiedObj: z.infer<typeof accordionSchema>
    ) {
      const originalSet = new Set(originalObj.allocated_to);
      const modifiedSet = new Set(modifiedObj.allocated_to);
      const valuesToRemove = [...originalSet].filter((value) => !modifiedSet.has(value));
      const valuesToAdd = [...modifiedSet].filter((value) => !originalSet.has(value));
      const valuesToKeep = [...originalSet].filter((value) => modifiedSet.has(value));
      return { valuesToRemove, valuesToAdd, valuesToKeep };
    }

    toast.promise(
      async () => {
        const { full_name, ...rest } = values;
        const finalValues = {
          ...rest,
          date_of_admission:
            values.date_of_admission instanceof Date
              ? values.date_of_admission.toISOString()
              : values.date_of_admission,
          born_date:
            values.born_date instanceof Date
              ? values.born_date.toISOString()
              : values.born_date,
          province: String(provincesOptions.find((e: any) => e.name.trim() === values.province)?.id),
          birthplace: String(countryOptions.find((e: any) => e.name === values.birthplace)?.id),
          city: String(citysOptions.find((e: any) => e.name.trim() === values.city)?.id),
          hierarchical_position: String(hierarchyOptions.find((e: any) => e.name === values.hierarchical_position)?.id),
          workflow_diagram: String(workDiagramOptions.find((e: any) => e.name === values.workflow_diagram)?.id),
          guild_id: values.guild_id || null,
          covenants_id: values.covenants_id || null,
          category_id: values.category_id || null,
        };
        const result = compareContractorEmployees(user, finalValues as any);
        result.valuesToRemove.forEach(async (e) => {
          if (!e) return;
          const { error } = await deleteContractorEmployee(user.id, e);
          if (error) return handleSupabaseError(error);
        });

        const error2 = await Promise.all(
          result.valuesToAdd.map(async (e) => {
            if (!e) return;
            if (!result.valuesToKeep.includes(e)) {
              const { error } = await insertContractorEmployee(user.id, e);
              if (error) return handleSupabaseError(error);
            }
          })
        );

        if (error2 && typeof error2[0] === 'string') {
          throw new Error(error2[0]);
        }

        try {
          await updateEmployee(finalValues, user?.id);
          await handleUpload();
          router.refresh();
          router.push('/dashboard/employee');
        } catch (error: PostgrestError | any) {
          throw new Error(handleSupabaseError(error.message));
        }
      },
      {
        loading: 'Actualizando empleado...',
        success: 'Empleado actualizado correctamente',
        error: (error) => {
          return error;
        },
      }
    );
  }

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          setBase64Image(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    const document_number = form.getValues('document_number');
    const fileExtension = imageFile?.name.split('.').pop();
    if (imageFile) {
      try {
        const renamedFile = new File([imageFile], `${document_number}.${fileExtension}`, {
          type: `image/${fileExtension?.replace(/\s/g, '')}`,
        });
        await uploadImage(renamedFile, 'employee_photos');
        const employeeImage = `${url}/employee_photos/${document_number}.${fileExtension}?timestamp=${Date.now()}`
          .trim()
          .replace(/\s/g, '');
        await updateEmployeeByDocNumber(document_number, { picture: employeeImage });
      } catch (error: any) {
        // silently fail image upload
      }
    }
  };

  const today = new Date();
  const nextMonth = addMonths(new Date(), 1);
  const [month, setMonth] = useState<Date>(nextMonth);
  const yearsAhead = Array.from({ length: 70 }, (_, index) => {
    const year = today.getFullYear() - index - 1;
    return year;
  });
  const [years, setYear] = useState(today.getFullYear().toString());

  const formSchema = z.object({
    reason_for_termination: z.string({
      required_error: 'La razón de la baja es requerida.',
    }),
    termination_date: z.date({
      required_error: 'La fecha de baja es requerida.',
    }),
  });

  const [showModal, setShowModal] = useState(false);

  async function onDelete(values: z.infer<typeof formSchema>) {
    const data = {
      ...values,
      termination_date: format(values.termination_date, 'yyyy-MM-dd'),
    };

    try {
      await deactivateEmployee(user.document_number, data.termination_date, data.reason_for_termination);

      setShowModal(!showModal);
      toast('Emplead@ eliminado', { description: `El emplead@ ${user.full_name} ha sido eliminado` });
      setActivesEmployees();
      router.push('/dashboard/employee');
    } catch (error: any) {
      toast.error('Error al dar de baja al emplead@');
    }
  }

  const form2 = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason_for_termination: undefined,
    },
  });

  return {
    form,
    form2,
    accion,
    readOnly,
    setReadOnly,
    accordion1Errors,
    accordion2Errors,
    accordion3Errors,
    PERSONALDATA,
    CONTACTDATA,
    LABORALDATA,
    handleProvinceChange,
    handleImageChange,
    base64Image,
    onCreate,
    onUpdate,
    onDelete,
    showModal,
    setShowModal,
    today,
    month,
    setMonth,
    yearsAhead,
    years,
    setYear,
    guildId,
    covenantsId,
  };
}

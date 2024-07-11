'use client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
require('dotenv').config();

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useEmployeesData } from '@/hooks/useEmployeesData';
import { useCountriesStore } from '@/store/countries';
import {
  civilStateOptionsENUM,
  documentOptionsENUM,
  genderOptionsENUM,
  instrutionsOptionsENUM,
  nacionaliOptionsENUM,
  typeOfContractENUM,
} from '@/types/enums';
import { supabase } from '../../supabase/supabase';
import { ModalCct } from './ModalCct';
import { CaretSortIcon, CheckIcon, PlusCircledIcon } from '@radix-ui/react-icons';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { DocumentationDrawer } from '@/components/DocumentationDrawer';



import { CheckboxDefaultValues } from '@/components/CheckboxDefValues';
import { SelectWithData } from '@/components/SelectWithData';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormDescription, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useImageUpload } from '@/hooks/useUploadImage';
import { handleSupabaseError } from '@/lib/errorHandler';
import { cn } from '@/lib/utils';
import { useLoggedUserStore } from '@/store/loggedUser';
import { names } from '@/types/types';
import { accordionSchema } from '@/zodSchemas/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon } from '@radix-ui/react-icons';
import { PostgrestError } from '@supabase/supabase-js';
import { addMonths, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChangeEvent, Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import BackButton from './BackButton';
import { ImageHander } from './ImageHandler';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import DocumentTable from '@/app/dashboard/document/DocumentTable';

type Province = {
  id: number;
  name: string;
};
type dataType = {
  
  covenants: {
    name: string;
    number: string
    id: string;
    is_active: boolean;
  }[];
  category: {
    name: string;
    id: string;
    covenant_id:string;
    is_active: boolean;
  }[];
  
};

export default function EmployeeAccordion() {
  const profile = useLoggedUserStore((state) => state);
  // let role = '';
  // if (profile?.actualCompany?.owner_id.id === profile?.credentialUser?.id) {
  //   role = profile?.actualCompany?.owner_id?.role as string;
  // } else {
  //   role = profile?.actualCompany?.share_company_users?.[1]?.role as string;
  // }
  const share = useLoggedUserStore((state) => state.sharedCompanies);
  const profile2 = useLoggedUserStore((state) => state.credentialUser?.id);
  const owner2 = useLoggedUserStore((state) => state.actualCompany?.owner_id.id);
  const users = useLoggedUserStore((state) => state);
  const company = useLoggedUserStore((state) => state.actualCompany?.id);

  let role = '';
  if (owner2 === profile2) {
    role = users?.actualCompany?.owner_id?.role as string;

  } else {

    const roleRaw = share?.filter((item: any) =>
      item.company_id.id === company &&
      Object.values(item).some((value) => typeof value === 'string' && value.includes(profile2 as string))
    )
      .map((item: any) => item.role);
    role = roleRaw?.join('');
  }

  const searchParams = useSearchParams()
  const document = searchParams.get('document')
  const [accion, setAccion] = useState(searchParams.get('action'))
  const employees = useLoggedUserStore(state => state.employees)
  const [user, setUser] = useState(
    employees?.find((user: any) => user.document_number === document),
  )
  const loggedUser = useLoggedUserStore(state => state.credentialUser?.id)
  const { uploadImage } = useImageUpload()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [base64Image, setBase64Image] = useState<string>('')
  const fetchCityValues = useCountriesStore(state => state.fetchCities)
  const provincesOptions = useCountriesStore(state => state.provinces)
  const citysOptions = useCountriesStore(state => state.cities)
  const countryOptions = useCountriesStore(state => state.countries)
  const hierarchyOptions = useCountriesStore(state => state.hierarchy)
  const workDiagramOptions = useCountriesStore(state => state.workDiagram)
  const fetchContractors = useCountriesStore(state => state.fetchContractors)
  const subscribeToCustomersChanges = useCountriesStore(state => state.subscribeToCustomersChanges)
  const contractorCompanies = useCountriesStore(state => state.customers?.filter((company: any) => company.company_id.toString() === profile?.actualCompany?.id && company.is_active))
  // const filteredContractorCompanies = contractorCompanies?.filter((company:any) => company.company_id.toString() === profile?.actualCompany?.id && company.is_active);
  const { updateEmployee, createEmployee } = useEmployeesData()
  const getEmployees = useLoggedUserStore((state: any) => state.getEmployees)
  const router = useRouter()
  // const { toast } = useToast()
  const url = process.env.NEXT_PUBLIC_PROJECT_URL;
  const mandatoryDocuments = useCountriesStore((state) => state.mandatoryDocuments);

  const form = useForm<z.infer<typeof accordionSchema>>({
    resolver: zodResolver(accordionSchema),
    defaultValues: user
      ? { ...user, allocated_to: user?.allocated_to }
      : {
        lastname: '',
        firstname: '',
        nationality: undefined,
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
        covenants:'',
        category:'',
      },
  })
  const [accordion1Errors, setAccordion1Errors] = useState(false)
  const [accordion2Errors, setAccordion2Errors] = useState(false)
  const [accordion3Errors, setAccordion3Errors] = useState(false)
  const [readOnly, setReadOnly] = useState(accion === 'view' ? true : false)
  const [data, setData] = useState<dataType>({
    covenants: [],
    category: [],
  });
  const provinceId = provincesOptions?.find((province: Province) => province.name.trim() === user?.province)?.id;
  
  supabase
    .channel('custom-all-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'covenant' }, () => {
      fetchData();
    })
    .subscribe();

  supabase
    .channel('custom-all-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'category' }, () => {
      const covenants = form.getValues('covenants');
      const covenant_id = data.covenants.find((e) => e.id === covenants)?.id as string;
      fetchCategory(covenant_id || '');
    })
    .subscribe();
  
  const fetchData = async () => {
    
    let { data: covenants } = await supabase
    .from('covenant')
    .select('*');
    
    console.log(covenants)
    // let { data: type, error } = await supabase.from('type').select('*');
    setData({
      ...data,
      
      covenants: (covenants || [])?.map((e) => {
        return { name: e.name as string, id: e.id as string, number: e.number as string, is_active:e.is_active };
      }),
    
    });
  };
  
  useEffect(() => {
    fetchData()
    
    fetchContractors()

    const unsubscribe = subscribeToCustomersChanges()

    return () => {
      unsubscribe()
    }
  }, [fetchContractors, subscribeToCustomersChanges])

  const fetchCategory = async (covenant_id: string) => {
    let { data: category } = await supabase
    .from('category')
    .select('*')
    .eq('covenant_id', covenant_id);

    setData({
      ...data,
      category: category as any,
    });
    console.log(category)
  };
  useEffect(() => {
    if (provinceId) {
      fetchCityValues(provinceId);
    }

    const { errors } = form.formState;

    // Inicializa un nuevo estado de error para los acordeones
    const acordeon1 = [];
    const acordeon2 = [];
    const acordeon3 = [];

    // Itera sobre los errores de validación
    for (const error of Object.keys(errors)) {
      //Si todos los acordeones tienen errores parar de iterar

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
    if (acordeon1.length > 0) {
      setAccordion1Errors(true);
    } else {
      setAccordion1Errors(false);
    }
    if (acordeon2.length > 0) {
      setAccordion2Errors(true);
    } else {
      setAccordion2Errors(false);
    }
    if (acordeon3.length > 0) {
      setAccordion3Errors(true);
    } else {
      setAccordion3Errors(false);
    }

    // Actualiza el estado de error de los acordeones
    // que se ejecute cuando cambie el estado de error y cuando ya no haya errores

    const foundUser = employees?.find((user: any) => user.document_number === document);

    if (JSON.stringify(foundUser) !== JSON.stringify(user)) {
      setUser(foundUser);

      form.reset({
        ...foundUser,
        allocated_to: foundUser?.allocated_to,
        date_of_admission: foundUser?.date_of_admission,
        normal_hours: String(foundUser?.normal_hours),
      });
    }
  }, [form.formState.errors, provinceId, employees, user]);

  const PERSONALDATA = [
    {
      label: 'Nombre',
      type: 'text',
      placeholder: 'Nombre',
      name: 'firstname',
    },
    {
      label: 'Apellido',
      type: 'text',
      placeholder: 'Apellido',
      name: 'lastname',
    },
    {
      label: 'Nacionalidad',
      type: 'select',
      placeholder: 'Nacionalidad',
      options: nacionaliOptionsENUM,
      name: 'nationality',
    },
    {
      label: 'CUIL',
      type: 'text',
      placeholder: 'CUIL',
      name: 'cuil',
    },
    {
      label: 'Tipo de documento',
      type: 'select',
      placeholder: 'Tipo de documento',
      options: documentOptionsENUM,
      name: 'document_type',
    },
    {
      label: 'Numero de documento',
      type: 'text',
      placeholder: 'Numero de documento',
      name: 'document_number',
    },
    {
      label: 'País de nacimiento',
      type: 'select',
      placeholder: 'País de nacimiento',
      options: countryOptions,
      name: 'birthplace',
    },
    {
      label: 'Sexo',
      type: 'select',
      placeholder: 'Sexo',
      options: genderOptionsENUM,
      name: 'gender',
    },
    {
      label: 'Estado civil',
      type: 'select',
      placeholder: 'Estado civil',
      options: civilStateOptionsENUM,
      name: 'marital_status',
    },
    {
      label: 'Nivel de instrucción',
      type: 'select',
      placeholder: 'Nivel de instruccion',
      options: instrutionsOptionsENUM,
      name: 'level_of_education',
    },
    {
      label: 'Foto',
      type: 'file',
      placeholder: 'Foto',
      name: 'picture',
    },
  ];
  const CONTACTDATA = [
    {
      label: 'Calle',
      type: 'text',
      placeholder: 'Calle',
      name: 'street',
    },
    {
      label: 'Altura',
      type: 'text',
      placeholder: 'Altura',
      name: 'street_number',
    },
    {
      label: 'Provincia',
      type: 'select',
      placeholder: 'Provincia',
      options: provincesOptions,
      name: 'province',
    },
    {
      label: 'Ciudad',
      type: 'select',
      placeholder: 'Ciudad',
      options: citysOptions,
      name: 'city',
    },
    {
      label: 'Codigo postal',
      type: 'text',
      placeholder: 'Codigo postal',
      name: 'postal_code',
    },
    {
      label: 'Teléfono',
      type: 'text',
      placeholder: 'Teléfono',
      name: 'phone',
    },
    {
      label: 'Email',
      type: 'text',
      placeholder: 'Email',
      name: 'email',
    },
  ];
  const LABORALDATA = [
    {
      label: 'Legajo',
      type: 'number',
      placeholder: 'Legajo',
      name: 'file',
      pattern: '[0-9]+',
    },
    {
      label: 'Puesto Jerarquico',
      type: 'select',
      placeholder: 'Puesto Jerarquico',
      options: hierarchyOptions,
      name: 'hierarchical_position',
    },
    {
      label: 'Puesto en la empresa',
      type: 'text',
      placeholder: 'Puesto en la empresa',
      name: 'company_position',
    },
    {
      label: 'Diagrama de trabajo',
      type: 'select',
      placeholder: 'Diagrama de trabajo',
      options: workDiagramOptions,
      name: 'workflow_diagram',
    },
    {
      label: 'Horas normales',
      type: 'number',
      placeholder: 'Horas normales',
      name: 'normal_hours',
      pattern: '[0-9]+',
      inputMode: 'numeric',
    },
    {
      label: 'Tipo de contrato',
      type: 'select',
      placeholder: 'Tipo de contrato',
      options: typeOfContractENUM,
      name: 'type_of_contract',
    },
    {
      label: 'Afectado A',
      type: 'select',
      placeholder: 'Afectado A',
      options: contractorCompanies,
      name: 'allocated_to',
    },
    {
      label: 'Fecha de ingreso',

      placeholder: 'Fecha de ingreso',
      name: 'date_of_admission',
    },
   
  ];

  const handleProvinceChange = (name: any) => {
    const provinceId = provincesOptions.find((province: Province) => province.name.trim() === name)?.id;
    fetchCityValues(provinceId);
  };

  async function onCreate(values: z.infer<typeof accordionSchema>) {
    toast.promise(
      async () => {
        const fileExtension = imageFile?.name.split('.').pop();
        const finalValues = {
          ...values,
          date_of_admission:
            values.date_of_admission instanceof Date
              ? values.date_of_admission.toISOString()
              : values.date_of_admission,
          province: String(provincesOptions.find((e) => e.name.trim() === values.province)?.id),
          birthplace: String(countryOptions.find((e) => e.name === values.birthplace)?.id),
          city: String(citysOptions.find((e) => e.name.trim() === values.city)?.id),
          hierarchical_position: String(hierarchyOptions.find((e) => e.name === values.hierarchical_position)?.id),
          workflow_diagram: String(workDiagramOptions.find((e) => e.name === values.workflow_diagram)?.id),
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

          mandatoryDocuments?.Persona?.forEach(async (document) => {
            documentsMissing.push({
              applies: applies[0].id,
              id_document_types: document.id,
              validity: null,
              user_id: loggedUser,
            });
          });

          const { data, error } = await supabase.from('documents_employees').insert(documentsMissing).select();

          if (error) {
            throw new Error(handleSupabaseError(error.message));
          }

          try {
            await handleUpload();
          } catch (error: PostgrestError | any) {
            throw new Error(handleSupabaseError(error.message));
          }
          getEmployees(true);
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

  // 2. Define a submit handler.
  async function onUpdate(values: z.infer<typeof accordionSchema>) {
    toast.promise(
      async () => {
        const { full_name, ...rest } = values;
        const finalValues = {
          ...rest,
          date_of_admission:
            values.date_of_admission instanceof Date
              ? values.date_of_admission.toISOString()
              : values.date_of_admission,
          province: String(provincesOptions.find((e) => e.name.trim() === values.province)?.id),
          birthplace: String(countryOptions.find((e) => e.name === values.birthplace)?.id),
          city: String(citysOptions.find((e) => e.name.trim() === values.city)?.id),
          hierarchical_position: String(hierarchyOptions.find((e) => e.name === values.hierarchical_position)?.id),
          workflow_diagram: String(workDiagramOptions.find((e) => e.name === values.workflow_diagram)?.id),
        };

        try {
          await updateEmployee(finalValues, user?.id);
          await handleUpload();
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
        const { data, error } = await supabase
          .from('employees')
          .update({ picture: employeeImage })
          .eq('document_number', document_number);
      } catch (error: any) {
        // toast({
        //   variant: 'destructive',
        //   title: 'Error al subir la imagen',
        //   description:
        //     'No pudimos registrar la imagen, pero el ususario fue registrado correctamente',
        // })
      }
    }
  };
  const today = new Date();
  const nextMonth = addMonths(new Date(), 1);
  const [month, setMonth] = useState<Date>(nextMonth);

  const yearsAhead = Array.from({ length: 20 }, (_, index) => {
    const year = today.getFullYear() - index - 1;
    return year;
  });
  const [years, setYear] = useState(today.getFullYear().toString());

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <section>
        <header className="flex justify-between gap-4 flex-wrap">
          <CardHeader className="min-h-[152px] flex flex-row gap-4 justify-between items-center flex-wrap w-full bg-muted dark:bg-muted/50 border-b-2">
            {accion === 'edit' || accion === 'view' ? (
              <div className="flex gap-3 items-center">
                <CardTitle className=" font-bold tracking-tight">
                  <Avatar className="size-[100px] rounded-full border-2 border-black/30">
                    <AvatarImage
                      className="object-cover rounded-full"
                      src={
                        user?.picture || 'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80'
                      }
                      alt="Imagen del empleado"
                    />
                    <AvatarFallback>
                      <Loader className="animate-spin" />
                    </AvatarFallback>
                  </Avatar>
                </CardTitle>
                <CardDescription className="text-muted-foreground text-3xl">
                  {`${user?.lastname || 'cargando...'}
                ${user?.firstname || ''}`}
                </CardDescription>
              </div>
            ) : (
              <h2 className="text-4xl">{accion === 'edit' ? 'Editar empleado' : 'Agregar empleado'}</h2>
            )}

            {role !== 'Invitado' && readOnly && accion === 'view' && (
              <div className="flex flex-grap gap-2">
                <Button
                  variant="primary"
                  onClick={() => {
                    setReadOnly(false);
                  }}
                >
                  Habilitar edición
                </Button>
                <BackButton />
              </div>
            )}
          </CardHeader>
        </header>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(accion === 'edit' || accion === 'view' ? onUpdate : onCreate)}
            className="w-full"
          >
            <Tabs defaultValue="personalData" className='w-full m-4'>
              <TabsList>
                <TabsTrigger value={'personalData'} className={cn(accordion1Errors && "bg-red-300 text-red-50")}>Datos Personales</TabsTrigger>
                <TabsTrigger value={'contactData'} className={cn(accordion2Errors && "bg-red-300 text-red-50")}>Datos de Contacto</TabsTrigger>
                <TabsTrigger value={'workData'} className={cn(accordion3Errors && "bg-red-300 text-red-50")}>Datos Laborales</TabsTrigger>
                {
                  user && <TabsTrigger value='documents'>Documentación</TabsTrigger>
                }
              </TabsList>
              <TabsContent value='personalData' className='px-2 py-2'>
                {accordion1Errors && (
                  <Badge className="h-6 hover:no-underline" variant="destructive">
                    Falta corregir algunos campos
                  </Badge>
                )}
                <div className="min-w-full max-w-sm flex flex-wrap gap-8 items-center">
                  {PERSONALDATA?.map((data, index) => {
                    if (data.type === 'file') {
                      return (
                        <div key={index} className="w-[300px] flex  gap-2">
                          <FormField
                            control={form.control}
                            name={data.name as names}
                            render={({ field }) => (
                              <FormItem className="">
                                <FormControl>
                                  <div className="flex lg:items-center flex-wrap md:flex-nowrap flex-col lg:flex-row gap-8">
                                    <ImageHander
                                      labelInput="Subir foto"
                                      handleImageChange={handleImageChange}
                                      base64Image={base64Image} //nueva
                                      disabled={readOnly}
                                      inputStyle={{
                                        width: '400px',
                                        maxWidth: '300px',
                                      }}
                                    />
                                  </div>
                                </FormControl>

                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      );
                    }
                    if (data.type === 'select') {
                      return (
                        <div key={index} className="w-[300px] flex flex-col gap-2">
                          <FormField
                            control={form.control}
                            name={data.name as names}
                            render={({ field }) => {
                              return (
                                <FormItem>
                                  <FormLabel>
                                    {data.label}
                                    <span style={{ color: 'red' }}> *</span>
                                  </FormLabel>

                                  <SelectWithData
                                    disabled={readOnly}
                                    placeholder={data.placeholder}
                                    options={data.options}
                                    onChange={field.onChange}
                                    editing={true}
                                    value={field.value || ''}
                                    field={{ ...field }}
                                  />

                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                        </div>
                      );
                    } else {
                      return (
                        <div key={index} className="w-[300px] flex flex-col gap-2 ">
                          <FormField
                            control={form.control}
                            name={data.name as names}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {data.label}
                                  <span style={{ color: 'red' }}> *</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    disabled={readOnly}
                                    type={data.type}
                                    id={data.label}
                                    placeholder={data.placeholder}
                                    className="w-[300px"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      );
                    }
                  })}
                </div>
              </TabsContent >
              <TabsContent value='contactData' className='px-2 py-2'>
                {accordion2Errors && (
                  <Badge className="h-6" variant="destructive">
                    Falta corregir algunos campos
                  </Badge>
                )}
                <div className="min-w-full max-w-sm flex flex-wrap gap-8">
                  {CONTACTDATA?.map((data, index) => {
                    if (data.type === 'select') {
                      return (
                        <div key={index} className="w-[300px] flex flex-col gap-2">
                          <FormField
                            control={form.control}
                            name={data.name as names}
                            render={({ field }) => {
                              return (
                                <FormItem>
                                  <FormLabel>
                                    {data.label}
                                    <span style={{ color: 'red' }}> *</span>
                                  </FormLabel>
                                  <FormControl>
                                    <SelectWithData
                                      disabled={readOnly}
                                      placeholder={data.placeholder}
                                      field={{ ...field }}
                                      options={data.options}
                                      editing={true}
                                      value={field.value || ''}
                                      handleProvinceChange={
                                        data.label === 'Provincia' ? handleProvinceChange : undefined
                                      }
                                      onChange={(event) => {
                                        if (data.name === 'province') {
                                          handleProvinceChange(event);
                                        }

                                        field.onChange(event);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                        </div>
                      );
                    } else {
                      return (
                        <div key={index} className="w-[300px] flex flex-col gap-2">
                          <FormField
                            control={form.control}
                            name={data.name as names}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {data.label}
                                  <span style={{ color: 'red' }}> *</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    disabled={readOnly}
                                    type={data.type}
                                    id={data.label}
                                    placeholder={data.placeholder}
                                    className="w-[300px]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      );
                    }
                  })}
                </div>

              </TabsContent>
              <TabsContent value='workData' className='px-2 py-2'>
                {accordion3Errors && (
                  <Badge className="h-6" variant="destructive">
                    Faltan corregir algunos campos
                  </Badge>
                )}
                <div className="min-w-full max-w-sm flex flex-wrap gap-8">
                  {LABORALDATA?.map((data, index) => {
                    if (data.name === 'date_of_admission') {
                      return (
                        <div key={index} className="w-[300px] flex flex-col gap-2">
                          <FormField
                            control={form.control}
                            name="date_of_admission"
                            render={({ field }) => {
                              const value = field.value;

                              if (value === 'undefined/undefined/undefined' || value === 'Invalid Date') {
                                field.value = '';
                              }

                              return (
                                <FormItem className="flex flex-col">
                                  <FormLabel>
                                    Fecha de ingreso <span style={{ color: 'red' }}> *</span>
                                  </FormLabel>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          disabled={readOnly}
                                          variant="outline"
                                          className={cn(
                                            'w-[300px] pl-3 text-left font-normal',
                                            !field.value && 'text-muted-foreground'
                                          )}
                                        >
                                          {field.value ? (
                                            format(
                                              field?.value,
                                              'PPP',
                                              {
                                                locale: es,
                                              } || undefined
                                            )
                                          ) : (
                                            <span>Elegir fecha</span>
                                          )}
                                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="flex w-full flex-col space-y-2 p-2" align="start">
                                      <Select
                                        onValueChange={(e) => {
                                          setMonth(new Date(e));
                                          setYear(e);
                                          const newYear = parseInt(e, 10);
                                          const dateWithNewYear = new Date(field.value);
                                          dateWithNewYear.setFullYear(newYear);
                                          field.onChange(dateWithNewYear);
                                          setMonth(dateWithNewYear);
                                        }}
                                        value={years || today.getFullYear().toString()}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Elegir año" />
                                        </SelectTrigger>
                                        <SelectContent position="popper">
                                          <SelectItem
                                            value={today.getFullYear().toString()}
                                            disabled={years === today.getFullYear().toString()}
                                          >
                                            {today.getFullYear().toString()}
                                          </SelectItem>
                                          {yearsAhead?.map((year) => (
                                            <SelectItem key={year} value={`${year}`}>
                                              {year}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Calendar
                                        month={month}
                                        onMonthChange={setMonth}
                                        toDate={today}
                                        locale={es}
                                        mode="single"
                                        selected={new Date(field.value) || today}
                                        onSelect={(e) => {
                                          field.onChange(e);
                                        }}
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                        </div>
                      );
                    }
                    if (data.type === 'select') {
                      const isMultiple = data.name === 'allocated_to' ? true : false;

                      if (isMultiple) {
                        return (
                          <div key={index}>
                            {role === "Invitado" ? null : (
                              <div className="w-[300px] flex flex-col gap-2 justify-center">
                                <FormField
                                  control={form.control}
                                  name={data.name as names}
                                  render={({ field }) => (
                                    <CheckboxDefaultValues
                                      disabled={readOnly}
                                      options={data.options}
                                      required={true}
                                      field={field}
                                      placeholder="Afectado a"
                                    />
                                  )}
                                />
                              </div>
                            )}
                          </div>

                        );
                      }
                      return (
                        <div key={index} className="w-[300px] flex flex-col gap-2">
                          <FormField
                            control={form.control}
                            name={data.name as names}
                            render={({ field }) => {
                              return (
                                <FormItem>
                                  <FormLabel>
                                    {data.label}
                                    <span style={{ color: 'red' }}> *</span>
                                  </FormLabel>
                                  <FormControl>
                                    <SelectWithData
                                      disabled={readOnly}
                                      placeholder={data.placeholder}
                                      isMultiple={isMultiple}
                                      options={data.options}
                                      field={{ ...field }}
                                      onChange={(event) => {
                                        field.onChange(event);
                                      }}
                                      value={field.value || ''}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                        </div>
                      );
                    } else {
                      return (
                        <div key={index} className="w-[300px] flex flex-col gap-2">
                          <FormField
                            control={form.control}
                            name={data.name as names}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {data.label}
                                  <span style={{ color: 'red' }}> *</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    disabled={readOnly}
                                    type={data.type}
                                    id={data.label}
                                    placeholder={data.placeholder}
                                    pattern={data.pattern}
                                    className="w-[300px]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                        </div>
                      );
                    }
                  })}
                  <FormField
                            control={form.control}
                            name="covenants"
                            render={({ field }) => (
                              <FormItem className="flex flex-col min-w-[250px] ">
                                <FormLabel>
                                  Convenio <span style={{ color: 'red' }}>*</span>
                                </FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        disabled={readOnly}
                                        variant="outline"
                                        role="combobox"
                                        value={field.value}
                                        className={cn('w-[300px] justify-between', !field.value && 'text-muted-foreground')}
                                      >
                                        {field.value || 'Seleccionar Convenio'}
                                        <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[300px] p-0 max-h-[200px] overflow-y-auto">
                                    <Command>
                                      <CommandInput disabled={readOnly} placeholder="Buscar convenio..." className="h-9" />
                                      <CommandEmpty className="py-2 px-2">
                                        <ModalCct modal="addCovenant" 
                                         fetchData={fetchData}
                                        >
                                          <Button
                                            disabled={readOnly}
                                            variant="outline"
                                            role="combobox"
                                            className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}
                                          >
                                            Agregar Convenio
                                            <PlusCircledIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                          </Button>
                                        </ModalCct>
                                      </CommandEmpty>
                                      <CommandGroup>
                                        {data.covenants?.map((option) => (
                                          <CommandItem
                                            value={option.name}
                                            key={option.name}
                                            onSelect={() => {
                                              form.setValue('covenants', option.name);
                                              const covenant_id = data.covenants.find((e) => e.id === option?.id);
                                              console.log('covenant_id', covenant_id?.id)
                                              fetchCategory(covenant_id?.id as any);
                                            }}
                                          >
                                            {option.name}
                                            <CheckIcon
                                              className={cn(
                                                'ml-auto h-4 w-4',
                                                option.name === field.value ? 'opacity-100' : 'opacity-0'
                                              )}
                                            />
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                                <FormDescription>Selecciona el convenio</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                              <FormItem className="flex flex-col min-w-[250px]">
                                <FormLabel>
                                  {' '}
                                  Categoría <span style={{ color: 'red' }}>*</span>
                                </FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        disabled={readOnly}
                                        variant="outline"
                                        role="combobox"
                                        className={cn('w-[300px] justify-between', !field.value && 'text-muted-foreground')}
                                      >
                                        {field.value || 'Seleccionar Categoría'}
                                        <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[300px] p-0">
                                    <Command>
                                      <CommandInput disabled={readOnly} placeholder="Buscar categoria..." className="h-9" />
                                      <CommandEmpty className="py-2 px-2">
                                        <ModalCct modal="addCategory" 
                                        fetchCategory={fetchCategory} covenantOptions={data.category as any}
                                        >
                                          <Button
                                            disabled={readOnly}
                                            variant="outline"
                                            role="combobox"
                                            className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}
                                          >
                                            Agregar Categoría
                                            <PlusCircledIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                          </Button>
                                        </ModalCct>
                                      </CommandEmpty>
                                      <CommandGroup>
                                        <>
                                          {data.category?.map((option) => (
                                            <CommandItem
                                              value={option.name}
                                              key={option.name}
                                              onSelect={() => {
                                                form.setValue('category', option.name);
                                              }}
                                            >
                                              {option.name}
                                              <CheckIcon
                                                className={cn(
                                                  'ml-auto h-4 w-4',
                                                  option.name === field.value ? 'opacity-100' : 'opacity-0'
                                                )}
                                              />
                                            </CommandItem>
                                           ))} 
                                        </>
                                        <>
                                          <ModalCct modal="addCategory" 
                                          fetchCategory={fetchCategory} covenantOptions={data.covenants}
                                          >
                                            <Button
                                              disabled={readOnly}
                                              variant="outline"
                                              role="combobox"
                                              className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}
                                            >
                                              Agregar Categoría
                                              <PlusCircledIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                          </ModalCct>
                                        </>
                                      </CommandGroup>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                                <FormDescription>Selecciona la categoría</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                </div>

              </TabsContent>
              <TabsContent value='documents' className='px-2 py-2'>
                <DocumentTable document={user?.document_number || ''} />
              </TabsContent>
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="w-fit">
                      {accion !== 'view' || !readOnly ? (
                        <Button type="submit" className="mt-5 ml-2">
                          {accion === 'edit' || accion === 'view' ? 'Guardar cambios' : 'Agregar empleado'}
                        </Button>
                      ) : null}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[250px]">
                    {!accordion1Errors && !accordion2Errors && !accordion3Errors
                      ? '¡Todo listo para agregar el empleado!'
                      : '¡Completa todos los campos para agregar el empleado'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Tabs>
            {/* <Accordion className="w-full" type="single" collapsible defaultValue="personal-data"> */}
            {/* <AccordionItem value="personal-data">
                <AccordionTrigger className="text-lg hover:no-underline">
                  <div className="flex gap-5 items-center flex-wrap">
                    <span className="hover:underline"> Datos personales </span>
                    {accordion1Errors && (
                      <Badge className="h-6 hover:no-underline" variant="destructive">
                        Falta corregir algunos campos
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="w-full ">
                  <div className="min-w-full max-w-sm flex flex-wrap gap-8 items-center">
                    {PERSONALDATA?.map((data, index) => {
                      if (data.type === 'file') {
                        return (
                          <div key={index} className="w-[300px] flex  gap-2">
                            <FormField
                              control={form.control}
                              name={data.name as names}
                              render={({ field }) => (
                                <FormItem className="">
                                  <FormControl>
                                    <div className="flex lg:items-center flex-wrap md:flex-nowrap flex-col lg:flex-row gap-8">
                                      <ImageHander
                                        labelInput="Subir foto"
                                        handleImageChange={handleImageChange}
                                        base64Image={base64Image} //nueva
                                        disabled={readOnly}
                                        inputStyle={{
                                          width: '400px',
                                          maxWidth: '300px',
                                        }}
                                      />
                                    </div>
                                  </FormControl>

                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        );
                      }
                      if (data.type === 'select') {
                        return (
                          <div key={index} className="w-[300px] flex flex-col gap-2">
                            <FormField
                              control={form.control}
                              name={data.name as names}
                              render={({ field }) => {
                                return (
                                  <FormItem>
                                    <FormLabel>
                                      {data.label}
                                      <span style={{ color: 'red' }}> *</span>
                                    </FormLabel>

                                    <SelectWithData
                                      disabled={readOnly}
                                      placeholder={data.placeholder}
                                      options={data.options}
                                      onChange={field.onChange}
                                      editing={true}
                                      value={field.value || ''}
                                      field={{ ...field }}
                                    />

                                    <FormMessage />
                                  </FormItem>
                                );
                              }}
                            />
                          </div>
                        );
                      } else {
                        return (
                          <div key={index} className="w-[300px] flex flex-col gap-2 ">
                            <FormField
                              control={form.control}
                              name={data.name as names}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    {data.label}
                                    <span style={{ color: 'red' }}> *</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      disabled={readOnly}
                                      type={data.type}
                                      id={data.label}
                                      placeholder={data.placeholder}
                                      className="w-[300px"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        );
                      }
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem> */}
            {/* <AccordionItem value="contact-data">
                <AccordionTrigger className="text-lg transition-all hover:no-underline">
                  <div className="flex gap-5 items-center flex-wrap">
                    <span className="hover:underline"> Datos de contacto </span>
                    {accordion2Errors && (
                      <Badge className="h-6" variant="destructive">
                        Falta corregir algunos campos
                      </Badge>
                    )}
                    
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="min-w-full max-w-sm flex flex-wrap gap-8">
                    {CONTACTDATA?.map((data, index) => {
                      if (data.type === 'select') {
                        return (
                          <div key={index} className="w-[300px] flex flex-col gap-2">
                            <FormField
                              control={form.control}
                              name={data.name as names}
                              render={({ field }) => {
                                return (
                                  <FormItem>
                                    <FormLabel>
                                      {data.label}
                                      <span style={{ color: 'red' }}> *</span>
                                    </FormLabel>
                                    <FormControl>
                                      <SelectWithData
                                        disabled={readOnly}
                                        placeholder={data.placeholder}
                                        field={{ ...field }}
                                        options={data.options}
                                        editing={true}
                                        value={field.value || ''}
                                        handleProvinceChange={
                                          data.label === 'Provincia' ? handleProvinceChange : undefined
                                        }
                                        onChange={(event) => {
                                          if (data.name === 'province') {
                                            handleProvinceChange(event);
                                          }

                                          field.onChange(event);
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                );
                              }}
                            />
                          </div>
                        );
                      } else {
                        return (
                          <div key={index} className="w-[300px] flex flex-col gap-2">
                            <FormField
                              control={form.control}
                              name={data.name as names}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    {data.label}
                                    <span style={{ color: 'red' }}> *</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      disabled={readOnly}
                                      type={data.type}
                                      id={data.label}
                                      placeholder={data.placeholder}
                                      className="w-[300px]"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        );
                      }
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem> */}
            {/* <AccordionItem value="laboral-data">
                <AccordionTrigger className="text-lg hover:no-underline">
                  <div className="flex gap-5 items-center flex-wrap hover:no-underline">
                    <span className="hover:underline">Datos laborales</span>
                    {accordion3Errors && (
                      <Badge className="h-6" variant="destructive">
                        Faltan corregir algunos campos
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="min-w-full max-w-sm flex flex-wrap gap-8">
                    {LABORALDATA?.map((data, index) => {
                      if (data.name === 'date_of_admission') {
                        return (
                          <div key={index} className="w-[300px] flex flex-col gap-2">
                            <FormField
                              control={form.control}
                              name="date_of_admission"
                              render={({ field }) => {
                                const value = field.value;

                                if (value === 'undefined/undefined/undefined' || value === 'Invalid Date') {
                                  field.value = '';
                                }

                                return (
                                  <FormItem className="flex flex-col">
                                    <FormLabel>
                                      Fecha de ingreso <span style={{ color: 'red' }}> *</span>
                                    </FormLabel>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <FormControl>
                                          <Button
                                            disabled={readOnly}
                                            variant="outline"
                                            className={cn(
                                              'w-[300px] pl-3 text-left font-normal',
                                              !field.value && 'text-muted-foreground'
                                            )}
                                          >
                                            {field.value ? (
                                              format(
                                                field?.value,
                                                'PPP',
                                                {
                                                  locale: es,
                                                } || undefined
                                              )
                                            ) : (
                                              <span>Elegir fecha</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                          </Button>
                                        </FormControl>
                                      </PopoverTrigger>
                                      <PopoverContent className="flex w-full flex-col space-y-2 p-2" align="start">
                                        <Select
                                          onValueChange={(e) => {
                                            setMonth(new Date(e));
                                            setYear(e);
                                            const newYear = parseInt(e, 10);
                                            const dateWithNewYear = new Date(field.value);
                                            dateWithNewYear.setFullYear(newYear);
                                            field.onChange(dateWithNewYear);
                                            setMonth(dateWithNewYear);
                                          }}
                                          value={years || today.getFullYear().toString()}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Elegir año" />
                                          </SelectTrigger>
                                          <SelectContent position="popper">
                                            <SelectItem
                                              value={today.getFullYear().toString()}
                                              disabled={years === today.getFullYear().toString()}
                                            >
                                              {today.getFullYear().toString()}
                                            </SelectItem>
                                            {yearsAhead?.map((year) => (
                                              <SelectItem key={year} value={`${year}`}>
                                                {year}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <Calendar
                                          month={month}
                                          onMonthChange={setMonth}
                                          toDate={today}
                                          locale={es}
                                          mode="single"
                                          selected={new Date(field.value) || today}
                                          onSelect={(e) => {
                                            field.onChange(e);
                                          }}
                                        />
                                      </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                  </FormItem>
                                );
                              }}
                            />
                          </div>
                        );
                      }
                      if (data.type === 'select') {
                        const isMultiple = data.name === 'allocated_to' ? true : false;

                        if (isMultiple) {
                          return (
                            <div key={index} className="w-[300px] flex flex-col gap-2 justify-center">
                              <FormField
                                control={form.control}
                                name={data.name as names}
                                render={({ field }) => (
                                  <CheckboxDefaultValues
                                    disabled={readOnly}
                                    options={data.options}
                                    required={true}
                                    field={field}
                                    placeholder="Afectado a"
                                  />
                                )}
                              />
                            </div>
                          );
                        }
                        return (
                          <div key={index} className="w-[300px] flex flex-col gap-2">
                            <FormField
                              control={form.control}
                              name={data.name as names}
                              render={({ field }) => {
                                return (
                                  <FormItem>
                                    <FormLabel>
                                      {data.label}
                                      <span style={{ color: 'red' }}> *</span>
                                    </FormLabel>
                                    <FormControl>
                                      <SelectWithData
                                        disabled={readOnly}
                                        placeholder={data.placeholder}
                                        isMultiple={isMultiple}
                                        options={data.options}
                                        field={{ ...field }}
                                        onChange={(event) => {
                                          field.onChange(event);
                                        }}
                                        value={field.value || ''}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                );
                              }}
                            />
                          </div>
                        );
                      } else {
                        return (
                          <div key={index} className="w-[300px] flex flex-col gap-2">
                            <FormField
                              control={form.control}
                              name={data.name as names}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    {data.label}
                                    <span style={{ color: 'red' }}> *</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      disabled={readOnly}
                                      type={data.type}
                                      id={data.label}
                                      placeholder={data.placeholder}
                                      pattern={data.pattern}
                                      className="w-[300px]"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        );
                      }
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem> */}
            {/* <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="w-fit">
                      {accion !== 'view' || !readOnly ? (
                        <Button type="submit" className="mt-5">
                          {accion === 'edit' || accion === 'view' ? 'Guardar cambios' : 'Agregar empleado'}
                        </Button>
                      ) : null}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[250px]">
                    {!accordion1Errors && !accordion2Errors && !accordion3Errors
                      ? '¡Todo listo para agregar el empleado!'
                      : '¡Completa todos los campos para agregar el empleado'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider> */}
            {/* </Accordion> */}
          </form>
        </Form>
      </section>
    </Suspense>
  );
}

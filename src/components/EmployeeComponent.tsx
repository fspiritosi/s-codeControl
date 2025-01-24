'use client';
require('dotenv').config();

import { CheckboxDefaultValues } from '@/components/CheckboxDefValues';
import { SelectWithData } from '@/components/SelectWithData';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useEmployeesData } from '@/hooks/useEmployeesData';
import { useImageUpload } from '@/hooks/useUploadImage';
import { handleSupabaseError } from '@/lib/errorHandler';
import { cn } from '@/lib/utils';
import { useCountriesStore } from '@/store/countries';
import { useLoggedUserStore } from '@/store/loggedUser';
import {
  civilStateOptionsENUM,
  documentOptionsENUM,
  genderOptionsENUM,
  instrutionsOptionsENUM,
  nacionaliOptionsENUM,
  typeOfContractENUM,
} from '@/types/enums';
import { names } from '@/types/types';
import { accordionSchema } from '@/zodSchemas/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { CalendarIcon } from '@radix-ui/react-icons';
import { PostgrestError } from '@supabase/supabase-js';
import { addMonths, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, ChevronsUpDown, Loader } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChangeEvent, useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '../../supabase/supabase';
import BackButton from './BackButton';

import AddCategoryModal from './AddCategoryModal';
import AddCovenantModal from './AddCovenantModal';
import AddGuildModal from './AddGuildModal';
import { DiagramDetailEmployeeView } from './Diagrams/DiagramDetailEmployeeView';
import { ImageHander } from './ImageHandler';
import { AlertDialogFooter } from './ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { CardDescription, CardHeader, CardTitle } from './ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

type Province = {
  id: number;
  name: string;
};
type dataType = {
  guild: {
    name: string;
    id: string;
    is_active: boolean;
  }[];
  covenants: {
    name: string;
    number: string;
    guild_id: string;
    id: string;
    is_active: boolean;
  }[];
  category: {
    name: string;
    id: string;
    covenant_id: string;
    is_active: boolean;
  }[];
};

type diagram = {
  id: string;
  created_at: string;
  employee_id: string;
  diagram_type: {
    id: string;
    name: string;
    color: string;
    company_id: string;
    created_at: string;
    short_description: string;
  };
  day: number;
  month: number;
  year: number;
};

export default function EmployeeComponent({
  guild,
  user,
  diagrams,
  covenants,
  categories,
  children,
  diagrams_types,
  activeEmploees,
  historyData,
  role
}: {
  historyData: any;
  role: string | null;
  user: any;
  activeEmploees: any;
  diagrams: EmployeeDiagramWithDiagramType[];
  diagrams_types: any;
  guild:
    | {
        value: string;
        label: string;
      }[]
    | undefined;
  covenants:
    | {
        id: string;
        name: string;
        guild_id: string;
      }[]
    | undefined;
  categories:
    | {
        id: string;
        name: string;
        covenant_id: string;
      }[]
    | undefined;
  children: React.ReactNode;
}) {

  const profile = useLoggedUserStore((state) => state);
  // const role = useLoggedUserStore((state) => state.roleActualCompany);
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
    resolver: zodResolver(accordionSchema),
    defaultValues: user || {
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
          guild_id: undefined,
          covenants_id: undefined,
          category_id: undefined,
        },
  });
  
  const [accordion1Errors, setAccordion1Errors] = useState(false);
  const [accordion2Errors, setAccordion2Errors] = useState(false);
  const [accordion3Errors, setAccordion3Errors] = useState(false);
  const [readOnly, setReadOnly] = useState(accion === 'view' ? true : false);

  const provinceId = provincesOptions?.find((province: Province) => province.name.trim() === user?.province)?.id;

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
    {
      label: 'Sindicato',
      type: 'combobox',
      placeholder: 'Sindicato',
      options: guild,
      name: 'guild_id',
    },
    {
      label: 'Convenio',
      type: 'combobox',
      placeholder: 'Convenio',
      options: covenants
        ?.filter((e) => e.guild_id === form.getValues('guild_id'))
        .map((e) => {
          return {
            label: e.name,
            value: e.id,
          };
        }),
      name: 'covenants_id',
    },
    {
      label: 'Categoria',
      type: 'combobox',
      placeholder: 'Categoria',
      options: categories
        ?.filter((e) => e.covenant_id === form.getValues('covenants_id'))
        .map((e) => {
          return {
            label: e.name,
            value: e.id,
          };
        }),
      name: 'category_id',
    },
  ];

  const handleProvinceChange = (name: any) => {
    const provinceId = provincesOptions.find((province: Province) => province.name.trim() === name)?.id;
    fetchCityValues(provinceId);
  };

  async function onCreate(values: z.infer<typeof accordionSchema>) {
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

  // 2. Define a submit handler.
  async function onUpdate(values: z.infer<typeof accordionSchema>) {
    function compareContractorEmployees(
      originalObj: z.infer<typeof accordionSchema>,
      modifiedObj: z.infer<typeof accordionSchema>
    ) {
      const originalSet = new Set(originalObj.allocated_to);
      const modifiedSet = new Set(modifiedObj.allocated_to);
      // Valores a eliminar
      const valuesToRemove = [...originalSet].filter((value) => !modifiedSet.has(value));

      // Valores a agregar
      const valuesToAdd = [...modifiedSet].filter((value) => !originalSet.has(value));

      // Valores que se mantienen
      const valuesToKeep = [...originalSet].filter((value) => modifiedSet.has(value));

      return {
        valuesToRemove,
        valuesToAdd,
        valuesToKeep,
      };
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
          province: String(provincesOptions.find((e) => e.name.trim() === values.province)?.id),
          birthplace: String(countryOptions.find((e) => e.name === values.birthplace)?.id),
          city: String(citysOptions.find((e) => e.name.trim() === values.city)?.id),
          hierarchical_position: String(hierarchyOptions.find((e) => e.name === values.hierarchical_position)?.id),
          workflow_diagram: String(workDiagramOptions.find((e) => e.name === values.workflow_diagram)?.id),
        };
        //console.log(finalValues, 'finalValues');
        const result = compareContractorEmployees(user, finalValues as any);
        result.valuesToRemove.forEach(async (e) => {
          const { error } = await supabase
            .from('contractor_employee')
            .delete()
            .eq('employee_id', user.id)
            .eq('contractor_id', e);
          if (error) return handleSupabaseError(error.message);
        });

        const error2 = await Promise.all(
          result.valuesToAdd.map(async (e) => {
            if (!result.valuesToKeep.includes(e)) {
              const { error } = await supabase
                .from('contractor_employee')
                .insert({ employee_id: user.id, contractor_id: e });
              if (error) return handleSupabaseError(error.message);
            }
          })
        );

        if (error2 && typeof error2[0] === 'string') {
          throw new Error(error2[0]);
        }

        try {
          await updateEmployee(finalValues, user?.id);
          await handleUpload();
          // getEmployees(true);
          // setActivesEmployees();
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
  //console.log(form.formState.errors, 'errors');
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
      await supabase
        .from('employees')
        .update({
          is_active: false,
          termination_date: data.termination_date,
          reason_for_termination: data.reason_for_termination,
        })
        .eq('document_number', user.document_number)
        .select();

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
  const guildId = useWatch({ control: form.control, name: 'guild_id' });
  const covenantsId = useWatch({ control: form.control, name: 'covenants_id' });

  return (
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
              <CardDescription className="text-muted-foreground text-3xl flex items-center gap-4">
                {`${user?.lastname || 'cargando...'}
                ${user?.firstname || ''}`}{' '}
                {!user?.is_active && <Badge variant={'destructive'}>Dado de baja</Badge>}
              </CardDescription>
            </div>
          ) : (
            <h2 className="text-4xl">{accion === 'edit' ? 'Editar empleado' : 'Agregar empleado'}</h2>
          )}
          {role !== 'Invitado' && readOnly && accion === 'view' ? (
            <div className="flex flex-grap gap-2">
              <Button
                variant="default"
                onClick={() => {
                  setReadOnly(false);
                }}
              >
                Habilitar edición
              </Button>
              <BackButton />
            </div>
          ) : (
            !readOnly &&
            accion !== 'new' &&
            role !== 'Invitado' && (
              <div className="flex flex-grap gap-2">
                <Dialog onOpenChange={() => setShowModal(!showModal)}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">Dar de baja</Button>
                  </DialogTrigger>
                  <BackButton />
                  <DialogContent className="dark:bg-slate-950">
                    <DialogTitle>Dar de baja</DialogTitle>
                    <DialogDescription>
                      ¿Estás seguro de que deseas eliminar este empleado?
                      <br /> Completa los campos para continuar.
                    </DialogDescription>
                    <AlertDialogFooter>
                      <div className="w-full">
                        <Form {...form2}>
                          <form onSubmit={form2.handleSubmit(onDelete)} className="space-y-8">
                            <FormField
                              control={form2.control}
                              name="reason_for_termination"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Motivo de baja</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecciona la razón" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Despido sin causa">Despido sin causa</SelectItem>
                                      <SelectItem value="Renuncia">Renuncia</SelectItem>
                                      <SelectItem value="Despido con causa">Despido con causa</SelectItem>
                                      <SelectItem value="Acuerdo de partes">Acuerdo de partes</SelectItem>
                                      <SelectItem value="Fin de contrato">Fin de contrato</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>
                                    Elige la razón por la que deseas eliminar al empleado
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form2.control}
                              name="termination_date"
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel>Fecha de baja</FormLabel>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant={'outline'}
                                          className={cn(
                                            ' pl-3 text-left font-normal',
                                            !field.value && 'text-muted-foreground'
                                          )}
                                        >
                                          {field.value ? (
                                            format(field.value, 'PPP', {
                                              locale: es,
                                            })
                                          ) : (
                                            <span>Elegir fecha</span>
                                          )}
                                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-2" align="start">
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
                                        disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                                        selected={new Date(field.value) || today}
                                        onSelect={(e) => {
                                          field.onChange(e);
                                        }}
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  <FormDescription>Fecha en la que se terminó el contrato</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex gap-4 justify-end">
                              <Button variant="destructive" type="submit">
                                Eliminar
                              </Button>
                              <DialogClose>Cancelar</DialogClose>
                            </div>
                          </form>
                        </Form>
                      </div>
                    </AlertDialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )
          )}
        </CardHeader>
      </header>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(accion === 'edit' || accion === 'view' ? onUpdate : onCreate)}
          className="w-full"
        >
          <Tabs defaultValue="personalData" className="w-full m-4">
            <TabsList>
              <TabsTrigger value={'personalData'} className={cn(accordion1Errors && 'bg-red-300 text-red-50')}>
                Datos Personales
              </TabsTrigger>
              <TabsTrigger value={'contactData'} className={cn(accordion2Errors && 'bg-red-300 text-red-50')}>
                Datos de Contacto
              </TabsTrigger>
              <TabsTrigger value={'workData'} className={cn(accordion3Errors && 'bg-red-300 text-red-50')}>
                Datos Laborales
              </TabsTrigger>
              {user && <TabsTrigger value="documents">Documentación</TabsTrigger>}
              {user && <TabsTrigger value="diagrams">Diagramas</TabsTrigger>}
            </TabsList>
            <TabsContent value="personalData" className="px-2 py-2">
              {accordion1Errors && (
                <Badge className="h-6 hover:no-underline" variant="destructive">
                  Falta corregir algunos campos
                </Badge>
              )}
              <div className="min-w-full max-w-sm flex flex-wrap gap-8 items-center">
                {PERSONALDATA?.map((data, index) => {
                  if (data.type === 'file') {
                    return (
                      // <div key={crypto.randomUUID()} className="w-[300px] flex  gap-2">
                      <div key={data.name} className="w-[300px] flex  gap-2">
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
                      // <div key={crypto.randomUUID()} className="w-[300px] flex flex-col gap-2">
                      <div key={data.name} className="w-[300px] flex flex-col gap-2">
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
                      // <div key={crypto.randomUUID()} className="w-[300px] flex flex-col gap-2 ">
                      <div key={data.name} className="w-[300px] flex flex-col gap-2 ">
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
            </TabsContent>
            <TabsContent value="contactData" className="px-2 py-2">
              {accordion2Errors && (
                <Badge className="h-6" variant="destructive">
                  Falta corregir algunos campos
                </Badge>
              )}
              <div className="min-w-full max-w-sm flex flex-wrap gap-8">
                {CONTACTDATA?.map((data, index) => {
                  if (data.type === 'select') {
                    return (
                      // <div key={crypto.randomUUID()} className="w-[300px] flex flex-col gap-2">
                      <div key={data.name} className="w-[300px] flex flex-col gap-2">
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
                                    handleProvinceChange={data.label === 'Provincia' ? handleProvinceChange : undefined}
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
                      // <div key={crypto.randomUUID()} className="w-[300px] flex flex-col gap-2">
                      <div key={data.name} className="w-[300px] flex flex-col gap-2">
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
            <TabsContent value="workData" className="px-2 py-2">
              {accordion3Errors && (
                <Badge className="h-6" variant="destructive">
                  Faltan corregir algunos campos
                </Badge>
              )}
              <div className="min-w-full max-w-sm flex flex-wrap gap-8">
                {LABORALDATA?.map((data, index) => {
                  if (data.name === 'date_of_admission') {
                    return (
                      // <div key={crypto.randomUUID()} className="w-[300px] flex flex-col gap-2">
                      <div key={data.name} className="w-[300px] flex flex-col gap-2">
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
                                          format(field?.value, 'PPP', {
                                            locale: es,
                                          } as any)
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
                        // <div key={crypto.randomUUID()}>
                        <div key={data.name}>
                          {role === 'Invitado' ? null : (
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
                      // <div key={crypto.randomUUID()} className="w-[300px] flex flex-col gap-2">
                      <div key={data.name} className="w-[300px] flex flex-col gap-2">
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
                  } else if (data.type === 'combobox') {
                    return (
                      <FormField
                        // key={crypto.randomUUID()}
                        key={data.name}
                        control={form.control}
                        name={data.name as names}
                        render={({ field }) => {
                          let disabled = readOnly;

                          if (field.name === 'guild_id') {
                            // guild_id está habilitado a menos que readOnly sea true
                            disabled = readOnly;
                          } else if (field.name === 'covenants_id') {
                            // covenants_id está habilitado solo si guild_id tiene un valor
                            disabled = readOnly || !guildId;
                          } else if (field.name === 'category_id') {
                            // category_id está habilitado solo si covenants_id tiene un valor
                            disabled = readOnly || !covenantsId;
                          }
                          let selectedCovenantInfo=[{name:'',id:''}]
                          const selectedGuildInfo =
                            guild
                              ?.filter((e) => e.value === guildId)
                              ?.map((e) => {
                                selectedCovenantInfo=[{name:'',id:''}]
                                return {
                                  name: e.label,
                                  id: e.value,
                                  
                                };
                              }) || [];
                          // console.log(selectedGuildInfo, 'selectedGuildInfo');
                          selectedCovenantInfo =
                            covenants
                              ?.filter((e) => e.id === covenantsId)
                              .map((e) => {
                                return {
                                  name: e.name,
                                  id: e.id,
                                };
                              }) || [];

                          //console.log(selectedCovenantInfo, 'selectedCovenantInfo');

                          return (
                            <FormItem className="flex flex-col w-[300px]">
                              <FormLabel>{data.label}</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      disabled={disabled}
                                      value={field.value || ''}
                                      className={cn(
                                        'w-[300px] justify-between truncate',
                                        !field.value && 'text-muted-foreground'
                                      )}
                                    >
                                        {field.value
                                          ? (data?.options?.find((option: any) => option.value === field.value) as any)
                                          ?.label || field.value
                                          : `Seleccionar ${data.label}`
                                        }
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 " />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="p-0">
                                  <Command>
                                    <CommandInput placeholder={`Buscar ${data.label}...`} />
                                    <CommandList>
                                      <CommandEmpty>Sin resultados</CommandEmpty>
                                      <CommandGroup>
                                        {data?.options?.map((option: any) => (
                                          <CommandItem
                                          value={option.label}
                                          key={option.value}
                                          onSelect={() => {
                                            form.setValue(`${data.name as names}`, option.value);
                                            if (field.name === 'guild_id') {
                                              form.setValue('covenants_id', '');
                                              form.setValue('category_id', '');
                                            }
                                          }}
                                          >
                                            <Check
                                              className={cn(
                                                'mr-2 h-4 w-4',
                                                option.value === field.value ? 'opacity-100' : 'opacity-0'
                                              )}
                                            />
                                            {option.label}
                                          </CommandItem>
                                        ))}
                                        <CommandItem>
                                          {(field.name === 'guild_id' && <AddGuildModal fromEmployee />) ||
                                            (field.name === 'covenants_id' && (
                                              <AddCovenantModal fromEmployee guildInfo={selectedGuildInfo[0]} />
                                            )) ||
                                            (field.name === 'category_id' && (
                                              <AddCategoryModal fromEmployee covenantInfo={selectedCovenantInfo[0]} />
                                            ))}
                                        </CommandItem>
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    );
                  } else {
                    return (
                      // <div key={crypto.randomUUID()} className="w-[300px] flex flex-col gap-2">
                      <div key={data.name} className="w-[300px] flex flex-col gap-2">
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
                {/* <div> */}
                {/* <FormField
                    control={form.control}
                    name="guild"
                    render={({ field }) => (
                      <FormItem className="flex flex-col min-w-[250px] overflow-x-hidden">
                        <FormLabel>Asosiacion gremial</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                disabled={readOnly}
                                variant="outline"
                                role="combobox"
                                value={field.value || ''}
                                className={cn('w-[300px] justify-between', !field.value && 'text-muted-foreground')}
                              >
                                {typeof field.value === 'string'
                                  ? field.value
                                  : field.value
                                    ? getFieldName(field.value)
                                    : 'Seleccionar Asosiacion gremial'}

                                <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0 max-h-[200px] overflow-y-auto" asChild>
                            <Command>
                              <CommandInput
                                disabled={readOnly}
                                placeholder="Buscar  Asosiacion gremial..."
                                value={searchText}
                                onValueChange={(value: any) => setSearchText(value)}
                                className="h-9"
                              />
                              <CommandEmpty className="py-2 px-2">
                                <ModalCct modal="addGuild" fetchGuild={fetchGuild} searchText={searchText}>
                                  <Button
                                    disabled={readOnly}
                                    variant="outline"
                                    role="combobox"
                                    className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}
                                  >
                                    Agregar Asosiacion gremial
                                    <PlusCircledIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </ModalCct>
                              </CommandEmpty>
                              <CommandGroup className="max-h-[200px] overflow-y-auto">
                                {data2.guild?.map((option) => (
                                  <CommandItem
                                    value={option.name}
                                    key={option.id}
                                    onSelect={() => {
                                      form.setValue('guild', option.name);
                                      form.setValue('guild_id', option.id);
                                      const guild_id = data2.guild.find((e) => e.id === option?.id);
                                      setGuildId((guild_id as any) || null);
                                      fetchCovenant(guild_id?.id as any);
                                      form.setValue('covenants', null);
                                      form.setValue('category', null);
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
                        <FormDescription>Selecciona la Asosiacion Gremial</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  /> */}
                {/* <FormField
                    control={form.control}
                    name="covenants"
                    render={({ field }) => (
                      <FormItem className="flex flex-col min-w-[250px] overflow-x-hidden">
                        <FormLabel>Convenio</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                disabled={readOnly}
                                variant="outline"
                                role="combobox"
                                value={field.value || undefined}
                                className={cn('w-[300px] justify-between', !field.value && 'text-muted-foreground')}
                              >
                                {typeof field.value === 'string' && field.value !== ''
                                  ? field.value
                                  : field.value
                                    ? getFieldName(field.value)
                                    : 'Seleccionar Convenio'}
                                <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0 max-h-[200px] overflow-y-auto" asChild>
                            <Command>
                              <CommandInput
                                disabled={readOnly}
                                placeholder="Buscar convenio..."
                                onValueChange={(value: any) => setSearchText(value)}
                                className="h-9"
                              />
                              <CommandEmpty className="py-2 px-2">
                                <ModalCct
                                  modal="addCovenant"
                                  fetchData={fetchCovenant}
                                  guildId={guildId}
                                  searchText={searchText}
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
                              <CommandGroup className="max-h-[200px] overflow-y-auto">
                                {data2.covenants?.map((option) => (
                                  <CommandItem
                                    value={option.name}
                                    key={option.id}
                                    onSelect={() => {
                                      form.setValue('covenants', option.name);
                                      form.setValue('covenants_id', option.id);

                                      const covenant_id = data2.covenants.find((e) => e.id === option?.id);

                                      setCovenantId((covenant_id?.id as any) || null);

                                      fetchCategory(covenant_id?.id as any);
                                      form.setValue('category', null);
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
                  /> */}
                {/* <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem className="flex flex-col min-w-[250px] overflow-x-hidden">
                        <FormLabel>Categoría</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                disabled={readOnly}
                                variant="outline"
                                role="combobox"
                                className={cn('w-[300px] justify-between', !field.value && 'text-muted-foreground')}
                              >
                                {typeof field.value === 'string' && field.value !== ''
                                  ? field.value
                                  : field.value
                                    ? getFieldName(field.value)
                                    : 'Seleccionar Categoría'}
                                <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" asChild>
                            <Command>
                              <CommandInput
                                disabled={readOnly}
                                placeholder="Buscar categoria..."
                                onValueChange={(value: any) => setSearchText(value)}
                                className="h-9"
                              />
                              <CommandEmpty className="py-2 px-2">
                                <ModalCct
                                  modal="addCategory"
                                  fetchCategory={fetchCategory}
                                  covenant_id={covenantId as any}
                                  covenantOptions={data2.category as any}
                                  searchText={searchText}
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
                              <CommandGroup className="max-h-[200px] overflow-y-auto">
                                <>
                                  {data2?.category?.map((option) => (
                                    <CommandItem
                                      value={option.name ?? 'none'}
                                      key={option.id ?? 'none'}
                                      onSelect={() => {
                                        form.setValue('category', option.name);
                                        form.setValue('category_id', option.id);
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
                                  <ModalCct
                                    modal="addCategory"
                                    fetchCategory={fetchCategory}
                                    covenant_id={covenantId}
                                    covenantOptions={data2.covenants}
                                  >
                                    <Button
                                      disabled={readOnly}
                                      variant="outline"
                                      role="combobox"
                                      className={cn('w-full justify-between', !field.name && 'text-muted-foreground')}
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
                  /> */}
              </div>
            </TabsContent>
            <TabsContent value="documents" className="px-2 py-2">
              {children}
            </TabsContent>
            <TabsContent value="diagrams" className="px-2 py-2">
              <DiagramDetailEmployeeView role={role} historyData={historyData} diagrams={diagrams as any} diagrams_types={diagrams_types} activeEmploees={activeEmploees}  />
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
        </form>
      </Form>
    </section>
  );
}

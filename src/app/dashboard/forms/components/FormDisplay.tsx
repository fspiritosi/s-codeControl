'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { COMPANIES_TABLE, DOCUMENTS_TABLE, EMPLOYEES_TABLE, VEHICLES_TABLE } from '@/lib/utils/utils';
import { useCountriesStore } from '@/store/countries';
import { useLoggedUserStore } from '@/store/loggedUser';
import { Campo, FormField, types } from '@/types/types';
import { useRouter } from 'next/navigation';
import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { toast } from 'sonner';
import FieldRenderer from '../formUtils/fieldRenderer';
import { buildFormData } from '../formUtils/formUtils';

interface FormDisplayProps {
  campos: Campo[];
  setCampos?: Dispatch<SetStateAction<Campo[]>>;
  fetchForms?: () => void;
  selectedForm?: Campo[] | undefined;
  created?: boolean;
}

export function FormDisplay({ campos, setCampos, fetchForms, selectedForm, created }: FormDisplayProps) {
  const supabase = supabaseBrowser();
  const vehicles = useLoggedUserStore((state) => state.vehicles);
  const employees = useLoggedUserStore((state) => state.employees);
  const currentCompany: any = [useLoggedUserStore((state) => state.actualCompany)].map((e) => {
    return {
      ...e,
      city: e?.city.name,
    };
  })[0];
  const documenttypes = useCountriesStore((state) => state.companyDocumentTypes);

  const router = useRouter();

  const applies = campos.find((e) => e.tipo === types.NombreFormulario)?.apply;

  function getColumnValues<T>(table: string, column: any) {
    if (table === 'employees') return Array.from(new Set(employees.map((e: any) => e[column])));
    if (table === 'vehicles') return Array.from(new Set(vehicles.map((e: any) => e[column])));
    if (table === 'company') return Array.from(new Set([currentCompany?.[column]]));
    if (table === 'document_types') return Array.from(new Set(documenttypes.map((e: any) => e[column])));

    return ['Selecciona a que aplica el formulario'];
  }
  const shouldShowAllOptions = {
    employees: [
      'document_type',
      'gender',
      'marital_status',
      'level_of_education',
      'province',
      'affiliate_status',
      'company_position',
    ],
  };

  const fetchOptions = async (selectedOption: string, column: string) => {
    // Implementa la lógica para obtener opciones aquí
    // Ejemplo:
    return []; // Devuelve las opciones obtenidas
  };

  // Mapea el valor de 'applies' a la tabla correspondiente
  const getValuesForField = (applies: string, column: string) => {
    switch (applies) {
      case 'employees':
        const shouldFetch = shouldShowAllOptions.employees.includes(column);
        if (shouldFetch) {
          return fetchOptions(applies, column);
        } else {
          return getColumnValues('employees', column);
        }
      case 'documents':
        return getColumnValues('document_types', column);
      case 'equipment':
        return getColumnValues('vehicles', column);
      case 'company':
        return getColumnValues('company', column);
      default:
        return [];
    }
  };
  const [options, setOptions] = useState<any>([]);

  const renderizarCampo = (campo: Campo, index: number) => {
    switch (campo.tipo) {
      case 'Nombre del formulario':
        return (
          <div className="w-full my-5" key={crypto.randomUUID()}>
            <Label>
              <Badge className="text-xl"> {campo.value ?? 'Nombre del formulario'}</Badge>
            </Label>
          </div>
        );
      case 'Texto':
        return (
          <div className="col-span-3" key={crypto.randomUUID()}>
            <CardDescription className="mb-2">{campo.title ? campo.title : 'Titulo del campo'}</CardDescription>
            <Input placeholder={campo.value} />
            {campo.date && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Fecha</CardDescription>
                <Input type="date" />
              </div>
            )}
            {campo.observation && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Observaciones</CardDescription>
                <Textarea placeholder="..." />
              </div>
            )}
          </div>
        );
      case 'Área de texto':
        return (
          <div className="col-span-3" key={crypto.randomUUID()}>
            <CardDescription className="mb-2">{campo.title ? campo.title : 'Titulo del campo'}</CardDescription>
            <Textarea placeholder={campo.value} />
            {campo.date && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Fecha</CardDescription>
                <Input type="date" />
              </div>
            )}
            {campo.observation && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Observaciones</CardDescription>
                <Textarea placeholder="..." />
              </div>
            )}
          </div>
        );
      case 'Separador':
        return (
          <div className="col-span-3 w-full px-[20%]" key={crypto.randomUUID()}>
            <Separator>{campo.value}</Separator>
          </div>
        );
      case 'Radio':
        return (
          <div className="w-full" key={crypto.randomUUID()}>
            <CardDescription className="mb-2"> {campo.title ? campo.title : 'Titulo del campo'}</CardDescription>
            <RadioGroup className="flex gap-2 flex-col mt-2">
              {campo.opciones?.map((opcion, i) => (
                <div key={i} className="flex items-center space-x-2 ">
                  <RadioGroupItem value={String(i)} id={String(i)} />
                  <Label htmlFor={String(i)}>{opcion ? opcion : `Opcion ${i + 1}`}</Label>
                </div>
              ))}
            </RadioGroup>
            {campo.date && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Fecha</CardDescription>
                <Input type="date" />
              </div>
            )}
            {campo.observation && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Observaciones</CardDescription>
                <Textarea placeholder="..." />
              </div>
            )}
          </div>
        );
      case 'Seleccion multiple':
        return (
          <div className="w-full" key={crypto.randomUUID()}>
            <CardDescription className="mb-2"> {campo.title ? campo.title : 'Titulo del campo'}</CardDescription>
            <ToggleGroup type="multiple" className="flex w-full justify-start flex-wrap">
              {campo.opciones?.map((opcion, i) => {
                return (
                  <ToggleGroupItem className="flex self-start border-muted-foreground border" key={i} value={opcion}>
                    {opcion}
                  </ToggleGroupItem>
                );
              })}
            </ToggleGroup>
            {campo.date && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Fecha</CardDescription>
                <Input type="date" />
              </div>
            )}
            {campo.observation && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Observaciones</CardDescription>
                <Textarea placeholder="..." />
              </div>
            )}
          </div>
        );
      case 'Fecha':
        return (
          <div className="w-full" key={crypto.randomUUID()}>
            <CardDescription className="mb-2">{campo.title ? campo.title : 'Titulo del campo'}</CardDescription>
            <Input type="date" value={campo.value} placeholder={campo.placeholder} />
          </div>
        );
      case 'Seleccion':
        return (
          <div className="col-span-2" key={crypto.randomUUID()}>
            <CardDescription className="mb-2"> {campo.title ? campo.title : 'Titulo del campo'}</CardDescription>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una opción" />
              </SelectTrigger>
              <SelectContent>
                {campo.opciones?.map((opcion, i) => {
                  return (
                    <SelectItem key={i} value={opcion || `Opcion ${i + 1}`}>
                      {opcion || `Opcion ${i + 1}`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {campo.date && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Fecha</CardDescription>
                <Input type="date" />
              </div>
            )}
            {campo.observation && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Observaciones</CardDescription>
                <Textarea placeholder="..." />
              </div>
            )}
          </div>
        );
      case 'Seleccion Predefinida':
        const loadOptions = useCallback(async () => {
          if (campo.tipo === 'Seleccion Predefinida') {
            const values = await getValuesForField(applies || '', campo.opciones[0]);
            setOptions(values);
          }
        }, [campo]);

        return (
          <div className="w-full" key={crypto.randomUUID()}>
            <CardDescription className="mb-2"> {campo.title ? campo.title : 'Titulo del campo'}</CardDescription>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar opcion" />
              </SelectTrigger>
              <SelectContent>
                {campo.opciones?.map((opcion, i) => {
                  const label =
                    EMPLOYEES_TABLE[opcion as 'lastname'] ||
                    VEHICLES_TABLE[opcion as 'domain'] ||
                    COMPANIES_TABLE[opcion as 'city'] ||
                    DOCUMENTS_TABLE[opcion as 'special'];

                  return (
                    <SelectGroup key={i}>
                      <SelectLabel>{label}</SelectLabel>
                      {options.map((value: string, j: any) => (
                        <SelectItem key={j} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  );
                })}
              </SelectContent>
            </Select>
            {campo.date && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Fecha</CardDescription>
                <Input type="date" />
              </div>
            )}
            {campo.observation && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Observaciones</CardDescription>
                <Textarea placeholder="..." />
              </div>
            )}
          </div>
        );
      case 'Subtitulo':
        return (
          <div className="col-span-3" key={crypto.randomUUID()}>
            <CardTitle className="mb-2 mt-1">{campo.title ? campo.title : 'Titulo del campo'}</CardTitle>
          </div>
        );
      case 'Si-No':
        return (
          <div className="w-full" key={crypto.randomUUID()}>
            <CardDescription className="mb-2"> {campo.title ? campo.title : 'Titulo del campo'}</CardDescription>
            <RadioGroup className="flex gap-2  mt-2">
              {campo.opciones?.map((opcion, i) => (
                <div key={i} className="flex items-center space-x-2 ">
                  <RadioGroupItem value={String(i)} id={String(i)} />
                  <Label htmlFor={String(i)}>{opcion ? opcion : `Opcion ${i + 1}`}</Label>
                </div>
              ))}
            </RadioGroup>
            {campo.date && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Fecha</CardDescription>
                <Input type="date" />
              </div>
            )}
            {campo.observation && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Observaciones</CardDescription>
                <Textarea placeholder="..." />
              </div>
            )}
          </div>
        );
      case 'Titulo':
        return (
          <div className="col-span-3" key={crypto.randomUUID()}>
            <CardTitle className="mb-2 mt-1 text-xl">{campo.title ? campo.title : 'Titulo del campo'}</CardTitle>
          </div>
        );
      case 'Seccion':
        return (
          <div className="w-full" key={crypto.randomUUID()}>
            <CardTitle className="mb-2 mt-1 text-xl">{campo.title ? campo.title : 'Titulo del campo'}</CardTitle>
            <div className="grid grid-cols-3 gap-y-4 gap-x-4">
              {campo.sectionCampos?.map((opcion, i) => {
                return (
                  // <div key={i} className='grid bg-blue-500'>
                  renderizarCampo(opcion, i)
                  // </div>
                );
              })}
            </div>

            {campo.date && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Fecha</CardDescription>
                <Input type="date" />
              </div>
            )}
            {campo.observation && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Observaciones</CardDescription>
                <Textarea placeholder="..." />
              </div>
            )}
            <Separator className="my-2" />
          </div>
        );
      case 'Archivo':
        return (
          <div className="w-full" key={crypto.randomUUID()}>
            <CardDescription className="mb-2"> {campo.title ? campo.title : 'Titulo del campo'}</CardDescription>
            <Input type="file" />
            {campo.date && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Fecha</CardDescription>
                <Input type="date" />
              </div>
            )}
            {campo.observation && (
              <div className="flex flex-col gap-2 mt-2">
                <CardDescription>Observaciones</CardDescription>
                <Textarea placeholder="..." />
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };
  const actualCompany = useLoggedUserStore((state) => state.actualCompany);

  const handleCreateCheckList = async () => {
    toast.promise(
      async () => {
        setDisabled(true);

        if (!campos.find((e) => e.tipo === types.NombreFormulario)?.value) {
          document.getElementById('MissingName')?.style.setProperty('color', 'red');
          setDisabled(false);

          throw new Error('El formulario debe tener un nombre');
        }

        if (!campos.find((e) => e.tipo === types.NombreFormulario)?.apply) {
          document.getElementById('MissingName')?.style.setProperty('color', 'red');
          setDisabled(false);
          throw new Error('El formulario debe tener una aplicación');
        }

        document.getElementById('MissingName')?.style.setProperty('color', 'black');
        const { data, error } = await supabase.from('custom_form').insert({
          company_id: actualCompany?.id,
          form: campos,
          name: campos.find((e) => e.tipo === types.NombreFormulario)?.value,
        } as any);

        if (error) {
          throw new Error(error.message);
        } else {
          if (fetchForms && setCampos) {
            fetchForms();
            setCampos([
              {
                tipo: types.NombreFormulario,
                placeholder: 'Ingresa el nombre del formulario',
                id: '1',
                title: 'Nombre del formulario',
                opciones: [],
              },
            ]);
          }
        }
      },
      {
        loading: 'Creando formulario...',
        success: () => {
          if (setCampos) {
            setCampos([
              {
                tipo: types.NombreFormulario,
                placeholder: 'Ingresa el nombre del formulario',
                id: '1',
                title: 'Nombre del formulario',
                opciones: [],
              },
            ]);
          }
          router.refresh();
          return 'Formulario creado exitosamente';
        },
        error: (error: string) => `Error al crear el formulario: ${error}`,
        finally: () => setDisabled(false),
      }
    );
  };
  const [disabled, setDisabled] = useState(false);

  const formObject = campos.length ? buildFormData(campos, true) : [];
  return (
    <ScrollArea className="min-h-[60vh] px-8 py-5 overflow-auto  rounded-e-xl rounded">
      <div className="flex justify-between items-center">
        <CardTitle className="text-2xl font-bold">Vista previa del formulario</CardTitle>
        <Avatar>
          <AvatarImage src={actualCompany?.company_logo ?? ''} alt="Logo de la empresa" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </div>
      <div className="space-y-3">
        {selectedForm ? (
          <div className="grid grid-cols-3 gap-y-4 gap-x-4">
            {formObject?.map((campo: FormField, index: number) => (
              <FieldRenderer
                key={crypto.randomUUID()}
                campo={campo}
                form={null}
                index={index}
                completObjet={formObject}
              />
            ))}
          </div>
        ) : (
          campos.map((campo, index) => <div key={crypto.randomUUID()}>{renderizarCampo(campo, index)}</div>)
        )}
        <div className="flex w-full justify-center">
          <Button disabled={campos.length < 2 || created} onClick={handleCreateCheckList}>
            {created ? 'Editar formulario' : 'Crear formulario'}
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}

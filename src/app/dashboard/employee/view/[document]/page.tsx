'use client'
const getUser = (id: string) => {
  const data = [
    {
      email: 'juan.perez@example.com',
      cuil: '29-12345678-9',
      document_number: '12345678',
      company_position: 'Gerente',
      normal_hours: '8',
      type_of_contract: 'A tiempo indeterminado',
      allocated_to: [
        '5fb4c23f-c734-492e-ad76-1b744c8c26e2',
        'a33dc8c3-0b18-4d1e-885b-bcd4144234c2',
      ],
      picture: 'picture.com',
      nationality: 'Argentina',
      lastname: 'Pérez',
      firstname: 'Juan',
      document_type: 'DNI',
      birthplace: 'Argentina',
      gender: 'Masculino',
      marital_status: 'Soltero',
      level_of_education: 'Universitario',
      street: 'Calle 123',
      street_number: '456',
      province: 'Buenos Aires',
      postal_code: '1234',
      phone: '12345678',
      file: '456',
      date_of_admission: '01/09/2030',
      affiliate_status: 'Convenio',
      city: '3 de febrero',
      hierarchical_position: 'Gerente',
      workflow_diagram: 'Lunes a Viernes',
    },
  ]

  return data.find(user => user.document_number === id)
}

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useEmployeesData } from '@/hooks/useEmployeesData'
import { useCountriesStore } from '@/store/countries'
import {
  civilStateOptionsENUM,
  documentOptionsENUM,
  genderOptionsENUM,
  instrutionsOptionsENUM,
  nacionaliOptionsENUM,
  typeOfContractENUM,
} from '@/types/enums'

import { SelectWithData } from '@/components/SelectWithData'
import { UploadImage } from '@/components/UploadImage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { names } from '@/types/types'
import { accordionSchema } from '@/zodSchemas/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon } from '@radix-ui/react-icons'
import { PostgrestError } from '@supabase/supabase-js'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { CheckboxDefaultValues } from '@/components/CheckboxDefValues'

type Province = {
  id: number
  name: string
}

export default function page({ params }: { params: any }) {
  const { document } = params
  const user = getUser(document)
  const fetchCityValues = useCountriesStore(state => state.fetchCities)
  const provincesOptions = useCountriesStore(state => state.provinces)
  const citysOptions = useCountriesStore(state => state.cities)
  const countryOptions = useCountriesStore(state => state.countries)
  const hierarchyOptions = useCountriesStore(state => state.hierarchy)
  const workDiagramOptions = useCountriesStore(state => state.workDiagram)
  const contractorCompanies = useCountriesStore(state => state.contractors)
  const { createEmployee } = useEmployeesData()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof accordionSchema>>({
    resolver: zodResolver(accordionSchema),
    defaultValues: {
      ...user,
      allocated_to: user?.allocated_to,
      date_of_admission: new Date(user?.date_of_admission ?? ''),
    },
  })

  const [accordion1Errors, setAccordion1Errors] = useState(false)
  const [accordion2Errors, setAccordion2Errors] = useState(false)
  const [accordion3Errors, setAccordion3Errors] = useState(false)
  const [availableToSubmit, setAvailableToSubmit] = useState(false)

  const provinceId = provincesOptions?.find(
    (province: Province) => province.name.trim() === user?.province,
  )?.id

  useEffect(() => {
    if (provinceId) {
      fetchCityValues(provinceId)
    }


    const { errors } = form.formState

    // Inicializa un nuevo estado de error para los acordeones
    const acordeon1 = []
    const acordeon2 = []
    const acordeon3 = []

    // Itera sobre los errores de validación
    for (const error of Object.keys(errors)) {
      //Si todos los acordeones tienen errores parar de iterar

      if (PERSONALDATA.find(e => e.name === error)) {
        acordeon1.push(error)
      }
      if (CONTACTDATA.find(e => e.name === error)) {
        acordeon2.push(error)
      }
      if (LABORALDATA.find(e => e.name === error)) {
        acordeon3.push(error)
      }
    }
    if (acordeon1.length > 0) {
      setAccordion1Errors(true)
    } else {
      setAccordion1Errors(false)
    }
    if (acordeon2.length > 0) {
      setAccordion2Errors(true)
    } else {
      setAccordion2Errors(false)
    }
    if (acordeon3.length > 0) {
      setAccordion3Errors(true)
    } else {
      setAccordion3Errors(false)
    }

    // Actualiza el estado de error de los acordeones
    // que se ejecute cuando cambie el estado de error y cuando ya no haya errores
  }, [form.formState.errors, provinceId])

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
      placeholder: 'Pais de nacimiento',
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
  ]
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
      label: 'Telefono',
      type: 'text',
      placeholder: 'Telefono',
      name: 'phone',
    },
    {
      label: 'Email',
      type: 'text',
      placeholder: 'Email',
      name: 'email',
    },
  ]
  const LABORALDATA = [
    {
      label: 'Legajo', //!Number
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
      label: 'Horas normales', //!Number
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
  ]

  const handleProvinceChange = (name: any) => {
    const provinceId = provincesOptions.find(
      (province: Province) => province.name.trim() === name,
    )?.id
    fetchCityValues(provinceId)
  }

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof accordionSchema>) {
    console.log(values)
    // const finalValues = {
    //   ...values,
    //   date_of_admission: values.date_of_admission?.toISOString(),
    //   province: String(
    //     provincesOptions.find(e => e.name === values.province)?.id,
    //   ),
    //   birthplace: String(
    //     countryOptions.find(e => e.name === values.birthplace)?.id,
    //   ),
    //   city: String(citysOptions.find(e => e.name === values.city)?.id),
    //   hierarchical_position: String(
    //     hierarchyOptions.find(e => e.name === values.hierarchical_position)?.id,
    //   ),
    //   workflow_diagram: String(
    //     workDiagramOptions.find(e => e.name === values.workflow_diagram)?.id,
    //   ),
    // }
    // try {
    //   createEmployee(finalValues)
    // } catch (error: PostgrestError | any) {
    //   toast({
    //     variant: 'destructive',
    //     title: error.message,
    //   })
    // }
  }

  return (
    <>
   <header className='flex flex-col gap-4 mt-6'>
        <h2 className="text-4xl">Ver Empleados</h2>
        <p>Esta sección muestra un formulario para ver los datos de los empleados:</p>
      </header>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
        <Accordion className="w-full" type="multiple" defaultValue={["personal-data","laboral-data",'contact-data']}>
          <AccordionItem value="personal-data">
            <AccordionTrigger className="text-2xl hover:no-underline">
              <div className="flex gap-5 items-center flex-wrap">
                <span className="hover:underline"> Datos personales </span>
                {accordion1Errors && (
                  <Badge
                    className="h-6 hover:no-underline"
                    variant="destructive"
                  >
                    Falta corregir algunos campos
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="w-full ">
              <div className="min-w-full max-w-sm flex flex-wrap gap-8 items-center">
                {PERSONALDATA.map((data, index) => {
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
                                  <UploadImage
                                  disabledInput={true}
                                    imageBucket="employee_photos"
                                    labelInput="Subir foto"
                                    setAvailableToSubmit={setAvailableToSubmit}
                                    onImageChange={(imageUrl: string) => {
                                      form.setValue('picture', imageUrl)
                                    }}
                                    field={field}
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
                    )
                  }
                  if (data.type === 'select') {
                    return (
                      <div
                        key={index}
                        className="w-[300px] flex flex-col gap-2"
                      >
                        <FormField
                          control={form.control}
                          name={data.name as names}
                          render={({ field }) => {
                            return (
                              <FormItem>
                                <FormLabel>{data.label}</FormLabel>

                                <SelectWithData
                                  disabled={true}
                                  placeholder={data.placeholder}
                                  options={data.options}
                                  onChange={field.onChange}
                                  editing={true}
                                  value={field.value || ''}
                                  field={{ ...field }}
                                />

                                <FormMessage />
                              </FormItem>
                            )
                          }}
                        />
                      </div>
                    )
                  } else {
                    return (
                      <div
                        key={index}
                        className="w-[300px] flex flex-col gap-2 "
                      >
                        <FormField
                          control={form.control}
                          name={data.name as names}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{data.label}</FormLabel>
                              <FormControl>
                                <Input
                                  disabled={true}
                                  type={data.type}
                                  id={data.label}
                                  placeholder={data.placeholder}
                                  className="w-[300px] bg-white"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )
                  }
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="contact-data">
            <AccordionTrigger className="text-2xl transition-all hover:no-underline">
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
                {CONTACTDATA.map((data, index) => {
                  if (data.type === 'select') {
                    return (
                      <div
                        key={index}
                        className="w-[300px] flex flex-col gap-2"
                      >
                        <FormField
                          control={form.control}
                          name={data.name as names}
                          render={({ field }) => {
                            return (
                              <FormItem>
                                <FormLabel>{data.label}</FormLabel>
                                <FormControl>
                                  <SelectWithData
                                    placeholder={data.placeholder}
                                    field={{ ...field }}
                                    options={data.options}
                                    disabled={true}
                                    editing={true}
                                    value={field.value || ''}
                                    handleProvinceChange={
                                      data.label === 'Provincia'
                                        ? handleProvinceChange
                                        : undefined
                                    }
                                    onChange={event => {
                                      if (data.name === 'province') {
                                        handleProvinceChange(event)
                                      }

                                      field.onChange(event)
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )
                          }}
                        />
                      </div>
                    )
                  } else {
                    return (
                      <div
                        key={index}
                        className="w-[300px] flex flex-col gap-2"
                      >
                        <FormField
                          control={form.control}
                          name={data.name as names}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{data.label}</FormLabel>
                              <FormControl>
                                <Input
                                disabled={true}
                                  type={data.type}
                                  id={data.label}
                                  placeholder={data.placeholder}
                                  className="w-[300px] bg-white"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )
                  }
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="laboral-data">
            <AccordionTrigger className="text-2xl hover:no-underline">
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
                {LABORALDATA.map((data, index) => {
                  if (data.name === 'date_of_admission') {
                    return (
                      <div
                        key={index}
                        className="w-[300px] flex flex-col gap-2"
                      >
                        <FormField
                          control={form.control}
                          name="date_of_admission"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Fecha de ingreso</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={'outline'}
                                      disabled={true}
                                      className={cn(
                                        'w-[300px] pl-3 text-left font-normal',
                                        !field.value && 'text-muted-foreground',
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
                                <PopoverContent
                                  className="w-auto p-0"
                                  align="start"
                                >
                                  <Calendar
                                    captionLayout="dropdown-buttons"
                                    mode="single"
                                    selected={new Date()}
                                    onSelect={field.onChange}
                                    disabled={date =>
                                      date > new Date() ||
                                      date < new Date('1900-01-01')
                                    }
                                    initialFocus
                                    locale={es}
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )
                  }
                  if (data.type === 'select') {
                    const isMultiple =
                      data.name === 'allocated_to' ? true : false

                      if (isMultiple) {
                        return (
                          <div
                          key={index}
                          className="w-[300px] flex flex-col gap-2 justify-center"
                        >
                          <FormField
                            control={form.control}
                            name={data.name as names}
                            render={({ field }) => (
  
                            <CheckboxDefaultValues
                            options={data.options}
                            disabled={true}
                            field={field}
                            placeholder='Afectado a'
                            // field={field}
                            // key={data.name}
                          />
                            )}
                          />
                        </div>
                      
                        )
                      }
                    return (
                      <div
                        key={index}
                        className="w-[300px] flex flex-col gap-2"
                      >
                        <FormField
                          control={form.control}
                          name={data.name as names}
                          render={({ field }) => {
                            return (
                              <FormItem>
                                <FormLabel>{data.label}</FormLabel>
                                <FormControl>
                                  <SelectWithData
                                  disabled={true}
                                    placeholder={data.placeholder}
                                    isMultiple={isMultiple}
                                    options={data.options}
                                    field={{ ...field }}
                                    onChange={event => {
                                      field.onChange(event)
                                    }}
                                    value={field.value || ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )
                          }}
                        />
                      </div>
                    )
                  } else {
                    return (
                      <div
                        key={index}
                        className="w-[300px] flex flex-col gap-2"
                      >
                        <FormField
                          control={form.control}
                          name={data.name as names}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{data.label}</FormLabel>
                              <FormControl>
                                <Input
                                disabled={true}
                                  type={data.type}
                                  id={data.label}
                                  placeholder={data.placeholder}
                                  pattern={data.pattern}
                                  className="w-[300px] bg-white"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )
                  }
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
      
        </Accordion>
      </form>
    </Form>
    </>
  )
}

'use client'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useCountriesStore } from '@/store/countries'
import {
  civilStateOptionsENUM,
  documentOptionsENUM,
  genderOptionsENUM,
  instrutionsOptionsENUM,
  nacionaliOptionsENUM,
  typeOfContractENUM,
} from '@/types/enums'
import { names } from '@/types/types'
import { accordionSchema } from '@/zodSchemas/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { SelectWithData } from './SelectWithData'
import { UploadImage } from './UploadImage'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { Input } from './ui/input'

type Province = {
  id: number
  name: string
}

export const EmployeeAccordion = () => {
  const fetchCityValues = useCountriesStore(state => state.fetchCities)
  const provincesOptions = useCountriesStore(state => state.provinces)
  const citysOptions = useCountriesStore(state => state.cities)
  const countryOptions = useCountriesStore(state => state.countries)
  const hierarchyOptions = useCountriesStore(state => state.hierarchy)
  const workDiagramOptions = useCountriesStore(state => state.workDiagram)
  const contractorCompanies = useCountriesStore(state => state.contractors)

  function getAccordionName(inputName: any) {
    // Divide el nombre del campo de entrada en partes
    const parts = inputName.split('-')

    // Devuelve la primera parte como el nombre del acordeón
    return parts[0]
  }
  const form = useForm<z.infer<typeof accordionSchema>>({
    resolver: zodResolver(accordionSchema),
    defaultValues: {
      lastname: '',
      firstname: '',
      nationality: undefined,
      cuil: '',
      document_type: undefined,
      document_number: '',
      birthplace: undefined,
      genre: undefined,
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
      file: undefined,
      hierarchical_position: undefined,
      company_position: '',
      workflow_diagram: undefined,
      normal_hours: '',
      type_of_contract: undefined,
      allocated_to: undefined,
      date_of_admission: '',
    },
  })

  const [accordion1Errors, setAccordion1Errors] = useState(false)
  const [accordion2Errors, setAccordion2Errors] = useState(false)
  const [accordion3Errors, setAccordion3Errors] = useState(false)

  useEffect(() => {
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
  }, [form.formState.errors])

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
      name: 'genre',
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
      type: 'text',
      placeholder: 'Legajo',
      name: 'file',
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
      type: 'text',
      placeholder: 'Horas normales',
      name: 'normal_hours',
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
      type: 'date',
      placeholder: 'Fecha de ingreso',
      name: 'date_of_admission',
    },
  ]

  const handleProvinceChange = (name: any) => {
    const provinceId = provincesOptions.find(
      (province: Province) => province.name === name,
    )?.id
    fetchCityValues(provinceId)
  }

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof accordionSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values)
  }
  const onUploadSuccess = (imageUrl: string) => {}

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
        <Accordion type="multiple" className="w-full">
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
                                <div className="flex items-center gap-8 ">
                                  <UploadImage
                                    onImageChange={(imageUrl: string) =>
                                      form.setValue('picture', imageUrl)
                                    }
                                    onUploadSuccess={onUploadSuccess}
                                    style={{ width: '100px' }}
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
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{data.label}</FormLabel>
                              <FormControl>
                                <SelectWithData
                                  placeholder={data.placeholder}
                                  options={data.options}
                                  onChange={field.onChange}
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
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
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{data.label}</FormLabel>
                              <FormControl>
                                <SelectWithData
                                  placeholder={data.placeholder}
                                  options={data.options}
                                  onChange={event => {
                                    if (data.name === 'province') {
                                      handleProvinceChange(event)
                                    }

                                    field.onChange(event)
                                  }}
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
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
                  if (data.type === 'date') {
                    <div key={index} className="w-[300px] flex flex-col gap-2">
                      <FormField
                        control={form.control}
                        name={data.name as names}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{data.label}</FormLabel>
                            <FormControl>
                              <Input
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
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{data.label}</FormLabel>
                              <FormControl>
                                <SelectWithData
                                  placeholder={data.placeholder}
                                  options={data.options}
                                  onChange={event => {
                                    if (data.name === 'province') {
                                      handleProvinceChange(event)
                                    }

                                    field.onChange(event)
                                  }}
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
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
          <Button type="submit">Submit</Button>
        </Accordion>
      </form>
    </Form>
  )
}

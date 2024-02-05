'use client'
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

import { useImageUpload } from '@/hooks/useUploadImage'
import { cn } from '@/lib/utils'
import { names } from '@/types/types'
import { accordionSchema } from '@/zodSchemas/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon } from '@radix-ui/react-icons'
import { PostgrestError } from '@supabase/supabase-js'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChangeEvent, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { CheckboxReactHookFormMultiple } from './CheckboxSelect'
import { ImageHander } from './ImageHandler'
import { SelectWithData } from './SelectWithData'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Calendar } from './ui/calendar'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { Input } from './ui/input'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { useToast } from './ui/use-toast'
import { useRouter } from 'next/navigation'

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
  const { createEmployee } = useEmployeesData()
  const { toast } = useToast()
  const router = useRouter()

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
      normal_hours: '',
      type_of_contract: undefined,
      allocated_to: undefined,
      date_of_admission: undefined,
    },
  })

  const [accordion1Errors, setAccordion1Errors] = useState(false)
  const [accordion2Errors, setAccordion2Errors] = useState(false)
  const [accordion3Errors, setAccordion3Errors] = useState(false)
  // const [availableToSubmit, setAvailableToSubmit] = useState(false)

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
    // que se ejecute cuando cambie el estado de error y cuando ya no haya errores
  }, [form.formState.errors, form.formState.isDirty, form.formState.isValid])

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
      placeholder: 'Nivel de instrucción',
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
      label: 'Código postal',
      type: 'text',
      placeholder: 'Código postal',
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
      label: 'Puesto Jerárquico',
      type: 'select',
      placeholder: 'Puesto Jerárquico',
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
  async function onSubmit(values: z.infer<typeof accordionSchema>) {
    const fileExtension = imageFile?.name.split('.').pop()
    const finalValues = {
      ...values,
      date_of_admission: values.date_of_admission?.toISOString(),
      province: String(
        provincesOptions.find(e => e.name.trim() === values.province)?.id,
      ),
      birthplace: String(
        countryOptions.find(e => e.name === values.birthplace)?.id,
      ),
      city: String(citysOptions.find(e => e.name.trim() === values.city)?.id),
      hierarchical_position: String(
        hierarchyOptions.find(e => e.name === values.hierarchical_position)?.id,
      ),
      workflow_diagram: String(
        workDiagramOptions.find(e => e.name === values.workflow_diagram)?.id,
      ),
      picture: `https://zktcbhhlcksopklpnubj.supabase.co/storage/v1/object/public/employee_photos/${values.document_number}.${fileExtension}`,
    }

    try {
      await createEmployee(finalValues)
      try {
        await handleUpload()
      } catch (error: PostgrestError | any) {
        toast({
          variant: 'destructive',
          title: error.message,
        })
      }
      router.push('/dashboard/employee')
    } catch (error: PostgrestError | any) {
      // Manejar el error de la primera petición
      toast({
        variant: 'destructive',
        title: error.message,
      })
    }
  }

  const { uploadImage, loading } = useImageUpload()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [base64Image, setBase64Image] = useState<string>('')
  // const [disabled, setDisabled] = useState<boolean>(true)

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {

    const file = event.target.files?.[0]

    if (file) {
      setImageFile(file)
      // Convertir la imagen a base64
      const reader = new FileReader()
      reader.onload = e => {
        if (e.target && typeof e.target.result === 'string') {
          setBase64Image(e.target.result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    const document_number = form.getValues('document_number')
    const fileExtension = imageFile?.name.split('.').pop()
    if (imageFile) {
      try {
        const renamedFile = new File(
          [imageFile],
          `${document_number}.${fileExtension}`,
          { type: `image/${fileExtension}` },
        )
       
        // Subir la imagen a Supabase Storage y obtener la URL
        await uploadImage(renamedFile, 'employee_photos')

        // Llamar a la función de cambio de imagen con la URL
        // onImageChange(uploadedImageUrl)

        // Llamar a la función de éxito de carga con la URL
        // onUploadSuccess(uploadedImageUrl)
        //  setAvailableToSubmit(true)
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: error.message,
        })
      }
    }
  }

  // const onImageChange = (imageUrl: string) => {
  //   form.setValue('picture', imageUrl)
  // }

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
                                <div className="flex lg:items-center flex-wrap md:flex-nowrap flex-col lg:flex-row gap-8">
                                  <ImageHander
                                    imageBucket="employee_photos"
                                    labelInput="Subir foto"
                                    handleImageChange={handleImageChange}
                                    base64Image={base64Image} //nueva
                                    loading={loading} //nueva
                                    imageFile={imageFile} //nueva
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
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{data.label}</FormLabel>

                              <SelectWithData
                                placeholder={data.placeholder}
                                options={data.options}
                                onChange={field.onChange}
                                value={field.value || ''}
                                field={{ ...field }}
                              />

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
                                  field={{ ...field }}
                                  options={data.options}
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
                              <CheckboxReactHookFormMultiple
                                options={data.options}
                                placeholder="Afectado a"
                                field={field}
                                key={data.name}
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
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{data.label}</FormLabel>
                              <FormControl>
                                <SelectWithData
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
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="w-fit">
                  <Button type="submit" className="mt-5">
                    {' '}
                    {/*  disabled={!availableToSubmit} */}
                    Agregar empleado
                  </Button>
                </p>
              </TooltipTrigger>
              <TooltipContent className="max-w-[250px]">
                {!accordion1Errors && !accordion2Errors && !accordion3Errors
                  ? '¡Todo listo para agregar el empleado!'
                  : '¡Completa todos los campos para agregar el empleado, asegurate de subir la imagen!'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Accordion>
      </form>
    </Form>
  )
}
